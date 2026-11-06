# **Azure Application Insights による Webシステムの可観測性確保**

## **1. はじめに：なぜ「動かない」のか？**

皆さんは、開発中にこんな経験はありませんか？

「ローカル環境では動いていたのに、本番環境（クラウド）に上げたらエラーになる」  
「たまに動作がすごく遅くなるが、いつ発生するかわからない」

Webシステムが複雑になると、「どこでエラーが起きているか」を特定するのは非常に困難になります。勘に頼ってコードを修正することを **「推測 (Guessing)」** と呼びますが、プロの現場ではこれは推奨されません。

必要なのは **「計測 (Measuring)」** です。  
システムが今どんな状態で、どの処理に何秒かかっているかをデータとして可視化する能力、これを **「可観測性 (Observability / オブザーバビリティ)」** と呼びます。  
今日の授業では、Azureの監視ツールを使って、あえてバグを埋め込んだWebアプリの「犯人探し（トラブルシューティング）」を行います。

## **1.5 Azure Application Insights とは？**

今回使用する **Azure Application Insights** は、Microsoft Azure が提供する **APM (Application Performance Management)** サービスです。

Webアプリに「エージェント」や「SDK」を組み込むだけで、以下の情報を自動的に収集・分析してくれます。

* **リクエストと依存関係:** ページが表示されるまでの時間や、SQLクエリにかかった時間。  
* **例外とクラッシュ:** 発生したエラーの詳細（スタックトレース）。  
* **ユーザーの行動:** どのブラウザで、どの地域からアクセスしているか。  
* **ログとトレース:** アプリが出力した logger の内容。

開発者が手動で時間を測ったり、サーバーにログインしてログファイルを漁ったりする必要がなくなり、Webブラウザ上のダッシュボードだけでシステムの健康状態を把握できるのが最大の特徴です。

## **2. 準備：Azureリソースの作成**

まずは、アプリの健康状態を保存するための「病院のカルテ」のような場所を作成します。

1. **Azure Portal** (https://www.google.com/search?q=https://portal.azure.com) にログインします。  
2. 「リソースの作成」をクリックし、検索バーに Application Insights と入力して選択します。  
3. **作成** をクリックし、以下の通り設定します。  
   * **サブスクリプション:** Azure for Students  
   * **リソースグループ:** 新規作成（名前例: rg-lesson-observability）  
   * **名前:** 任意（名前例: app-insights-yourname）  
   * **地域:** Japan East (東日本)  
   * **ワークスペースベース:** デフォルトのまま  
4. 「確認と作成」→「作成」をクリックします。  
5. デプロイが完了したら「リソースに移動」します。  
6. **【重要】** 画面右上の「**接続文字列 (Connection String)**」の値をコピーして、メモ帳などに控えておきます。  
   * ※これが、アプリからデータを送信するための「宛先」になります。

## **3. 実装：バグだらけのAPIを作る**

Pythonと高速なWebフレームワーク「FastAPI」を使って、APIサーバーを作ります。  
また、Azureへデータを送るためのライブラリ（OpenTelemetry Distro）を組み込みます。

### **3.1 環境セットアップ**

作業用フォルダを作成し、必要であればvenv等で仮想環境を作成し有効化します。その後、ターミナルで以下のコマンドを実行してライブラリをインストールします。
```bash
# Windows  
pip install fastapi uvicorn azure-monitor-opentelemetry

# Mac/Linux  
pip3 install fastapi uvicorn azure-monitor-opentelemetry
```
※ トラブルシューティング  
もし実行時に ModuleNotFoundError: No module named '_cffi_backend' というエラーが出た場合は、以下のコマンドを実行して不足しているライブラリを追加してください。  
```bash
pip install cffi
```

### **3.2 コードの作成（重要：インポート順序）**

main.py というファイルを作成し、以下のコードを記述します。  
<YOUR_CONNECTION_STRING> の部分を、先ほどコピーした自分の接続文字列に書き換えてください。  
★重要ポイント  
Azure Monitorの自動計測を有効にするため、FastAPIなどのライブラリをインポートする「前」に configure_azure_monitor を実行する必要があります。この順序が逆だと、データが送信されません。
```python

# -------------------------------------------------------------------------  
# 【重要】初期化順序  
# 自動計測を有効にするため、FastAPIなどのライブラリをインポートする「前」に  
# 必ず configure_azure_monitor を実行する必要があります。  
# -------------------------------------------------------------------------  
import logging  
import os  
import random  
import sys  
import time

# 1. まずAzure関連だけをインポート  
from azure.monitor.opentelemetry import configure_azure_monitor

# 2. 接続文字列の設定  
# 先ほどコピーした接続文字列をここに貼り付けてください  
CONNECTION_STRING = "<YOUR_CONNECTION_STRING>"

# 3. 強制送信設定（開発用）  
# アプリケーションマップでの表示名を設定  
os.environ["OTEL_SERVICE_NAME"] = "my-fastapi-app"  
# データのサンプリング（間引き）を無効化し、全てのデータを送信  
os.environ["OTEL_TRACES_SAMPLER"] = "always_on"  
os.environ["OTEL_LOGS_EXPORTER"] = "otlp"

# 4. ログ設定（コンソール出力用）  
logging.basicConfig(stream=sys.stdout, level=logging.INFO)  
# Azureライブラリの通信ログ（大量に出るため）を抑制  
logging.getLogger("azure").setLevel(logging.WARNING)

# 5. 【最重要】FastAPIインポート前にAzure Monitorを有効化  
if "InstrumentationKey" in CONNECTION_STRING:  
    try:  
        configure_azure_monitor(connection_string=CONNECTION_STRING)  
        print("INFO: Azure Monitorの設定を読み込みました（FastAPIインポート前）。")  
    except Exception as e:  
        print(f"ERROR: Azure Monitorの設定に失敗しました: {e}")  
else:  
    print("Warning: 接続文字列が設定されていません。テレメトリは送信されません。")

# 6. ここで初めてFastAPIをインポート（これにより自動計測がフックされます）  
from fastapi import FastAPI, HTTPException

# --- 以降はアプリケーションのコード ---

app = FastAPI()  
logger = logging.getLogger(__name__)

# 起動確認ログ  
logger.warning(">>> AZURE CONNECTION TEST: アプリケーションが起動しました <<<")

@app.get("/")  
async def root():  
    logger.info("トップページへのアクセスがありました。")  
    return {"message": "Hello! This is an Observable App."}

@app.get("/slow")  
async def slow_process():  
    """  
    【トラブルの種1】  
    ランダムに処理が遅延するエンドポイント。  
    """  
    delay = random.randint(1, 3) # 1~3秒のランダムな遅延  
      
    logger.warning(f"重い処理を実行中... {delay}秒かかります。")  
    time.sleep(delay) # 処理待ち（遅延）をシミュレート  
      
    return {"status": "finished", "duration": delay}

@app.get("/error")  
async def unstable_process():  
    """  
    【トラブルの種2】  
    約30%の確率で「500 Internal Server Error」が発生するエンドポイント。  
    """  
    if random.random() < 0.3: # 30%の確率でTrue  
        error_msg = "予期せぬデータベース接続エラーが発生しました！"  
        logger.error(error_msg)  
        # 500エラーを発生させる  
        raise HTTPException(status_code=500, detail="Internal Server Error Occurred")  
      
    return {"status": "success", "message": "運よく成功しました！"}
```
### **3.3 解説：なぜ print ではなく logger なのか？**

このコードで最も重要なのは、Azure専用の特殊な関数ではなく、Python標準の logging モジュールを使っている点です。

* 仕組み:  
  冒頭の configure_azure_monitor() が魔法をかけています。これを実行すると、標準の logger で出力した内容が自動的にフックされ、Azureへ転送されるようになります。  
* **メリット:**  
  1. **レベル管理:** logger.error() は「障害（Failures）」として、logger.warning() は「警告」としてAzure上で区別されます。単なる print() では、すべて同じ重要度の文字列として扱われてしまい、重大なエラーを見逃す原因になります。  
  2. **検索とフィルタリング:** Azure Portal上で「エラーレベルのログだけを表示したい」「特定のモジュールのログだけ見たい」といった高度な検索が可能になります。  
  3. **コードのポータビリティ:** Azure以外の環境（AWSやローカル）でも、設定行を変えるだけでロジックコード（logger.info など）はそのまま使い回せます。

### **3.4 コラム：良いログを書くためのベストプラクティス**

ログは「未来の自分への手紙」です。いざ障害が起きたときに役立つログを残すための、一般的なルールを紹介します。

#### **1. ログレベルを正しく使い分ける**

* **ERROR:** ユーザーへの応答失敗など、すぐに対応が必要なエラー。「夜中に叩き起こされるレベル」かどうか。  
* **WARNING:** 処理は継続できたが、異常な状態（例：リトライが発生、ディスク容量不足の予兆）。  
* **INFO:** 正常なイベントの記録（例：ログイン成功、注文完了）。「多すぎず、少なすぎず」が重要。  
* **DEBUG:** 開発時の変数値など詳細情報。本番環境では通常オフにします。

#### **2. 「5W1H」を含める**

「エラーが発生しました」だけのログは役に立ちません。文脈を含めましょう。

* **Who:** どのユーザーが？（UserIDなど）  
* **When:** いつ？（自動付与）  
* **Where:** どの機能で？（関数名など）  
* **Why:** なぜ？（エラーメッセージ、スタックトレース）  
* **Context:** 入力値や状態はどうだったか？

#### **3. 機密情報は絶対に書かない**

パスワード、APIキー、クレジットカード番号、個人情報（氏名・住所）などはログに出力してはいけません。セキュリティ事故になります。

#### **4. 構造化ログ（Structured Logging）の意識**

今回は文字列でログを出しましたが、実務では「検索しやすい形式（JSONなど）」で記録することが推奨されます。  
例： ``` logger.info("Order processed", extra={"order_id": 123, "amount": 5000})   ```
こうすると、Azure Monitor等のツールで where amount > 3000 のようなクエリ検索が可能になり、調査効率が劇的に上がります。

## **4. 実験：わざとエラーを起こす**

作成したアプリを起動し、アクセスしてデータをAzureに送ります。

1. アプリの起動  
   ターミナルで以下を実行します。  
   ```bash
   uvicorn main:app --reload
   ```
   Application startup complete. と表示されれば成功です。  
   また、コンソールに ``` >>> AZURE CONNECTION TEST: ... ``` が表示されていれば、Azureへの接続設定は成功しています。  
2. アクセスの実施  
   ブラウザを開き、以下のURLにアクセスしてください。  
   * **トップページ:** http://127.0.0.1:8000/  
     * → {"message": ...} が表示されるはずです。数回リロードしてください。  
   * **遅いページ:** http://127.0.0.1:8000/slow  
     * → 表示されるまで数秒かかります。5回ほどリロードして、遅さを体感してください。  
   * **エラーページ:** http://127.0.0.1:8000/error  
     * → 何度もF5キー（更新）を押してください。たまに Internal Server Error と表示されるはずです。10回ほど連打して、エラーを数回発生させてください。

## **5. 分析：Azure Portalで問題点を確認する**

ここからが本番です。送られたデータをAzure Application Insightsで分析し、システムの中で何が起きていたのかを「透視」します。

⚠️ データが表示されない場合（タイムラグ）  
Azureポータルへの反映には 3分〜10分ほど 時間がかかることがあります。  
「利用できるデータはありません」と表示される場合は、ブラウザで各ページへのアクセスを続けながら、少し待ってからポータルの「更新」ボタンを押してください。

### **分析1: システム全体を俯瞰する**

Azure PortalのApplication Insightsのメニューから、**「調査」** セクションにある **「アプリケーション マップ」** をクリックします。

* **確認すること:**  
  * my-fastapi-app という名前の円（ノード）が表示されていますか？  
  * エラー率（赤い表示）が見えますか？

### **分析2: エラーの原因を特定する**

メニューから **「調査」** セクションにある **「障害 (Failures)」** (または環境により **「失敗」**) をクリックします。

1. **「応答コード」** タブで 500 エラーがカウントされていることを確認します。  
2. 右側の **「操作」** リストから GET /error をクリックします。  
3. さらに右下に出てくる **「サンプル操作」** の中から、実際に起きたエラーを1つクリックして詳細を開きます。  
4. **確認すること:**  
   * **「例外 (Exception)」** の欄を見てください。Pythonコードのどの行でエラーが起きたか、スタックトレースが記録されているはずです。  
   * main.py のソースコード上で raise HTTPException を実行している行番号が、Azureポータルの画面上で特定できれば成功です。

### **分析3: 遅延の原因を特定する**

メニューから **「調査」** セクションにある **「パフォーマンス (Performance)」** をクリックします。

1. 操作リストから GET /slow を選択します。  
2. グラフを見て、平均応答時間が遅くなっていることを確認します。  
3. 右側の **「サンプル」** から、特に時間がかかったリクエスト（例: 3sなど）を選んでクリックします。  
4. **確認すること:**  
   * 画面下部（または詳細画面）に表示されている **関連ログ ("重い処理を実行中...")** を探してください。  
   * そのログが出力された直後の処理であることを確認し、ソースコードの time.sleep が遅延の正体であることを特定できれば成功です。

## **6. まとめ：クラウド時代の開発スタイル**

今日の授業で体験したのは、単なるログ出力ではありません。

* **Before:** 「ユーザーからクレームが来た」→「ログファイルをgrep検索」→「再現しない…」  
* **After:** 「アラートが飛んできた」→「ポータルで特定の1件をクリック」→「コードの行数まで即特定」

クラウド開発では、サーバーの中に入ってログファイルを見ることは少なくなります。  
代わりに、このようにアプリケーション自身がテレメトリ（診断データ）を吐き出し、外部の分析ツールで監視するというスタイルが標準になります。

### **【重要】後片付け**

授業終了後、課金を防ぐためにリソースを削除しましょう。

1. Azure Portalで「リソースグループ」(rg-lesson-observability) を開く。  
2. 「リソースグループの削除」をクリックし、グループごと削除する。