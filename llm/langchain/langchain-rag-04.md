# **LangChain RAG講座 第4回：RAGの精度向上テクニック2**

## **はじめに**

この資料は、LangChainを用いたRAG（Retrieval-Augmented Generation）システムの精度向上技術を、独力で学習できるように構成されたハンズオンガイドです。基本的なRAGシステムを構築する知識を前提に、より実践的な精度改善手法を学びます。

本稿では、RAGの検索（Retrieval）プロセスの精度に焦点を当て、以下の2つの主要なテクニックについて、単一の実行可能なPythonスクリリプトと詳細な解説を用いて学びます。

1. **Part1: チャンク戦略の最適化**: 文書分割手法の調整による検索精度の改善。  

2. **Part2: HyDE (Hypothetical Document Embeddings)**: LLMを利用して検索クエリを拡張し、検索精度を向上させる手法。

### **チャンク戦略の最適化とは**
RAGシステムにおいて、大量のドキュメントをLLMが処理しやすいように小さな塊（チャンク）に分割する際、その分割方法が検索の精度に大きく影響します。チャンク戦略の最適化とは、ドキュメントを適切なサイズと粒度で分割し、検索時に最も関連性の高い情報を効率的に取得できるようにすることを目指します。

具体的には、チャンクのサイズ（`chunk_size`）と、隣接するチャンク間の重複部分（`chunk_overlap`）を調整します。チャンクサイズが小さすぎると文脈が分断され、大きすぎるとノイズが増える可能性があります。また、オーバーラップを設定することで、チャンクの境界で文脈が途切れることを防ぎ、LLMが完全な文脈を理解しやすくなります。適切なチャンク戦略は、LLMに渡すコンテキストの質を向上させ、より正確な回答を導き出すために不可欠です。

### **HyDE (Hypothetical Document Embeddings) とは**
HyDEは、RAGの検索精度を向上させるための革新的な手法です。従来のRAGでは、ユーザーの質問文を直接埋め込みベクトルに変換し、そのベクトルとドキュメントの埋め込みベクトルを比較して関連性を判断していました。しかし、質問文とドキュメントの間に直接的なキーワードの一致が少ない場合（語彙のミスマッチ問題）、関連性の高いドキュメントを見逃す可能性がありました。

HyDEは、この問題を解決するために、まずLLMにユーザーの質問に対する「仮説的な回答」（Hypothetical Document）を生成させます。この「仮説的な回答」は、質問の意図をより正確に反映しており、ドキュメントに含まれる可能性のあるキーワードを多く含む傾向があります。そして、この「仮説的な回答」の埋め込みベクトルを使って検索を行うことで、語彙のミスマッチを解消し、より関連性の高いドキュメントを検索できるようになります。特に、質問が抽象的であったり、ドキュメントに直接的なキーワードが含まれていない場合に、HyDEは検索の精度を大幅に向上させ、結果としてLLMの回答の質も向上させることができます。

この資料を通して、より高性能なRAGシステムを自力で構築するスキルを習得しましょう。

## **1. 実行環境の準備**

まず、演習に必要なライブラリをインストールし、APIキーを安全に設定します。

### **ステップ1: ライブラリのインストール**

ターミナル（コマンドプロンプト）を開き、以下のコマンドを実行して、必要なPythonライブラリをインストールします。ベクトルストアとしてchromadbが追加されています。
```
pip install langchain langchain-openai langchain-community chromadb tiktoken beautifulsoup4 python-dotenv sentence-transformers httpx
```
### **ステップ2: OpenRouterのAPIキーを取得**

次に、LLMを利用するためのAPIキーを準備します（Embeddingはローカルで実行しますが、文章生成には引き続きOpenRouterを使用します）。

1. ブラウザで[OpenRouterのサイト](https://openrouter.ai/)にアクセスし、アカウントを作成（またはログイン）します。  
2. ログイン後、右上のアカウントメニューから**「Keys」**を選択します。  
3. 「Create Key」ボタンを押し、キーに名前を付けて作成します。  
4. 作成されたAPIキーが表示されるので、**コピーして安全な場所に保存してください**。

### **ステップ3: .envファイルを作成してAPIキーを設定**

APIキーを直接コードに書き込むのではなく、.envファイルを使って安全に管理します。

1. これから作成するPythonスクリプトと同じ場所に、.envという名前の新しいファイルを作成します。  
2. 作成した.envファイルに、以下の内容を記述します。YOUR_OPENROUTER_API_KEYの部分は、ステップ2で取得したご自身のキーに置き換えてください。  
   ```
   OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```
## **2. ハンズオン用Pythonスクリプト**

以下のコードを、お使いのエディタにコピー＆ペーストし、rag_improved.pyのような名前で保存してください。
```python
# --- ライブラリのインポート ---  
import os  
from dotenv import load_dotenv  
from langchain_community.document_loaders import WebBaseLoader  
from langchain_openai import ChatOpenAI  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain.text_splitter import RecursiveCharacterTextSplitter  
from langchain_community.vectorstores import Chroma  
from langchain.chains import RetrievalQA, HypotheticalDocumentEmbedder  
from langchain.prompts import PromptTemplate

# --- 1. 環境設定 ---

# .envファイルから環境変数を読み込む  
load_dotenv()

# OpenRouter APIのエンドポイントURLと、必須のヘッダー情報  
OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"  
OPENROUTER_HEADERS = {"HTTP-Referer": "http://localhost"}

# --- 2. LLMとEmbeddingモデルの定義 ---

print("--- LLMとEmbeddingモデルを初期化中... ---")

# .envファイルから読み込んだAPIキーをos.environ.getで取得  
api_key = os.environ.get("OPENROUTER_API_KEY")  
if not api_key:  
    raise ValueError("OpenRouterのAPIキーが設定されていません。.envファイルを確認してください。")

# LLMとしてOpenRouter経由でモデルを定義  
# ChatOpenAIの引数に直接base_urlとdefault_headersを指定することで、  
# APIリクエストが確実にOpenRouterに向かうようにします。  
llm = ChatOpenAI(  
    model="google/gemma-3-12b-it:free",  
    temperature=0,  
    openai_api_key=api_key,  
    base_url=OPENROUTER_API_BASE,  
    default_headers=OPENROUTER_HEADERS,  
)

# EmbeddingモデルとしてHuggingFaceのモデルを定義  
# これにより、Embedding処理はローカルマシン上で実行されます。  
# 初回実行時にはモデルのダウンロードが行われるため、時間がかかる場合があります。  
print("HuggingFace Embeddingモデルを読み込み中...")  
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")  
print("Embeddingモデルの読み込み完了。")

print("--- モデルの初期化完了 ---\n")

# --- 3. 対象ドキュメントの読み込み ---

print("--- 対象ドキュメントを読み込み中... ---")  
# イソップ寓話『うさぎとかめ』のURL（青空文庫）  
URL = "https://www.aozora.gr.jp/cards/001722/files/59435_73699.html"

# WebBaseLoaderのパーサー指定に関する引数は、ライブラリのバージョンによって  
# 互換性の問題が発生しやすいため、引数を削除しデフォルトの動作に任せます。  
loader = WebBaseLoader(  
    web_paths=(URL,),  
)  
documents = loader.load()  
print(f"--- ドキュメントの読み込み完了（{len(documents)}個のドキュメント） ---\n")

# ======================================================================  
# --- Part 1: チャンク戦略の最適化 ---  
# ======================================================================

print("="*60)  
print("Part 1: チャンク戦略の最適化")  
print("="*60)

# プロンプトテンプレートを定義し、日本語での回答を指示  
prompt_template = """以下のコンテキスト情報のみを使用して、質問に日本語で回答してください。  
コンテキストから答えが見つからない場合は、「コンテキストから答えが見つかりませんでした。」と回答してください。

コンテキスト:  
{context}

質問: {question}

回答（日本語）: """

PROMPT = PromptTemplate(  
    template=prompt_template, input_variables=["context", "question"]  
)

def create_qa_chain(docs, chunk_size, chunk_overlap, embedding_model, splitter_class=RecursiveCharacterTextSplitter):  
    """指定された設定でテキストを分割し、QAチェーンを構築する関数"""  
    print(f"\n--- 設定 (Chunk Size: {chunk_size}, Overlap: {chunk_overlap}) で処理開始 ---")  
      
    text_splitter = splitter_class(  
        chunk_size=chunk_size,  
        chunk_overlap=chunk_overlap  
    )  
    splits = text_splitter.split_documents(docs)  
    print(f"分割後のチャンク数: {len(splits)}")  
      
    print("ベクトルストア(Chroma)を構築中...")  
    vectorstore = Chroma.from_documents(documents=splits, embedding=embedding_model)  
      
    # プロンプトをチェーンに組み込む  
    chain_type_kwargs = {"prompt": PROMPT}  
    qa_chain = RetrievalQA.from_chain_type(  
        llm=llm,  
        chain_type="stuff",  
        retriever=vectorstore.as_retriever(),  
        chain_type_kwargs=chain_type_kwargs  
    )  
    print("QAチェーンの構築完了。")  
    return qa_chain

# 3つの異なる設定でQAチェーンを構築  
qa_chain_small = create_qa_chain(documents, 150, 0, embeddings)  
qa_chain_large = create_qa_chain(documents, 500, 0, embeddings)  
qa_chain_overlap = create_qa_chain(documents, 500, 100, embeddings)

# 各チェーンに同じ質問を投げかけて結果を比較  
question = "なぜ、うさぎは亀に負けてしまったのですか？うさぎの行動と、その結果を具体的に説明してください。"  
print(f"\n【共通の質問】: {question}\n")

print("--- [Part1 結果1] Chunk Size: 150, Overlap: 0 ---")  
response_small = qa_chain_small.invoke(question)  
print(response_small['result'])

print("\n--- [Part1 結果2] Chunk Size: 500, Overlap: 0 ---")  
response_large = qa_chain_large.invoke(question)  
print(response_large['result'])

print("\n--- [Part1 結果3] Chunk Size: 500, Overlap: 100 ---")  
response_overlap = qa_chain_overlap.invoke(question)  
print(response_overlap['result'])

# ======================================================================  
# --- Part 2: HyDE (Hypothetical Document Embeddings) ---  
# ======================================================================

print("\n" + "="*60)  
print("Part 2: HyDE (Hypothetical Document Embeddings)")  
print("="*60)

# Part1の結果から、最適なチャンク設定を使用  
text_splitter_hyde = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)  
splits_hyde = text_splitter_hyde.split_documents(documents)

# HyDE用のEmbedding関数を生成  
print("\n--- HyDE用のEmbedding関数を生成中... ---")  
hyde_embeddings = HypotheticalDocumentEmbedder.from_llm(  
    llm=llm,  
    base_embeddings=embeddings, # ここでもHuggingFaceのEmbeddingモデルを使用  
    prompt_key="web_search"  
)  
print("--- HyDE用Embedding関数の生成完了 ---")

# HyDE用のQAチェーンを構築  
print("\n--- HyDE版RAGを構築中... ---")  
vectorstore_hyde = Chroma.from_documents(documents=splits_hyde, embedding=hyde_embeddings)  
chain_type_kwargs = {"prompt": PROMPT}  
qa_chain_hyde = RetrievalQA.from_chain_type(  
    llm=llm,  
    chain_type="stuff",  
    retriever=vectorstore_hyde.as_retriever(),  
    chain_type_kwargs=chain_type_kwargs  
)  
print("--- HyDE版RAGの構築完了 ---")

# HyDEがどのような「仮説的な回答」を生成しているか確認  
print("\n\n--- HyDEが生成する「仮説的回答」の確認 ---")  
# エラー修正：HyDEのプロンプトが期待する変数名'QUESTION'（大文字）に合わせる  
hypothetical_document = hyde_embeddings.llm_chain.invoke({"QUESTION": question})  
print(f"【質問】: {question}")  
# エラー修正：llm_chain.invokeの戻り値は文字列なので、['text']キーでのアクセスは不要  
print(f"【HyDEによる仮説的回答】:\n{hypothetical_document}\n")

# 通常のRAGとHyDEを使ったRAGの回答を比較  
print("--- [Part2 比較1] 通常のRAG（最適なチャンク設定）の回答 ---")  
# response_overlapはPart 1で実行済みのもの  
print(response_overlap['result']) 

print("\n--- [Part2 比較2] HyDEを使ったRAGの回答 ---")  
response_hyde = qa_chain_hyde.invoke(question)  
print(response_hyde['result'])

print("\n--- ハンズオン終了 ---")
```
## **3. スクリプトの実行と結果の確認**

### **ステップ1: スクリプトの実行**

ターミナルで、ファイルを保存したディレクトリに移動し、以下のコマンドを実行します。  
注意： 初回実行時は、HuggingFaceからEmbeddingモデル（約90MB）をダウンロードするため、インターネット接続が必要であり、少し時間がかかります。  
python rag_improved.py

### **ステップ2: 実行結果の例と考察**

**(注意: LLMからの回答は実行するたびに細部が異なる場合がありますが、全体的な趣旨は似たものになります。)**

#### **Part 1: チャンク戦略の最適化 の実行結果**
```
============================================================  
Part 1: チャンク戦略の最適化  
============================================================  

【共通の質問】: なぜ、うさぎは亀に負けてしまったのですか？うさぎの行動と、その結果を具体的に説明してください。

--- [Part1 結果1] Chunk Size: 150, Overlap: 0 ---  
コンテキストから答えが見つかりませんでした。

--- [Part1 結果2] Chunk Size: 500, Overlap: 0 ---  
うさぎは、自分の足が速いことを自慢し、亀の足が遅いことを馬鹿にしていました。競争の途中で、まだ亀が追いついてこないだろうと油断して居眠りをしてしまったため、その間に亀に追い越され、負けてしまいました。

--- [Part1 結果3] Chunk Size: 500, Overlap: 100 ---  
うさぎは、亀の歩みが遅いのをみて油断し、競争の途中でひと眠りしてしまいました。その結果、うさぎが目を覚ました時には、亀はすでにゴールに到着しており、うさぎは負けてしまいました。
```
* **考察**:  
  * **結果1 (chunk_size=150)**: チャンクが小さすぎるため、うさぎの行動とその結果という因果関係を説明するのに必要な情報が、単一の検索では見つかりませんでした。そのため、プロンプトの指示通り「答えが見つからない」と回答しており、これはむしろ**正確な動作**と言えます。  
  * **結果2, 3 (chunk_size=500)**: チャンクサイズを大きくすることで、うさぎが「油断した」という行動の理由と、「居眠りをした」という直接の敗因、そして「負けた」という結果までの一連の流れを正確に捉えることができています。

#### **Part 2: HyDE の実行結果**
``` 
============================================================  
Part 2: HyDE (Hypothetical Document Embeddings)  
============================================================  
 
--- HyDEが生成する「仮説的回答」の確認 ---  
【質問】: なぜ、うさぎは亀に負けてしまったのですか？うさぎの行動と、その結果を具体的に説明してください。  
【HyDEによる仮説的回答】:  
イソップ寓話『うさぎとかめ』において、うさぎが亀に負けた理由は、自分の速さに過信し、競争相手である亀を侮って途中で居眠りをしてしまったからです。その油断が原因で、着実に歩みを進めていた亀に追い抜かれ、最終的に敗北しました。

--- [Part2 比較1] 通常のRAG（最適なチャンク設定）の回答 ---  
うさぎは、亀の歩みが遅いのをみて油断し、競争の途中でひと眠りしてしまいました。その結果、うさぎが目を覚ました時には、亀はすでにゴールに到着しており、うさぎは負けてしまいました。

--- [Part2 比較2] HyDEを使ったRAGの回答 ---  
うさぎは、自分の足の速さに自惚れ、亀の歩みの遅さを馬鹿にしていました。そのため、競争の途中で「ゴールまでにはまだ間がある」と油断し、居眠りをしてしまいました。その間に、亀は休むことなく歩き続け、うさぎを追い越して先にゴールに着いたため、うさぎは負けてしまいました。
```
* **考察**:  
  * **仮説的回答**: HyDEは質問文から「過信」「侮る」「油断」「居眠り」「着実に歩む亀」といった、物語の核心をつくキーワードを含む**理想的な回答文**を自ら生成しています。この「答えに近い文章」で検索することで、より関連性の高い情報を探しやすくなります。  
  * **回答の比較**: 通常のRAGも良い回答をしていますが、HyDEを使ったRAGは、「自惚れ」「馬鹿にしていた」といった、うさぎの性格にまで踏み込んだ、より詳細で質の高い回答を生成できています。これは、HyDEによって検索の精度が向上した結果と考えられます。

## **4. まとめ**

本日のハンズオンでは、RAGの精度を向上させるための2つの重要なテクニックを学びました。

* **チャンク戦略の最適化**: chunk_sizeとchunk_overlapの調整は、検索品質の土台となる最も基本的なチューニング項目です。  
* **HyDE**: 質問文が曖昧な場合や、検索したい文書とキーワードが直接一致しない場合に特に有効な手法です。  
* **プロンプトエンジニアリング**: LLMに明確な指示を与えるプロンプトを作成することも、回答の質をコントロールする上で非常に重要です。

また、Embeddingの処理をAPI経由ではなく、HuggingFaceのライブラリを用いてローカルで実行する方法も確認しました。これにより、ユースケースに応じて様々なモデルを柔軟に使い分けることが可能になります。
