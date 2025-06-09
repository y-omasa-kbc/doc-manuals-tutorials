## LangChainとOllamaを使用したMarkdown情報に基づく質疑応答システムの構築**

### **1\. はじめに**

この授業では、近年注目を集めている**LLM（大規模言語モデル）を活用したシステム開発について学びます。具体的には、オープンソースのフレームワークであるLangChain**と、ローカル環境でLLMを実行できる**Ollama**を組み合わせて、指定したMarkdownファイルの情報に特化した質疑応答システムを構築します。

**🎯 この授業のゴール**

* LangChainの基本的な仕組みと使い方を理解する。  
* ローカルLLM（Ollama）をLangChainと連携させる方法を習得する。  
* Markdownファイルから情報を読み込み、ベクトル化して検索可能にする（**RAG: Retrieval-Augmented Generation**）という一連の流れを実装できるようになる。

**🔧 開発するシステムの概要**

1. **情報源**: 提供されたMarkdownファイルを読み込む。  
2. **知識化**: ファイルの内容を小さなチャンク（塊）に分割し、それぞれを数値のベクトルに変換して「ベクトルストア」に保存する。  
3. **質問応答**: ユーザーが質問を入力すると、その質問に最も関連性の高い情報をベクトルストアから検索し、その情報を基にLLMが回答を生成する。

### **2\. RAG（Retrieval-Augmented Generation）とは？**

今回のサンプルで構築するのは、**RAG（Retrieval-Augmented Generation）** と呼ばれる技術を用いたシステムです。日本語では「検索拡張生成」と訳されます。

RAGは、LLMが元々持っている広範な知識に加えて、**外部の特定情報源**をリアルタイムで参照して回答を生成する仕組みです。これにより、以下のようなメリットが生まれます。

* **ハルシネーション（幻覚）の抑制**: LLMが知らない情報について、もっともらしい嘘の回答を作ってしまうことを防ぎます。情報源に記載がない場合は、その旨を回答させることができます。  
* **最新情報への対応**: モデル自体を再学習させることなく、外部情報源を更新するだけで最新の情報に基づいた回答が可能になります。  
* **専門的な知識の活用**: 社内ドキュメントや専門的なデータベースなど、特定の知識に基づいた応答が可能になります。

### **3\. Embedding（埋め込み）モデルとは？**

今回のシステムでは、nomic-embed-textという**Embeddingモデル**を使用します。これは、テキストの「意味」を理解し、それを数値の配列（**ベクトル**）に変換する専門のモデルです。

* なぜEmbeddingが必要か？  
  コンピュータは「LangChain」や「フレームワーク」といった単語の意味を直接理解できません。しかし、ベクトルに変換することで、単語や文章同士の意味的な近さ（関連性）を数学的に計算できるようになります。例えば、「フレームワークとは？」という質問のベクトルと、「LangChainはフレームワークです」という文章のベクトルは、ベクトル空間上で非常に近い位置に配置されます。

### **4\. ベクトルストア（Vector Store）とは？**

Embeddingモデルによってテキストから変換されたベクトルを効率的に保存し、検索するためのデータベースが**ベクトルストア**です。

* **図書館に例えると…**  
  * **本**: 情報源となるドキュメント（my\_document.md）  
  * **本の各ページ**: 分割されたチャンク  
  * **図書分類法（例: 日本十進分類法）**: Embeddingモデル  
  * **蔵書検索システム（OPAC）**: **ベクトルストア**

図書館では、膨大な本の中から目的の本を探すために検索システムを使います。同様に、ベクトルストアは、大量のベクトルデータの中から、目的のベクトル（ユーザーの質問をベクトル化したもの）に最も意味が近いベクトルを高速で見つけ出す役割を担います。

* **RAGにおける役割**  
  1. **保存**: ドキュメントの各チャンクから作られたベクトルをすべて保存します。  
  2. **高速な類似度検索**: ユーザーの質問がベクトル化されると、ベクトルストアはその質問ベクトルと意味的に最も近いチャンクのベクトルを瞬時に探し出します。

今回のサンプルコードでは、このベクトルストアの実装としてFAISS（Facebook AI Similarity Search）というライブラリを使用しています。FAISSは、特に類似度検索を高速に行うことに特化しています。

### **5\. 環境構築**

ここまでの理論を踏まえて、開発に必要なツールとライブラリをインストールしましょう。

#### **5.1. Ollamaのインストールとモデルの準備**

1. Ollamaのインストール:  
   Ollamaの公式サイトにアクセスし、お使いのOS（macOS, Linux, Windows）用のインストーラーをダウンロードしてインストールしてください。  
2. 使用するモデルのプル:  
   ターミナル（またはコマンドプロンプト）を開き、以下のコマンドを実行して、チャット用とEmbedding用の2つのモデルをダウンロードします。  
   *チャット用のモデルをダウンロード* 
   ```  
   ollama pull gemma3:4b
   ```

   *Embedding（ベクトル化）用のモデルをダウンロード* 
   ```
   ollama pull nomic-embed-text:latest  
   ```
   ```ollama list```コマンドを実行して、両方のモデルが正しくインストールされたか確認できます。

#### **5.2. Pythonライブラリのインストール**

次に、Pythonで開発するためのライブラリをインストールします。以下のコマンドをターミナルで実行してください。
```
pip install langchain langchain-community langchain-core faiss-cpu unstructured markdown langchain-ollama
```

**各ライブラリの役割**

* langchain, langchain-community, langchain-core: LangChainフレームワークの中核。  
* faiss-cpu: ベクトルデータを高速に検索するためのライブラリ（ベクトルストア）。  
* unstructured, markdown: Markdownファイルを効率的に読み込むためのライブラリ。  
* langchain-ollama: LangChainからOllamaを操作するための専用ライブラリ。

### **6\. 質疑応答システムの実装**

ここから、実際にPythonコードを書きながらシステムを構築していきます。

#### **6.1. 準備：質疑応答の対象となるMarkdownファイル**

まず、質疑応答の元になる情報を持つMarkdownファイルを作成します。今回は、my\_document.mdという名前で、以下の内容のファイルを作成してください。

**my\_document.md**
```markdown
# LangChainフレームワークについて

## 概要  
LangChainは、大規模言語モデル（LLM）を使用したアプリケーション開発を簡素化するためのフレームワークです。開発者はコンポーネントを「チェーン」として連結することで、複雑なユースケースを簡単に構築できます。

## 主要なコンポーネント  
LangChainには、以下のような主要なコンポーネントがあります。

- **Models**: LLMモデルそのものを指します。OpenAIのGPTや、Ollamaで動かすローカルモデルなどが該当します。  
- **Prompts**: LLMへの指示（プロンプト）を管理・最適化するための機能です。テンプレート化が可能です。  
- **Chains**: 複数のコンポーネントを連結し、一連の処理フローを定義します。本日の主題でもあります。  
- **Retrieval**: 外部のデータソースから情報を取得する機能です。データベースやドキュメントファイルからの検索などが含まれます。
```
#### **6.2. 実装コード (Python)**

それでは、Pythonスクリプトを作成して、質疑応答システムを実装しましょう。以下のコードをqa\_system.pyなどのファイル名で保存してください。
```python
import os  
from langchain_community.document_loaders import UnstructuredMarkdownLoader  
from langchain_text_splitters import RecursiveCharacterTextSplitter  
from langchain_ollama.chat_models import ChatOllama  
from langchain_ollama.embeddings import OllamaEmbeddings  
from langchain_community.vectorstores import FAISS  
from langchain_core.prompts import ChatPromptTemplate  
from langchain_core.runnables import RunnablePassthrough  
from langchain_core.output_parsers import StrOutputParser

# --- 1. ドキュメントの読み込みと分割 ---  
print("Step 1: ドキュメントを読み込んで分割します...")

# Markdownファイルを読み込む  
loader = UnstructuredMarkdownLoader("my_document.md")  
docs = loader.load()

# テキストをチャンク（小さな塊）に分割する  
# LLMが一度に処理できるテキスト長には限りがあるため分割が必要  
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)  
splits = text_splitter.split_documents(docs)

print(f"ドキュメントを {len(splits)} 個のチャンクに分割しました。")

# \--- 2\. ベクトル化とベクトルストアの構築 \---  
print("\nStep 2: テキストをベクトル化し、FAISSに保存します...")

# Embedding（ベクトル化）にはnomic-embed-textモデルを使用  
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# 分割したチャンクとエンベディングモデルからベクトルストア（FAISS）を作成  
# これにより、テキストの高速な類似度検索が可能になる  
vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)

# ベクトルストアを検索コンポーネント（Retriever）として設定  
retriever = vectorstore.as_retriever()

# --- 3. LLMとプロンプトの準備 ---  
print("\nStep 3: LLMとプロンプトテンプレートを準備します...")

# プロンプトテンプレートを定義  
# {context} には検索されたドキュメントが、{question} にはユーザーの質問が入る  
template = """  
以下の「情報」だけを使って、質問に答えてください。情報にないことは答えないでください。

情報：  
{context}

質問：{question}  
"""  
prompt = ChatPromptTemplate.from_template(template)

# チャットモデルにはgemma3:4bを使用  
llm = ChatOllama(model="gemma3:4b")

# 出力パーサーを定義（LLMの出力を文字列に変換）  
output_parser = StrOutputParser()

# --- 4. RAGチェーンの構築 ---  
print("\nStep 4: RAGチェーンを構築します...")

# LangChain Expression Language (LCEL) を使ってチェーンを構築  
# 処理の流れ：  
# 1. 質問を受け取る  
# 2. retrieverで関連情報を検索し、プロンプトの\`context\`に渡す  
# 3. ユーザーの質問をプロンプトの\`question\`に渡す  
# 4. prompt（プロンプト）をllm（言語モデル）に渡す  
# 5. llmの出力をoutput\_parserで整形する  
rag_chain = (  
    {"context": retriever, "question": RunnablePassthrough()}  
    | prompt  
    | llm  
    | output_parser  
)

# --- 5. 質疑応答の実行 ---  
print("\nStep 5: 質疑応答を開始します。'exit'で終了します。")

while True:  
    question = input("\n質問を入力してください: ")  
    if question.lower() == 'exit':  
        break

    # 作成したチェーンを実行して回答を生成  
    answer = rag_chain.invoke(question)

    print("\n[回答]")  
    print(answer)

print("\nプログラムを終了します。")
```
#### **6.3. 実行方法**

1. 上記コードとmy\_document.mdを同じディレクトリに保存します。  
2. ターミナルで以下のコマンドを実行します。 
  ``` 
   python qa\_system.py
  ```
3. プログラムが起動し、「質問を入力してください:」と表示されたら、Markdownファイルの内容に関する質問を入力してみましょう。

**質問例:**

* LangChainとは何ですか？  
* LangChainの主要なコンポーネントを教えて  
* Retrievalコンポーネントの役割は？

プログラムはMarkdownファイルから関連情報を探し出し、gemma3:4bモデルがその情報に基づいて回答を生成します。

### **7\. まとめ**

この授業では、LangChainとOllamaを使って、特定のドキュメントに基づいた質疑応答システムをゼロから構築しました。これにより、RAG (Retrieval-Augmented Generation) と呼ばれる、LLMの知識を外部情報で拡張する強力な技術の基礎を体験できました。