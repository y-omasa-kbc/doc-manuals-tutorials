
## **【演習】PythonによるAzure AI Languageサービスの活用：感情分析とキーフレーズ抽出**

### **概要**

本演習では、Microsoft Azureが提供するPaaS（Platform as a Service）の一つである**Azure AI Language**を用い、その機能をローカルのPython環境からAPI経由で利用する手法を学びます。具体的なタスクとして、テキストデータに対する**感情分析 (Sentiment Analysis)** と**キーフレーズ抽出 (Key Phrase Extraction)** を実装し、クラウドベースのAIサービスを活用したアプリケーション開発の基礎を習得することを目的とします。

### **学習目標**

* クラウドAIサービスのAPI利用に関する基本フローの習得。  
* Azure AI Languageを用いたテキストデータからの情報抽出手法の理解。  
* Pythonによる外部API連携プログラミングの実践的スキルの向上。

### **1. 前提条件**

演習を開始するにあたり、以下の環境を準備してください。

* **Azureアカウント**: **Azure for Students**アカウントや無料試用版アカウントが利用可能です。未取得の場合は事前に作成してください。  
* **Python 3.x**: ローカルマシンにインストールされていること。公式サイト[python.org](https://www.python.org/)からダウンロード可能です。  
* **コードエディタ**: Visual Studio Code, PyCharmなど、任意の開発環境。

### **2. Azure Languageサービスのセットアップ**

まず、Azure Portal上でAPIの利用拠点となるリソースを作成します。

1. **Azure Portal**にサインインします。  
2. ポータル上部の検索バーに「**言語サービス**」と入力し、表示されたサービスを選択します。  
3. 「言語サービス」の管理画面で「**作成**」をクリックします。  
4. 以下の項目を設定し、リソースを作成します。  
   * **サブスクリプション**: ご自身のサブスクリプションを選択。  
   * **リソースグループ**: 「新規作成」からrg-ai-exercise-studentなど、プロジェクトを識別可能な名前で作成します。  
   * **リージョン**: **東日本 (Japan East)** を推奨します。  
   * **名前**: グローバルで一意な名前を入力します。（例: ai-lang-exercise-yourname）  
   * **価格レベル**: **Free F0**（無料枠）を選択します。  
   * 規約に関するチェックボックスを有効化し、「**確認と作成**」→「**作成**」をクリックしてデプロイを開始します。  
5. デプロイ完了後、「リソースに移動」をクリックします。  
6. リソースメニューの「**キーとエンドポイント**」セクションに移動し、以下の2つの情報を取得します。これらは後のPythonスクリプトで認証に用います。  
   * **キー1 (KEY 1)**  
   * **エンドポイント (Endpoint)**

**セキュリティ上の注意**: APIキーは認証情報であり、厳重に管理する必要があります。ソースコードへのハードコーディングは避け、実際のアプリケーション開発では環境変数やAzure Key Vaultなどの利用を検討してください。本演習では説明の便宜上、コード内に直接記述します。

### **3. Python開発環境の構築**

次に、ローカル環境でAzure AIサービスを操作するための公式SDKをインストールします。

1. 任意のターミナル（コマンドプロンプト, PowerShell, Terminalなど）を起動します。  
2. 以下のpipコマンドを実行し、azure-ai-textanalyticsライブラリをインストールします。  
   pip install azure-ai-textanalytics

   このパッケージには、本演習で利用する機能が含まれています。

### **4. プログラムの実装**

取得したキーとエンドポイントを用いて、Azure AI Languageの機能を呼び出すPythonスクリプトを作成します。

#### **4.1. 感情分析 (Sentiment Analysis)**

テキストが持つ感情（ポジティブ、ネガティブ、ニュートラル）を判定します。以下のコードをsentiment_analysis.pyとして保存し、keyとendpointの値を自身のものに置き換えてください。

**sentiment_analysis.py**
```
# 必要なモジュールをインポート  
from azure.core.credentials import AzureKeyCredential  
from azure.ai.textanalytics import TextAnalyticsClient

# Azure Languageサービスのリソース情報  
# 注意: 本番環境では環境変数などから読み込むことを推奨します  
key = "YOUR_API_KEY"  
endpoint = "YOUR_ENDPOINT_URL"

def perform_sentiment_analysis(documents):  
    """  
    与えられたドキュメントリストに対して感情分析を実行し、結果を出力する。  
    """  
    # 認証クライアントの作成  
    credential = AzureKeyCredential(key)  
    client = TextAnalyticsClient(endpoint=endpoint, credential=credential)

    try:  
        # APIを呼び出し  
        result = client.analyze_sentiment(documents=documents, language="ja")  
        docs = [doc for doc in result if not doc.is_error]

        # 結果の整形と出力  
        print("--- Sentiment Analysis Results ---")  
        for idx, doc in enumerate(docs):  
            print(f"Document: '{documents[idx]}'")  
            print(f"  Overall sentiment: {doc.sentiment}")  
            print(f"  Confidence scores: Positive={doc.confidence_scores.positive:.2f}, "  
                  f"Negative={doc.confidence_scores.negative:.2f}, "  
                  f"Neutral={doc.confidence_scores.neutral:.2f}\n")

    except Exception as err:  
        print(f"An error occurred: {err}")

if __name__ == "__main__":  
    # 分析対象のテキストデータ  
    sample_documents = [  
        "この製品のユーザーインターフェースは直感的で非常に優れている。",  
        "サービスの応答時間が遅く、頻繁にエラーが発生するため改善が必要だ。",  
        "本日の会議は午後3時に予定されている。"  
    ]  
    perform_sentiment_analysis(sample_documents)
```
**コード解説**

* from azure... import ...: Azure SDKから必要なクラスをインポートします。AzureKeyCredentialはAPIキーによる認証、TextAnalyticsClientは分析機能の本体です。  
* key**,** endpoint: Azure Portalから取得したAPIキーとエンドポイントURLを格納します。これらがAzure上のどのAIサービスに接続するかを特定します。  
* perform_sentiment_analysis(documents): 分析処理をカプセル化（ひとまとめに）する関数です。  
* credential = AzureKeyCredential(key): APIキーを使い、認証情報オブジェクトを作成します。  
* client = TextAnalyticsClient(...): エンドポイントURLと認証情報オブジェクトを渡して、AIサービスと通信するためのクライアントオブジェクトを生成します。  
* result = client.analyze_sentiment(...): クライアントオブジェクトのanalyze_sentimentメソッドを呼び出し、実際に感情分析を実行します。documents引数に分析したいテキストのリストを、language引数に言語コード（日本語は "ja"）を渡します。  
* for idx, doc in enumerate(docs):: APIからの戻り値（結果）をループ処理で一つずつ取り出します。doc.sentimentで「positive/negative/neutral」の判定結果、doc.confidence_scoresでそれぞれの感情に対する信頼度スコアを取得できます。  
* if __name__ == "__main__":: このスクリプトが直接実行された場合にのみ、以下の処理を行うというPythonの定型句です。sample_documentsリストを定義し、それを引数として分析関数を呼び出します。

#### **4.2. キーフレーズ抽出 (Key Phrase Extraction)**

テキストの主要なトピックや要点を表す語句を抽出します。keyphrase_extraction.pyとして保存してください。認証部分は共通です。

**keyphrase_extraction.py**
```
# 必要なモジュールをインポート  
from azure.core.credentials import AzureKeyCredential  
from azure.ai.textanalytics import TextAnalyticsClient

# Azure Languageサービスのリソース情報  
key = "YOUR_API_KEY"  
endpoint = "YOUR_ENDPOINT_URL"

def extract_key_phrases(documents):  
    """  
    与えられたドキュメントリストからキーフレーズを抽出する。  
    """  
    # 認証クライアントの作成  
    credential = AzureKeyCredential(key)  
    client = TextAnalyticsClient(endpoint=endpoint, credential=credential)

    try:  
        # APIを呼び出し  
        result = client.extract_key_phrases(documents=documents, language="ja")

        # 結果の出力  
        print("--- Key Phrase Extraction Results ---")  
        for idx, doc in enumerate(result):  
            if not doc.is_error:  
                print(f"Document: '{documents[idx]}'")  
                print(f"  Key Phrases: {doc.key_phrases}\n")  
            else:  
                print(f"Document '{documents[idx]}' resulted in an error: {doc.error.message}")

    except Exception as err:  
        print(f"An error occurred: {err}")

if __name__ == "__main__":  
    # 分析対象のテキストデータ  
    sample_documents = [  
        "Microsoft Azureは、スケーラブルなAIおよび機械学習サービスを提供するクラウドコンピューティングプラットフォームである。",  
        "分散システムにおいて、データの整合性を保つことは極めて重要な課題となる。"  
    ]  
    extract_key_phrases(sample_documents)
```
コード解説  
このコードの基本的な構造は感情分析と共通です。異なる点を中心に解説します。

* result = client.extract_key_phrases(...): 感情分析のanalyze_sentimentの代わりに、extract_key_phrasesメソッドを呼び出します。これにより、APIのエンドポイントが切り替わり、キーフレーズ抽出機能が実行されます。  
* print(f" Key Phrases: {doc.key_phrases}\n"): 結果オブジェクトからキーフレーズを取得するには、doc.key_phrasesプロパティにアクセスします。ここには、抽出されたキーワードがPythonのリスト形式で格納されています。  
* **エラー処理**: if not doc.is_error:で各ドキュメントの処理が成功したかを確認し、もし失敗していた場合(elseブロック)はdoc.error.messageでエラー内容を表示するようにしています。これは、堅牢なアプリケーションを開発する上で重要なエラーハンドリングの一例です。

### **5. 実行と結果の考察**

作成したスクリプトをターミナルから実行します。

# 感情分析の実行  
```
python sentiment_analysis.py
```

# キーフレーズ抽出の実行  
```
python keyphrase_extraction.py
```
**実行結果の例（感情分析）:**
```
--- Sentiment Analysis Results ---  
Document: 'この製品のユーザーインターフェースは直感的で非常に優れている。'  
  Overall sentiment: positive  
  Confidence scores: Positive=0.99, Negative=0.00, Neutral=0.01

Document: 'サービスの応答時間が遅く、頻繁にエラーが発生するため改善が必要だ。'  
  Overall sentiment: negative  
  Confidence scores: Positive=0.01, Negative=0.98, Neutral=0.01  
...
```

結果から、APIが各テキストのセンチメントを判定し、その**信頼度スコア (confidence score)** を返していることが確認できます。これらのスコアは、後続の処理（例: 顧客レビューの自動分類）の閾値として利用可能です。

### **6. 応用課題**

基本機能の実装に慣れたら、以下の課題に挑戦し、理解を深めてください。

* **テキストファイルの処理**: コマンドライン引数でテキストファイル（.txt）のパスを受け取り、ファイル内容全体を分析するプログラムに改良してください。  
* **他のAPI機能の試用**: 公式ドキュメントを参照し、**固有表現認識 (Named Entity Recognition)** recognize_entities や **言語検出 (Language Detection)** detect_language など、他のエンドポイントを試してください。  
* **エラーハンドリングの強化**: APIからのエラーレスポンス（例: サポート外の言語を指定）を意図的に発生させ、doc.errorオブジェクトの内容を確認し、より堅牢なエラー処理を実装してください。  
* **バッチ処理**: 一度に大量のドキュメント（最大5件までが推奨）をリストとして渡し、APIが一括で処理する様子を確認してください。

本演習は、クラウドAIサービスをシステムに組み込む第一歩です。ここで得た知見を基に、より高度な自然言語処理タスクへの応用をご検討ください。