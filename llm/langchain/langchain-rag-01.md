# LangChain RAG 第1回 - Python, LangChain, OpenRouterによるPDF QAシステム構築

## **序論**

本資料は、Python、LangChain、OpenRouterを用いて、PDFファイルの内容について質問応答を行うRAG（Retrieval-Augmented Generation）システムを構築する手順について解説します。

本稿では、多様な大規模言語モデル（LLM）へのアクセスを統一するOpenRouterと、LLMアプリケーション開発を効率化するフレームワークLangChainを組み合わせ、実践的なQAシステムを構築します。

## **1. 概要：RAG、LangChain、OpenRouter**

はじめに、本稿で利用する主要技術について説明します。

### **RAG (Retrieval-Augmented Generation)**

RAGは、大規模言語モデル（LLM）が外部の知識ベース（本稿ではPDFファイル）を参照しながら回答を生成する技術です。「検索（Retrieval）」と「生成（Generation）」の二つのプロセスを組み合わせることで、LLMが元々学習していない情報や、より専門的な内容に関しても、根拠に基づいた回答を生成することが可能になります。

**RAGの処理フロー**
```
ユーザー：「このPDFの要点は？」  
  │  
  └─ RAGシステム ─┐  
                  │ 1. PDF内から質問に関連する部分を検索 (Retrieval)  
                  │  
                  │ 2. 検索結果と質問をLLMに提示  
                  │    (プロンプト例：「以下の文脈を参考に、質問に回答してください。文脈：...」)  
                  │  
                  └─ LLMが文脈を基に回答を生成 (Generation)  
                        │  
                        └─ 回答：「このPDFの要点は〇〇です。」
```
### **LangChainとOpenRouterの役割**

* **LangChain**: LLMを利用したアプリケーション開発のための多様なコンポーネントを提供するフレームワークです。データ読み込み、テキスト分割、LLMとの連携といった定型的な処理をモジュール化し、開発を効率化します。  
* **OpenRouter**: 複数の提供元（Google, OpenAI, Mistral AI等）が提供する大規模言語モデル（LLM）を、単一のAPIキーで統一的に利用可能にするサービスです。これにより、異なるモデルの比較検証が容易になります。

## **2. 環境構築：必要なライブラリのインストール**

プロジェクトのディレクトリを作成し、ターミナルで以下のコマンドを実行して、venv という名前の仮想環境を作成します。
```
python -m venv venv
```
作成した仮想環境を有効化します。
**macOS / Linux の場合:**
```
source venv/bin/activate
```
**Windows (コマンドプロンプト / PowerShell) の場合:**
```
.\venv\Scripts\activate
```

開発に必要となるPythonライブラリをインストールします。ターミナルで以下のコマンドを実行します。
```
pip install langchain langchain-community langchain-openai openai pypdf faiss-cpu sentence-transformers
```
**主要ライブラリの役割:**

* langchain, langchain-community, langchain-openai: LangChain本体および関連コンポーネント  
* openai: OpenRouterへの接続にOpenAIクライアントライブラリの形式を利用  
* pypdf: PDFファイルの読み込み  
* faiss-cpu: テキスト検索を高速化するベクトルストア  
* sentence-transformers: テキストをベクトル表現に変換する埋め込みモデルの利用

## **3. APIキーの設定**

OpenRouterの利用にはAPIキーの取得が必要です。

1. [OpenRouter公式サイト](https://openrouter.ai/)にアクセスし、アカウントを登録します。  
2. ログイン後、アカウント設定画面からKeysを選択し、+ Create KeyをクリックしてAPIキーを生成します。  
3. 生成されたキーをコピーし、環境変数として設定します。

**注意**: APIキーは第三者に漏洩しないよう厳重に管理してください。ソースコードへの直接的な記述は避け、環境変数として設定することが推奨されます。

## **4. RAGシステムの構築手順**

本セクションでは、RAGシステムを構築する具体的な手順をコードと共に解説します。任意のPDFファイルをsample.pdfとして、スクリプトと同一のディレクトリに配置してください。

### **Step 1: PDFの読み込みと分割**

PyPDFLoaderを用いてPDFファイルの内容を読み込み、RecursiveCharacterTextSplitterでLLMが処理可能な長さのチャンク（テキストの断片）に分割します。
```python
from langchain_community.document_loaders import PyPDFLoader  
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. PDFの読み込み  
file_path = "sample.pdf"  
loader = PyPDFLoader(file_path)  
documents = loader.load()

# 2. テキストの分割  
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)  
texts = text_splitter.split_documents(documents)

print(f"ドキュメントを {len(texts)} 個のチャンクに分割しました。")
```

### **Step 2: テキストのベクトル化とベクトルストアへの格納**

分割したテキストチャンクを、意味的な近傍検索が可能になるベクトル表現に変換します。この処理を**Embedding（埋め込み）**と呼びます。

#### **HuggingFaceとは**

**HuggingFace**は、AIモデルとデータセットのための主要なプラットフォームであり、「AI分野におけるGitHub」とも言えます。開発者はHuggingFace Hubを通じて、オープンソースで高性能なAIモデルを自身のアプリケーションに容易に組み込むことが可能です。

#### **HuggingFaceEmbeddingsとは**

HuggingFaceEmbeddingsは、LangChainのコンポーネントであり、HuggingFace Hub上で公開されている埋め込み（Embedding）モデルを少ないコード量で呼び出すことを可能にします。

本稿では、多言語に対応し、特に日本語の処理性能が高いintfloat/multilingual-e5-largeモデルを利用して、テキストのベクトル化を行います。ベクトル化されたデータは、高速な類似度検索を実現するため、ベクトルストアであるFAISSに格納します。
```python
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain_community.vectorstores import FAISS

# 3. Embeddingモデルの準備 (HuggingFace Hubから)  
model_name = "intfloat/multilingual-e5-large"   
embeddings = HuggingFaceEmbeddings(model_name=model_name)

# 4. ベクトルストアの構築  
vectorstore = FAISS.from_documents(texts, embeddings)

print("ベクトルストアの準備が完了しました。")
```
### **Step 3: LLMの準備**

回答生成の核となるLLMを準備します。ChatOpenAIクラスを利用し、接続先としてOpenRouterを指定します。

* model_name: OpenRouterで利用するモデル名を指定します。（例: google/gemma-7b-it）  
* openai_api_base: OpenRouterのエンドポイントURLを指定します。
```python
from langchain_openai import ChatOpenAI

# 5. LLMの準備 (OpenRouter経由)  
llm = ChatOpenAI(  
    model_name="qwen/qwen3-8b:free",  
    openai_api_base="https://openrouter.ai/api/v1",  
    temperature=0, # 回答の多様性を制御。0は決定的な出力を促す  
    max_tokens=1000  
)

print(f"LLM ({llm.model_name}) の準備が完了しました。")
```
### **Step 4: RAGチェーンの構築と実行**

これまでに準備したベクトルストア（Retrieverとして機能）とLLMをRetrievalQAチェーンとして統合します。このチェーンが、RAGの一連の処理、すなわち「質問に関連する文書チャンクの検索」から「検索結果を文脈としたLLMによる回答生成」までを自動的に実行します。
```python
from langchain.chains import RetrievalQA

# 6. RAGチェーンの作成  
qa_chain = RetrievalQA.from_chain_type(  
    llm=llm,  
    chain_type="stuff", # すべての検索結果を単一のプロンプトにまとめる方式  
    retriever=vectorstore.as_retriever()  
)

# 7. 質問応答の実行  
question = "このPDFの著者名を教えてください。"  
print(f"\n質問: {question}")

response = qa_chain.invoke(question)  
print("回答:")  
print(response["result"])
```
## **5. 全体コード**

以下に、ここまでの手順を統合した完全なスクリプトを示します。このコードをpdf_qa.pyなどのファイル名で保存し、実行してください。
```python
import os  
from langchain_community.document_loaders import PyPDFLoader  
from langchain.text_splitter import RecursiveCharacterTextSplitter  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain_community.vectorstores import FAISS  
from langchain_openai import ChatOpenAI  
from langchain.chains import RetrievalQA

def main():  
    # --- 1. 環境設定 ---  
    # 環境変数 "OPENROUTER_API_KEY" からAPIキーを読み込む  
    api_key = os.environ.get("OPENROUTER_API_KEY")  
    if not api_key:  
        print("エラー: 環境変数 'OPENROUTER_API_KEY' が設定されていません。")  
        print("APIキーを設定後、再度実行してください。")  
        return

    # --- 2. PDFの読み込みと分割 ---  
    file_path = "sample.pdf"  
    if not os.path.exists(file_path):  
        print(f"エラー: ファイル '{file_path}' が見つかりません。")  
        return  
          
    print(f"'{file_path}' を読み込んでいます...")  
    loader = PyPDFLoader(file_path)  
    documents = loader.load()  
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)  
    texts = text_splitter.split_documents(documents)  
    print(f"ドキュメントを {len(texts)} 個のチャンクに分割しました。")

    # --- 3. Embeddingとベクトルストアの構築 ---  
    print("Embeddingモデルをロード中...（初回実行時はモデルのダウンロードに時間を要する場合があります）")  
    model_name = "intfloat/multilingual-e5-large"  
    embeddings = HuggingFaceEmbeddings(model_name=model_name)  
      
    print("ベクトルストアを構築中...")  
    vectorstore = FAISS.from_documents(texts, embeddings)

    # --- 4. LLMの準備 (OpenRouter) ---  
    llm = ChatOpenAI(  
        model_name="qwen/qwen3-8b:free",  
        openai_api_base="https://openrouter.ai/api/v1",  
        openai_api_key=api_key,  
        temperature=0,  
        max_tokens=1000  
    )  
    print(f"LLM ({llm.model_name}) の準備が完了しました。")

    # --- 5. RAGチェーンの作成と実行 ---  
    qa_chain = RetrievalQA.from_chain_type(  
        llm=llm,  
        chain_type="stuff",  
        retriever=vectorstore.as_retriever()  
    )

    print("\n--- PDFに関する質問応答ループを開始 ---")  
    while True:  
        question = input("\n質問を入力してください (終了する場合は 'exit' を入力): ")  
        if question.lower() == 'exit':  
            print("プログラムを終了します。")  
            break  
          
        print("回答を生成中...")  
        response = qa_chain.invoke(question)  
        print("\n回答:")  
        print(response["result"])

if __name__ == "__main__":  
    main()
```
## **6. まとめと今後の展望**

本稿では、LangChainとOpenRouterを利用して、PDFの内容に基づき質問応答を行うRAGシステムを構築する手順を解説しました。

### **本稿の要点**

* **RAG**: 検索によって外部知識をLLMに提供し、回答の精度と具体性を向上させる技術。  
* **LangChain**: LLMアプリケーション開発における定型的な処理をコンポーネント化し、開発を効率化するフレームワーク。  
* **HuggingFace**: 公開されている多様な学習済みモデル（本稿ではEmbeddingモデル）を容易に利用可能にするプラットフォーム。  
* **OpenRouter**: 複数のLLMプロバイダーのモデルを単一のインターフェースで利用可能にし、モデルの切り替えや比較を容易にするサービス。
