# **LangChain RAG講座 第3回：RAGの精度向上テクニック**

## **1. はじめに**
これまでの授業では、LangChainを使って基本的なRAGパイプラインを構築する方法を学んできました。今回は、その**検索精度をさらに向上させるための高度な検索手法**に焦点を当て、ハンズオン形式で学んでいきます。

本資料は、まず**基本的なRAGの完全なソースコード**を示し、その動作を確認します。その後、応用として以下の3つの高度な検索手法を、それぞれ独立したコードで試していきます。

* **Multi-Query Retriever**: 検索漏れを減らす賢い質問生成  
* **Hybrid Search**: キーワードと意味の「いいとこ取り」検索  
* **Re-ranking**: 検索結果をさらに磨き上げる並べ替え

## **2. 準備**

まずは、ローカルPCのVSCode環境でハンズオンに必要なライブラリをインストールし、APIキーを設定しましょう。

### **2.1. ライブラリのインストール**

プロジェクトごとに環境を分離するため、仮想環境の作成を強く推奨します。以下の手順に従って、ライブラリをインストールしてください。

1. **VSCodeでターミナルを開く**:  
   * VSCodeの上部メニューから ターミナル > 新しいターミナル を選択し、画面下部にターミナルを開きます。  
2. **仮想環境の作成**:  
   * 開いたターミナルで、以下のコマンドを実行して.venvという名前の仮想環境を作成します。
```
python -m venv .venv
```
3. **仮想環境のアクティベート**:  
   * お使いのOSに応じて、以下のいずれかのコマンドを実行して仮想環境を有効にします。  
   * **Windowsの場合 (PowerShell):**  
    ```
     .venvScriptsActivate.ps1
    ```
   * **macOS / Linuxの場合:**  
    ```
     source .venv/bin/activate
    ```
   * 成功すると、ターミナルの行頭に (.venv) のような表示が追加されます。  
4. **ライブラリのインストール**:  
   * アクティベートされたターミナルで、以下のコマンドを実行して、必要なライブラリをすべてインストールします。
```
pip install langchain langchain-openai langchain-community chromadb sentence-transformers tiktoken rank_bm25 python-dotenv
```
### **2.2. APIキーの設定**

ローカル環境で安全にAPIキーを管理するため、.envファイルを使用します。

1. **.envファイルの作成**: VSCodeのエクスプローラーで、プロジェクトのルートディレクトリに .env という名前のファイルを新規作成します。  
2. **APIキーの記述**: 作成した.envファイルに、以下のようにご自身の**OpenRouterのAPIキー**を記述して保存します。このキーはLLM（文章生成）の呼び出しに使用します。  
    ```
    OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ```
## **3. 基本的なRAGパイプラインの実装と実行**

最初に、RAGの基本となるパイプラインの完全なソースコードを見ていきましょう。このコードは、テキストファイルを読み込み、それをベクトル化して保存し、質問応答を行うまでの一連の流れを実装しています。

### **3.1. 完全なソースコード (基本形)**

以下のコードを basic_rag.py のような名前で保存してください。
```python
import os  
from dotenv import load_dotenv  
from langchain_openai import ChatOpenAI  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain_community.document_loaders import TextLoader  
from langchain.text_splitter import RecursiveCharacterTextSplitter  
from langchain_community.vectorstores import Chroma  
from langchain.chains import RetrievalQA

def main():  
    # --- 1. 準備 ---  
    # .envファイルからAPIキーを読み込み  
    load_dotenv()  
      
    # OpenRouterのAPIキーを環境変数から取得  
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")  
    if not openrouter_api_key:  
        print("OPENROUTER_API_KEYが.envファイルに設定されていません。")  
        return

    print(f"読み込まれたOpenRouter APIキーの末尾5文字: ...{openrouter_api_key[-5:]}")

    # サンプルドキュメントの準備  
    sample_text = """  
Geminiは、Googleによって開発されたマルチモーダルAIモデルです。  
テキスト、画像、音声、動画など、さまざまな種類の情報を統合的に処理できます。  
Geminiには、能力に応じてUltra、Pro、Nanoの3つのサイズがあります。

Gemini Ultraは、非常に複雑なタスクに対応できる、最も高性能なモデルです。  
その能力は、MMLU（Massive Multitask Language Understanding）と呼ばれる、  
専門家レベルの知識を測定するベンチマークで、人間の専門家を上回るスコアを記録した初のモデルとして知られています。  
主にデータセンターやエンタープライズ向けのアプリケーションで利用されることが想定されています。

Gemini Proは、幅広いタスクに対応できる、汎用性の高いモデルです。  
パフォーマンスとコストのバランスに優れており、Google AI StudioやGoogle Cloud Vertex AIを通じて利用できます。  
多くの開発者が利用するであろう主要なモデルと位置づけられています。

Gemini Nanoは、スマートフォンなどのオンデバイス環境で効率的に動作するように設計された、最も軽量なモデルです。  
ネットワーク接続がない状況でも、要約や翻訳などのタスクを高速に実行できます。  
Androidアプリへの組み込みなどが期待されています。

これらのモデルは、Googleのプロダクト、例えば検索や広告、Chrome、Bard（現Gemini）などに順次統合されています。  
開発者は、Google AI StudioやVertex AIのAPIを通じて、Gemini Proを利用したアプリケーションを構築できます。  
"""  
    with open("gemini_document.txt", "w", encoding="utf-8") as f:  
        f.write(sample_text)

    # --- 2. 基本的なRAGパイプラインの構築 ---  
    # LLM (OpenRouter経由)  
    llm = ChatOpenAI(  
        model="google/gemma-3-12b-it:free",  
        temperature=0,  
        base_url="https://openrouter.ai/api/v1",  
        api_key=openrouter_api_key  
    )  
    # Embedding (ローカルのHuggingFaceモデル)  
    # 初回実行時にモデルのダウンロードが自動的に行われます。  
    print("Embeddingモデルを読み込んでいます...")  
    embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-large")  
    print("Embeddingモデルの読み込みが完了しました。")

    # ドキュメントの読み込み、分割  
    loader = TextLoader("gemini_document.txt", encoding="utf-8")  
    documents = loader.load()  
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)  
    texts = text_splitter.split_documents(documents)

    # ベクトルストア(Chroma)の作成  
    print("ドキュメントをベクトル化しています...")  
    vectorstore = Chroma.from_documents(texts, embeddings)  
    print("ベクトル化が完了しました。")

    # QAチェーンの作成  
    base_qa_chain = RetrievalQA.from_chain_type(  
        llm=llm,  
        chain_type="stuff",  
        retriever=vectorstore.as_retriever()  
    )

    # --- 3. 実行 ---  
    question = "Gemini Proについて教えてください。"  
    print(f"\n質問: {question}")  
    response = base_qa_chain.invoke(question)  
    print(f"回答: {response['result']}")

if __name__ == "__main__":  
    main()
```
### **3.2. 実行方法**

1. 上記のコードを basic_rag.py として保存します。  
2. .env ファイルに OPENROUTER_API_KEY が正しく設定されていることを確認します。  
3. VSCodeのターミナルで、以下のコマンドを実行します。  
   python basic_rag.py

4. 初回実行時には、Embeddingモデル（intfloat/multilingual-e5-large）のダウンロードが行われるため、少し時間がかかります。  
5. 実行結果として、まずAPIキーの末尾5文字が表示され、その後に質問への回答が表示されることを確認してください。

## **4. 高度な検索手法**

基本のRAGが動作することを確認できたら、次に応用として検索精度を向上させる3つのテクニックを試してみましょう。

### **4.1. Multi-Query Retriever**

#### **解説**

このコードは、ユーザーからの1つの質問を、LLMを使って複数の異なる視点からの質問に自動的に書き換えるMultiQueryRetrieverを実装しています。

* **アイデア**: ユーザーの質問が曖昧だったり、表現が一つしかない場合、関連する情報を見逃す可能性があります。そこで、LLMに「この質問は、別の言い方をするとどうなる？」と考えさせ、生成された複数の質問で検索をかけることで、検索範囲を広げ、情報の見逃しを減らします。  
* **コードのポイント**:  
  * MultiQueryRetriever.from_llm(): この関数で、基本的なリトリーバー（base_retriever）と、質問を生成するためのLLM（llm）を渡すだけで、簡単にMulti-Query Retrieverを作成できます。  
  * logging.basicConfig(...): ログ出力を有効にしています。これを設定すると、LLMがどのような質問を新たに生成したかがターミナルに表示されるため、裏側で何が起きているかを理解するのに役立ちます。

#### **ソースコード (multi_query_rag.py)**
```python
import os  
import logging  
from dotenv import load_dotenv  
from langchain_openai import ChatOpenAI  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain_community.document_loaders import TextLoader  
from langchain.text_splitter import RecursiveCharacterTextSplitter  
from langchain_community.vectorstores import Chroma  
from langchain.chains import RetrievalQA  
from langchain.retrievers.multi_query import MultiQueryRetriever

logging.basicConfig(level=logging.INFO)  
logging.getLogger("langchain.retrievers.multi_query").setLevel(logging.INFO)

def main():  
    # --- 準備 ---  
    load_dotenv()  
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")  
    if not openrouter_api_key:  
        print("OPENROUTER_API_KEYが.envファイルに設定されていません。")  
        return  
    print(f"読み込まれたOpenRouter APIキーの末尾5文字: ...{openrouter_api_key[-5:]}")

    llm = ChatOpenAI(model="google/gemma-3-12b-it:free", temperature=0, base_url="https://openrouter.ai/api/v1", api_key=openrouter_api_key)  
    embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-large")  
      
    loader = TextLoader("gemini_document.txt", encoding="utf-8")  
    documents = loader.load()  
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)  
    texts = text_splitter.split_documents(documents)  
    vectorstore = Chroma.from_documents(texts, embeddings)  
    base_retriever = vectorstore.as_retriever()

    # --- Multi-Query Retrieverを使ったQAチェーンの構築 ---  
    multi_query_retriever = MultiQueryRetriever.from_llm(retriever=base_retriever, llm=llm)  
    qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=multi_query_retriever)

    # --- 実行 ---  
    question = "一番小さいGeminiモデルについて教えて"  
    print(f"\n質問: {question}")  
    response = qa_chain.invoke(question)  
    print(f"回答: {response['result']}")

if __name__ == "__main__":  
    main()
```
### **4.2. Hybrid Search (EnsembleRetriever)**

#### **解説**

このコードは、「ハイブリッド検索」を実現するEnsembleRetrieverを実装しています。これは、性質の異なる2つの検索方法を組み合わせるテクニックです。

* **アイデア**: ベクトル検索（意味の近さで検索）は文脈を捉えるのが得意ですが、専門用語や固有名詞などのキーワードの一致を見逃すことがあります。一方、キーワード検索（BM25）はその逆です。EnsembleRetrieverは、この2つの「いいとこ取り」をすることで、より頑健な検索を実現します。  
* **コードのポイント**:  
  * BM25Retriever: 伝統的なキーワード検索アルゴリズム。from_documents()で簡単に作成できます。  
  * EnsembleRetriever: retrievers引数に、組み合わせたいリトリーバーのリスト（今回はBM25とChroma）を渡します。weights引数で、それぞれの検索結果をどのくらいの重みで評価するかを指定できます（例: [0.5, 0.5]なら均等）。

#### **ソースコード (hybrid_search_rag.py)**
```
import os  
from dotenv import load_dotenv  
from langchain_openai import ChatOpenAI  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain_community.document_loaders import TextLoader  
from langchain.text_splitter import RecursiveCharacterTextSplitter  
from langchain_community.vectorstores import Chroma  
from langchain.chains import RetrievalQA  
from langchain.retrievers import BM25Retriever, EnsembleRetriever

def main():  
    # --- 準備 ---  
    load_dotenv()  
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")  
    if not openrouter_api_key:  
        print("OPENROUTER_API_KEYが.envファイルに設定されていません。")  
        return  
    print(f"読み込まれたOpenRouter APIキーの末尾5文字: ...{openrouter_api_key[-5:]}")

    llm = ChatOpenAI(model="google/gemma-3-12b-it:free", temperature=0, base_url="https://openrouter.ai/api/v1", api_key=openrouter_api_key)  
    embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-large")

    loader = TextLoader("gemini_document.txt", encoding="utf-8")  
    documents = loader.load()  
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)  
    texts = text_splitter.split_documents(documents)  
    vectorstore = Chroma.from_documents(texts, embeddings)

    # --- Hybrid Search (EnsembleRetriever)を使ったQAチェーンの構築 ---  
    bm25_retriever = BM25Retriever.from_documents(texts)  
    bm25_retriever.k = 2  
    chroma_retriever = vectorstore.as_retriever(search_kwargs={"k": 2})  
    ensemble_retriever = EnsembleRetriever(retrievers=[bm25_retriever, chroma_retriever], weights=[0.5, 0.5])  
    qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=ensemble_retriever)

    # --- 実行 ---  
    question = "MMLUで高いスコアを出したモデルは何ですか？"  
    print(f"\n質問: {question}")  
    response = qa_chain.invoke(question)  
    print(f"回答: {response['result']}")

if __name__ == "__main__":  
    main()
```
### **4.3. Re-ranking**

#### **解説**

このコードは、取得した検索結果をより精度の高いモデルで並べ替える「Re-ranking（リランキング）」を実装しています。

* **アイデア**: 最初の検索（ベクトル検索など）は高速ですが、完全に関連性の高い順に並んでいるとは限りません。そこで、まず大まかに関連しそうな文書を多めに取得し（1段階目）、その後、より精密な「クロスエンコーダ」モデルを使って、質問と各文書の関連度を再計算し、本当に重要な文書だけを厳選します（2段階目）。  
* **コードのポイント**:  
  * base_retriever = vectorstore.as_retriever(search_kwargs={"k": 5}): 最初の検索では、少し多めの5件を取得するように設定します。  
  * HuggingFaceCrossEncoder: リランキングを行うためのモデルをHugging Faceから読み込みます。クロスエンコーダは、質問と文書をペアで入力するため、単純なベクトル検索より高精度な関連度スコアを計算できます。  
  * CrossEncoderReranker: 読み込んだモデルを使って、実際に並べ替えを行うコンポーネントです。top_n=3で、最終的に上位3件の文書だけを残すように指定しています。  
  * ContextualCompressionRetriever: このリトリーバーが、ベースとなるリトリーバーとリランカーを組み合わせる役割を果たします。

#### **ソースコード (reranking_rag.py)**
```
import os  
from dotenv import load_dotenv  
from langchain_openai import ChatOpenAI  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain_community.document_loaders import TextLoader  
from langchain.text_splitter import RecursiveCharacterTextSplitter  
from langchain_community.vectorstores import Chroma  
from langchain.chains import RetrievalQA  
from langchain.retrievers import ContextualCompressionRetriever  
from langchain.retrievers.document_compressors import CrossEncoderReranker  
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

def main():  
    # --- 準備 ---  
    load_dotenv()  
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")  
    if not openrouter_api_key:  
        print("OPENROUTER_API_KEYが.envファイルに設定されていません。")  
        return  
    print(f"読み込まれたOpenRouter APIキーの末尾5文字: ...{openrouter_api_key[-5:]}")  
      
    llm = ChatOpenAI(model="google/gemma-3-12b-it:free", temperature=0, base_url="https://openrouter.ai/api/v1", api_key=openrouter_api_key)  
    embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-large")

    loader = TextLoader("gemini_document.txt", encoding="utf-8")  
    documents = loader.load()  
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)  
    texts = text_splitter.split_documents(documents)  
    vectorstore = Chroma.from_documents(texts, embeddings)

    # --- Re-rankingを使ったQAチェーンの構築 ---  
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})  
    model = HuggingFaceCrossEncoder(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2")  
    compressor = CrossEncoderReranker(model=model, top_n=3)  
    compression_retriever = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=base_retriever)  
    qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=compression_retriever)

    # --- 実行 ---  
    question = "開発者はどのモデルを使ってアプリケーションを構築できますか？"  
    print(f"\n質問: {question}")  
    response = qa_chain.invoke(question)  
    print(f"回答: {response['result']}")

if __name__ == "__main__":  
    main()
```
## **5. まとめ**

今回は、RAGの検索精度を向上させるための、3つの高度な検索手法を学びました。

| テクニック | 概要 | 特に有効なケース |
| :---- | :---- | :---- |
| **Multi-Query Retriever** | 質問を複数の視点から再生成して検索 | 質問が曖昧な場合、検索漏れを防ぎたい場合 |
| **Hybrid Search** | キーワード検索とベクトル検索を組み合わせる | 固有名詞や専門用語が重要な場合 |
| **Re-ranking** | クロスエンコーダで取得文書を再評価し並べ替え | 検索結果にノイズが多い場合、LLMへの入力を最適化したい場合 |

これらのテクニックは、どれか一つだけが優れているというわけではなく、それぞれに得意な状況があります。また、複数を組み合わせることも可能です。皆さんがRAGシステムを開発する際には、ぜひこれらのテクニックを試し、自分の課題に最も適した手法を見つけてください。

本日の授業は以上です。お疲れ様でした！