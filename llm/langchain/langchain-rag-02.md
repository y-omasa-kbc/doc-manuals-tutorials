# **第2回: LangChain RAG発展編 - 対話機能とストリーミング出力**

## **はじめに**

第1回では、LangChainを使って特定の文書に基づいた回答を生成する、基本的なRAG（Retrieval-Augmented Generation）システムを構築しました。

今回は、このRAGシステムをさらに発展させ、より実践的な **対話型のチャットボット** へと進化させます。Web UIの代わりに、すべての操作を **コマンドライン（ターミナル）** 上で行います。実装する機能は以下の2つです。

1. **ストリーミング出力**: AIの回答をターミナル上にリアルタイムで少しずつ表示します。  
2. **チャット履歴の組み込み**: 過去の会話の文脈を記憶し、それに基づいた自然な対話を実現します。

## **準備**

はじめに、開発環境の準備を行います。

### **APIキーの設定**

今回は、APIキーを直接ターミナルに設定する代わりに、.envファイルを使って管理します。この方法は、キーをコードやコマンド履歴に残さずに済むため、より安全です。

まず、プロジェクトのルートディレクトリ（app_cli.pyと同じ場所）に.envという名前のファイルを作成し、以下の内容を記述します。
```
OPENAI_API_KEY="sk-or-v1-..."  
OPENAI_API_BASE="https://openrouter.ai/api/v1"
```
**注意:** .envファイルは、Gitなどのバージョン管理システムに含めないように、.gitignoreファイルに追加することを強く推奨します。

### **ライブラリのインストール**

今回の開発に必要なライブラリをインストールします。.envファイルを読み込むためのpython-dotenv、Chromaなどの機能を含むlangchain-community、そしてHuggingFaceのEmbeddingモデルを利用するためのsentence-transformersを追加します。
```
pip install langchain langchain-openai langchain-community openai chromadb python-dotenv sentence-transformers
```
## **1. コマンドラインによる対話の基本骨格**

まず、ユーザーがターミナルから質問を入力し、AIが応答する基本的なプログラムを作成します。Pythonのinput()関数とprint()関数を使用します。

app_cli.pyというファイル名で以下のコードを保存してください。
```python
# app_cli.py  
import sys

def main():  
    print("🛰️ 対話型RAGチャットボット (CLI版)")  
    print("終了するには 'exit' または 'quit' と入力してください。")

    while True:  
        try:  
            # ユーザーからの入力を受け付ける  
            question = input("あなた: ")

            if question.lower() in ["exit", "quit"]:  
                print("プログラムを終了します。")  
                break  
              
            # AIからの応答（現時点では固定のメッセージ）  
            print("AI: ここにAIの回答が表示されます。")

        except (KeyboardInterrupt, EOFError):  
            print("\nプログラムを終了します。")  
            sys.exit()

if __name__ == '__main__':  
    main()
```
このファイルをターミナルで実行すると、対話を開始できます。
```
python app_cli.py
```
## **2. RAG Chainの準備とストリーミング対応**

次に、RAG Chainを準備し、ターミナル上でのストリーミング出力に対応させます。

### **LLMの初期化（ストリーミング有効化）**

ChatOpenAIを初期化する際にstreaming=Trueを設定します。
```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(  
    model="qwen/qwen3-8b:free",  
    streaming=True  
)
```
### **ストリーミング対応RAG Chainの構築と実行**

.stream()メソッドが返すイテレータをforループで処理し、print()関数のend=""とflush=Trueオプションを使って、受け取ったテキストの断片（チャンク）を即座に、改行せずに出力します。
```python
# (RAG Chainの準備は他のコード例と同様)  
# ...

# ユーザーの質問を受け付けた後の処理  
question = input("あなた: ")

print("AI: ", end="", flush=True)  
# .stream()の結果をforループで処理  
for chunk in rag_chain.stream(question):  
    # チャンクを改行せずに即時出力  
    print(chunk, end="", flush=True)  
# 最後に改行を追加  
print()
```
## **3. チャット履歴の組み込み**

RunnableWithMessageHistoryを利用することで、作成したRAG Chainにチャット履歴機能を追加できます。これにより、Chainは過去のやり取りを記憶し、文脈に沿った応答を返せるようになります。

実装は、RunnableWithMessageHistoryで既存のrag_chainを「ラップ」する（包み込む）ことで行います。このラッパーが、履歴の読み込み、Chainの実行、履歴の保存という一連の処理を自動的に行ってくれます。

この機能を実現するために必要な主要なコンポーネントは以下の通りです。

* **履歴対応プロンプト (**MessagesPlaceholder**)**: プロンプト内に過去の会話履歴を挿入するための場所を確保します。  
* **履歴管理オブジェクト (**ChatMessageHistory**)**: 実際の会話（誰が何を発言したか）を保存するためのオブジェクトです。  
* **履歴取得関数 (**get_session_history**)**: セッションIDごとに、対応する履歴管理オブジェクトを返す関数です。  
* **ラッパー (**RunnableWithMessageHistory**)**: 上記の要素と元のChainを統合し、履歴管理を自動化します。

これらの要素は、後述する「4. 最終的なコードと実行方法」のセクションで、# --- 3. 履歴管理機能付きChainの構築 --- のコメント部分にまとめて実装されています。

### **ユーザーの入力を保存し、次の生成に生かす流れ**

チャット履歴がどのように機能しているのか、その裏側の流れを詳しく見ていきましょう。中心的な役割を担っているのが RunnableWithMessageHistory です。

conversational_rag_chain を呼び出すと、内部では以下の処理が自動的に行われます。

1. **履歴の取得**: RunnableWithMessageHistory は、まず get_session_history 関数を呼び出し、指定されたセッションID（この場合は "cli_session"）に対応する ChatMessageHistory オブジェクトを取得します。このオブジェクトには、過去のすべてのやり取りが保存されています。  
2. **プロンプトへの入力準備**: 取得した履歴と、ユーザーからの新しい入力（{"input": "..."}）を、プロンプトが要求するキー（"chat_history" と "input"）を持つ辞書にまとめます。  
3. **RAG Chainの実行**: この辞書を、ラップされている rag_chain に渡します。rag_chain は、受け取った入力（input）を使って文書を検索し、その結果（context）と履歴（chat_history）を組み合わせて最終的なプロンプトを作成し、LLMに渡して回答を生成します。  
4. **履歴の更新**: rag_chain の実行が完了すると、RunnableWithMessageHistory は、今回のユーザーの質問（HumanMessage）と、生成されたAIの回答（AIMessage）を、ステップ1で取得した ChatMessageHistory オブジェクトに自動で追加します。

この一連の流れが、ユーザーが入力するたびに繰り返されることで、会話の文脈が維持され、連続した対話が可能になります。開発者は、この複雑な履歴管理のロジックを意識することなく、コアとなる rag_chain の構築に集中できるのです。

## **補足: VectorStoreについて (FAISS vs Chroma)**

第1回の資料ではVectorStoreとしてFAISSを利用しましたが、今回はChromaを利用しています。どちらもベクトル検索を行うための重要なコンポーネントですが、いくつかの違いがあります。ここでは、両者の特徴と、今回Chromaを選んだ理由について説明します。

| 特徴 | FAISS (Facebook AI Similarity Search) | Chroma (ChromaDB) |
| :---- | :---- | :---- |
| **種別** | **ライブラリ:** FAISSは、ベクトル検索の「計算処理」に特化したツール群です。numpyのようにコードにインポートして使います。アプリケーションの一部として動作し、検索機能を提供しますが、それ自体が独立したサービスとして動くわけではありません。 | **データベース:** Chromaは、データの「保存・管理・取得」という一連のライフサイクルを扱うために設計されたシステムです。単なる計算ツールではなく、データを構造化して永続的に保持し、APIを通じてアクセスするというデータベースの思想に基づいています。 |
| **データ保存** | **手動での永続化:** FAISSのインデックスはメモリ上に作成されます。プログラムが終了すると、その内容は消えてしまいます。データを保持するには、開発者がsave_localで明示的にファイルへ保存し、次回の実行時にload_localで読み込むという処理を自分で記述する必要があります。 | **自動での永続化:** Chromaは、データを追加すると自動的にファイルとしてディスクに保存します（デフォルト設定の場合）。次回プログラムを実行した際に、同じデータベースディレクトリを指定すれば、以前のデータをそのまま利用できます。手動での保存・読込処理が不要なため、開発がシンプルになります。 |
| **データ管理** | **ベクトルと文書の分離管理:** FAISSはベクトル自体の検索に特化しており、そのベクトルがどの文書に由来するかの情報は保持しません。そのため開発者は、FAISSが返した検索結果（ベクトルのインデックス番号）を元に、別途用意した対応表を使って手動で元の文書を紐付ける必要があります。 | **統合管理:** Chromaはベクトル、元の文書、メタデータを一つのセットとしてDBに保存します。検索すると、ベクトルに紐付いた文書そのものを直接取得できるため、開発者が手動で紐付け作業を行う必要がありません。 |
| **利用形態** | **インプロセス:** FAISSは、それを呼び出したプログラムの内部（メモリ上）でのみ動作します。これにより高速な処理が可能ですが、作成したインデックスを他のプログラムとリアルタイムで共有することは困難です。 | **インプロセス or クライアント/サーバー:** Chromaは、プログラム内部で手軽に動かすことも、独立したサーバーとして起動することも可能です。サーバーとして動かせば、複数の異なるアプリケーション（データ投入用、チャット用など）が同じデータベースにアクセスして、データを共有できます。 |

**結論として**、FAISSはパフォーマンスを極限まで追求する大規模なシステムに向いている一方、Chromaはセットアップが簡単で、ベクトルとドキュメントを一緒に管理してくれるため、開発やプロトタイピングを素早く進めたい場合に非常に便利です。今回の授業では、この手軽さと管理のしやすさからChromaを採用しました。

## **4. 最終的なコードと実行方法**

これまでの要素をすべて統合した、最終的なapp_cli.pyは以下のようになります。
```python
# app_cli.py (最終版)  
import sys  
from dotenv import load_dotenv  
from operator import itemgetter  
from langchain_openai import ChatOpenAI  
from langchain_community.vectorstores import Chroma  
from langchain_community.embeddings import HuggingFaceEmbeddings  
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder  
from langchain_core.runnables import RunnablePassthrough  
from langchain_core.output_parsers import StrOutputParser  
from langchain_core.chat_history import BaseChatMessageHistory  
from langchain.memory import ChatMessageHistory  
from langchain.schema.runnable.history import RunnableWithMessageHistory

def main():  
    # .envファイルから環境変数を読み込む  
    load_dotenv()

    # --- 1. RAGシステムの基本設定 ---  
    llm = ChatOpenAI(model="qwen/qwen3-8b:free", streaming=True)  
      
    model_name = "intfloat/multilingual-e5-large"  
    model_kwargs = {'device': 'cpu'}  
    encode_kwargs = {'normalize_embeddings': False}  
    embeddings = HuggingFaceEmbeddings(  
        model_name=model_name,  
        model_kwargs=model_kwargs,  
        encode_kwargs=encode_kwargs  
    )  
      
    texts = [  
        "宇宙エレベーターは、惑星の表面から静止軌道上にある宇宙ステーション（アース・ポート）までを結ぶ、ケーブル状の輸送機関です。地上と宇宙を、ロケットを使わずに人や物資が行き来できるようにすることを目的としています。",  
        "宇宙エレベーターの最大の利点は、輸送コストの大幅な削減です。現在のロケットによる輸送は1kgあたり数十万円かかりますが、宇宙エレベーターが実現すれば、数千円から一万円程度にまでコストを下げられると試算されています。これにより、宇宙太陽光発電や宇宙旅行がより身近なものになると期待されています。",  
        "実現に向けた最大の技術的課題は、ケーブルに使用する素材です。地球の自転による遠心力と地球の重力に耐えうる、極めて高い強度と軽さを両立した素材が必要不可欠です。現在、その最有力候補として「カーボンナノチューブ」の研究開発が進められています。",  
        "宇宙エレベーターの構造は、主に4つの要素から構成されます。地上側の発着拠点である「地上ステーション」、宇宙側の拠点となる「アース・ポート」、両者を結ぶ「ケーブル（テザー）」、そしてケーブルを昇降する「クライマー（昇降機）」です。",  
        "安全性も重要な課題です。ケーブルが万が一破断した場合のリスクや、スペースデブリ（宇宙ゴミ）との衝突、テロなどへの対策も考慮する必要があります。ケーブルの破断時には、地球の重力と遠心力のバランスにより、大部分は地球の周回軌道に巻き付くように動き、地上に直接落下する部分は限られると分析されています。"  
    ]  
      
    vectorstore = Chroma.from_texts(texts, embedding=embeddings)  
    retriever = vectorstore.as_retriever()  
    output_parser = StrOutputParser()

    # --- 2. 履歴対応プロンプトの作成 ---  
    prompt = ChatPromptTemplate.from_messages([  
        ("system", "あなたは優秀なアシスタントです。提供されたコンテキストを使って質問に答えてください。\n\nContext:\n{context}"),  
        MessagesPlaceholder(variable_name="chat_history"),  
        ("human", "{input}"),  
    ])

    def format_docs(docs):  
        return "\n\n".join(doc.page_content for doc in docs)

    # --- 3. 履歴管理機能付きChainの構築 ---  
    rag_chain = (  
        RunnablePassthrough.assign(  
            context=itemgetter("input") | retriever | format_docs  
        )  
        | prompt  
        | llm  
        | output_parser  
    )

    store = {}  
    def get_session_history(session_id: str) -> BaseChatMessageHistory:  
        if session_id not in store:  
            store[session_id] = ChatMessageHistory()  
        return store[session_id]

    # RAG Chainに履歴管理機能を追加  
    conversational_rag_chain = RunnableWithMessageHistory(  
        rag_chain,  
        get_session_history,  
        input_messages_key="input",  
        history_messages_key="chat_history",  
    )

    # --- 4. コマンドラインでの対話ループ ---  
    print("🛰️ 対話型RAGチャットボット (CLI版)")  
    print("終了するには 'exit' または 'quit' と入力してください。")  
      
    config = {"configurable": {"session_id": "cli_session"}}

    while True:  
        try:  
            question = input("あなた: ")  
            if question.lower() in ["exit", "quit"]:  
                print("プログラムを終了します。")  
                break

            print("AI: ", end="", flush=True)  
            for chunk in conversational_rag_chain.stream({"input": question}, config=config):  
                print(chunk, end="", flush=True)  
            print() # 最後に改行

        except (KeyboardInterrupt, EOFError):  
            print("\nプログラムを終了します。")  
            sys.exit()

if __name__ == '__main__':  
    main()
```
### **実行方法**

ターミナルで以下のコマンドを実行します。

python app_cli.py

### **対話の実行例**

このプログラムの対話機能（チャット履歴）の特徴がよくわかる、具体的な実行例を以下に示します。

**1回目の質問（基本的な質問）**
```
あなた: 宇宙エレベーターって何？  
AI: 宇宙エレベーターは、惑星の表面から静止軌道上にある宇宙ステーション（アース・ポート）までを結ぶ、ケーブル状の輸送機関です。地上と宇宙を、ロケットを使わずに人や物資が行き来できるようにすることを目的としています。
```
**2回目の質問（代名詞を使った質問）**

それ という代名詞を使って、前の会話の文脈を引き継いだ質問をします。
```
あなた: それの最大の利点は何ですか？  
AI: 宇宙エレベーターの最大の利点は、輸送コストの大幅な削減です。現在のロケットによる輸送は1kgあたり数十万円かかりますが、宇宙エレベーターが実現すれば、数千円から一万円程度にまでコストを下げられると試算されています。これにより、宇宙太陽光発電や宇宙旅行がより身近なものになると期待されています。
```
**ポイント:** AIは それ が「宇宙エレベーター」を指していることを理解し、文書の中から利点に関する情報を探し出して回答しています。これは、1回目のやり取りを記憶している（チャット履歴が機能している）証拠です。

**3回目の質問（さらに深掘りする質問）**

さらに文脈を引き継いで、具体的な課題について質問します。
```
あなた: 実現するための技術的な課題は何ですか？  
AI: 実現に向けた最大の技術的課題は、ケーブルに使用する素材です。地球の自転による遠心力と地球の重力に耐えうる、極めて高い強度と軽さを両立した素材が必要不可欠です。現在、その最有力候補として「カーボンナノチューブ」の研究開発が進められています。
```
**ポイント:** この質問にも「宇宙エレベーターを」という主語がありませんが、AIは会話の流れを理解しているため、問題なく技術的課題について回答できます。

## **まとめ**

今回は、コマンドラインインターフェース（CLI）で動作する対話型のRAGシステムを構築しました。

* .envファイルを使ってAPIキーを安全に管理する方法を学びました。  
* input()とprint()でユーザーとの対話を実現しました。  
* forループとprint(chunk, end="", flush=True)でストリーミング出力を実装しました。  
* RunnableWithMessageHistoryなどのLangChainのコア機能はUIに依存しないため、そのまま再利用できることを確認しました。

これにより、アプリケーションの見た目（UI）と中心的な処理（コアロジック）を分離して開発する感覚を掴むことができたかと思います。