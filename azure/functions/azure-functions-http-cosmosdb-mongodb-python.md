# **Azure Functions と Azure Cosmos DB for MongoDB 連携ハンズオン**

## **1. はじめに**

このハンズオンでは、前回学習した **Azure Functions** を拡張し、NoSQL データベースサービスである **Azure Cosmos DB for MongoDB** と連携する方法を学びます。

具体的には、HTTPリクエストをトリガーとして、Pythonで記述された関数を実行し、Cosmos DBにデータを保存したり、保存されたデータを読み取ったりする一連の流れを体験します。この資料は、現在主流の **v2プログラミングモデル** (function_app.pyを使用) に準拠しています。

## **2. Azure Cosmos DB for MongoDB 概論**

**Azure Cosmos DB** は、Microsoftが提供する、**グローバルに分散**された**マルチモデルデータベースサービス**です。地理的に離れた複数のAzureリージョンにデータを簡単に複製できるため、世界中のユーザーに対して低遅延でデータを提供することが可能です。

**「マルチモデル」** とは、NoSQLの様々なデータモデル（キーバリュー、ドキュメント、グラフなど）を単一のサービスでサポートしていることを意味します。その中でも **Azure Cosmos DB for MongoDB** は、非常に人気の高いドキュメント指向データベースである **MongoDB** のプロトコル（API）と互換性を持つモードです。

## **3. 学習目標**

* Azure Cosmos DB for MongoDB のリソースを作成し、基本的な設定ができる。  
* Azure Functions から Cosmos DB への接続設定を構成できる。  
* Python と pymongo ライブラリを使用して、Cosmos DB のデータを操作する関数を function_app.py に作成できる。  
* HTTPトリガーを利用して、Cosmos DB にデータを追加 (Create) および取得 (Read) する Web API を作成できる。

## **4. 前提条件**

* Azure の有効なサブスクリプションを持つアカウント。  
* Visual Studio Code がインストールされていること。  
* 以下の VS Code 拡張機能がインストールされていること。  
  * Azure Account  
  * Azure Functions  
* Azure Functions Core Tools (v4) がインストールされていること。  
* Python (3.8以上を推奨) がインストールされ、パスが通っていること。  
* 前回の授業資料 ([azure-functions-http-basic-python.md](./azure-functions-http-basic-python.md)) に基づく、HTTPトリガー関数の作成経験があること。

## **5. ハンズオン手順**

### **ステップ1: Azure Cosmos DB for MongoDB アカウントの作成**

まず、データの格納先となる Cosmos DB アカウントを Azure Portal 上に作成します。

1. [Azure Portal](https://portal.azure.com/) にサインインします。  
2. 画面左上の「**＋リソースの作成**」をクリックします。  
3. 検索ボックスに「Azure Cosmos DB」と入力し、表示された「Azure Cosmos DB」を選択して「**作成**」をクリックします。  
4. API を選択する画面が表示されます。「**Azure Cosmos DB for MongoDB**」の「**作成**」をクリックします。  
5. 次にリソースの種類を選択する画面が表示されます。このハンズオンでは従来のRU(Request Unit)モデルを使用します。「**Request unit (RU) database account**」の「**作成**」をクリックしてください。  
6. 以下の情報を入力して、Cosmos DB アカウントを作成します。

| 設定項目 | 説明・入力値 |
| :---- | :---- |
| **Workload Type** | **Development/Testing** を選択します。（学習・開発用途のため） |
| **サブスクリプション** | ご自身のサブスクリプションを選択します。 |
| **リソースグループ** | 「**新規作成**」をクリックし、cosmos-functions-rg など、わかりやすい名前を付けます。 |
| **アカウント名** | **世界で一意**な名前を付けます（例: cosmos-functions-yourname-YYYYMMDD）。 |
| **場所** | 「**東日本 (Japan East)**」など、任意のリージョンを選択します。 |
| **容量モード** | 「**プロビジョニング済みスループット**」を選択します。 |
| **Free Tier Discount の適用** | 「**適用**」を選択すると、一定の範囲で無料で利用できます。学習目的なので推奨します。 |

7. 入力後、「**確認および作成**」をクリックし、内容を確認してから「**作成**」をクリックします。デプロイが完了するまで数分かかります。

### **ステップ2: データベースとコレクションの作成**

Cosmos DB アカウント内に、データを格納するためのデータベースとコレクションを作成します。

1. デプロイが完了したら、「**リソースに移動**」をクリックして、作成した Cosmos DB アカウントのページに移動します。  
2. 左側のメニューから「**データ エクスプローラー**」を選択します。  
3. 「**New Database**」をクリックし、以下の情報を入力してデータベースを作成します。  
   * **Database name**: TodoDB  
4. 作成した TodoDB の隣にある「**...**」をクリックし、「**New Collection**」を選択して、以下の情報を入力してコレクションを作成します。  
   * **Collection id**: Tasks  
   * **Sharding**: 「**Unsharded (up to 20GB)**」を選択します。  
   * ※ シャーディングは大規模データを分散させるための仕組みですが、今回は小規模なため Unsharded を選択します。  
5. 「**OK**」をクリックしてコレクションを作成します。

### **ステップ3: 接続文字列の取得**

Functions から Cosmos DB に接続するために必要な「接続文字列」を取得します。

1. Cosmos DB アカウントの左側メニューを下にスクロールし、「**設定**」カテゴリにある「**接続文字列**」を選択します。  
2. 表示された接続文字列の中から、「**プライマリ接続文字列**」の右にあるコピーアイコンをクリックして、文字列をコピーします。この文字列は後ほど使用するため、メモ帳などに一時的に保存しておきます。

### **ステップ4: Azure Functions プロジェクトと仮想環境の準備**

1. ターミナルで作業用のディレクトリを作成して移動します。  
   ```
   mkdir cosmos-functions-project-v2  
   cd cosmos-functions-project-v2
   ```

2. venv という名前でPythonの仮想環境を作成します。
   ```
   python -m venv venv
   ```

3. 作成した仮想環境を有効化（アクティベート）します。  
   * **Windows (コマンドプロンプト / PowerShell) の場合:**  
    ```
     .\venv\Scripts\activate
    ```
   * **macOS / Linux の場合:**  
    ```
     source venv/bin/activate
    ```

有効化されると、ターミナルのプロンプトの先頭に (venv) と表示されます。

1. 仮想環境が有効な状態で、Functions プロジェクトを初期化します。  
   ```
   func init --python
   ```
2. VS Code でこのフォルダを開きます。  
   ```
   code .
   ```

### **ステップ5: 接続文字列のローカル設定**

取得した接続文字列を、Functions のローカル設定ファイルに安全に保存します。

1. VS Code のエクスプローラーで local.settings.json ファイルを開きます。  
2. "Values" の中に、Cosmos DB の接続文字列を追加します。キーの名前は CosmosDBConnectionString とします。  
   ```json
   {  
     "IsEncrypted": false,  
     "Values": {  
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",  
       "FUNCTIONS_WORKER_RUNTIME": "python",  
       "CosmosDBConnectionString": "ここにステップ3でコピーした接続文字列を貼り付けます"  
     }  
   }
   ```
   **【注意】** local.settings.json は、パスワードなどの機密情報を含むため、Gitなどのバージョン管理システムにコミットしないでください。.gitignore ファイルに local.settings.json が含まれていることを確認してください。

### **ステップ6: 仮想環境へのライブラリのインストール**

1. requirements.txt ファイルを開き、プロジェクトに必要なライブラリを記述します。 
   ``` 
   azure-functions  
   pymongo  
   dnspython
   ```
2. ターミナルで、仮想環境が有効化されていることを確認した上で、次のコマンドを実行してライブラリをインストールします。  
   ```
   pip install -r requirements.txt  
   ```
### **ステップ7: RESTful API 関数の実装 (function_app.py)**

v2プログラミングモデルとRESTfulな設計思想に基づき、リソース (tasks) に対する操作を実装します。

1. VS Codeのターミナル（仮想環境が有効な状態）で、HTTPトリガーの雛形を作成します。関数名はリソース名に合わせて tasks とします。  
   ```
   func new --name tasks --template "HTTP trigger"
   ```
   これにより、function_app.py ファイル内に tasks という名前の関数が1つ作成されます。  
2. 生成された function_app.py ファイルを開き、内容全体を以下のコードに書き換えます
```python
import sys
from pathlib import Path

# --- モジュールが見つからないエラー(ModuleNotFoundError)への対策 ---
# Azure Functionsのローカル実行環境が仮想環境(venv)を
# 正しく認識しない場合があるため、ライブラリのパスを直接追加します。
# このコードはWindows環境を想定しています。
# macOS/Linuxをお使いの場合は、"Lib"の部分を "lib/pythonX.Y/site-packages" など、
# 実際のsite-packagesのパスに合わせて変更してください。(X.YはPythonのバージョン)
venv_path = Path(__file__).parent / "venv" / "Lib" / "site-packages"
sys.path.append(str(venv_path))

import logging
import os
import json
import pymongo
from bson import ObjectId

import azure.functions as func

# FunctionAppインスタンスを作成
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# MongoDBのObjectIdをJSONシリアライズ可能な文字列に変換するカスタムエンコーダー
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

# POST /api/tasks : 新しいタスクを作成
@app.route(route="tasks", methods=["POST"])
def create_task(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a POST request to /tasks.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON format in request body.", status_code=400)

    # リクエストボディに必須の 'task' フィールドがあるかチェック
    if 'task' not in req_body:
        return func.HttpResponse("Bad request. The 'task' field is required.", status_code=400)

    try:
        connection_string = os.environ["CosmosDBConnectionString"]
        client = pymongo.MongoClient(connection_string)
        db = client["TodoDB"]
        collection = db["Tasks"]
        
        result = collection.insert_one(req_body)
        logging.info(f"Inserted document with id: {result.inserted_id}")
        
        # MongoDBが自動生成した_idをレスポンスに含めるため、req_bodyを更新
        req_body['_id'] = result.inserted_id
        
        return func.HttpResponse(
            body=json.dumps(req_body, cls=JSONEncoder),
            status_code=201, # 201 Created
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return func.HttpResponse("An error occurred while processing the request.", status_code=500)

# GET /api/tasks : 全てのタスクを取得
@app.route(route="tasks", methods=["GET"])
def get_tasks(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a GET request to /tasks.')

    try:
        connection_string = os.environ["CosmosDBConnectionString"]
        client = pymongo.MongoClient(connection_string)
        db = client["TodoDB"]
        collection = db["Tasks"]

        tasks = list(collection.find({}))
        
        return func.HttpResponse(
            body=json.dumps(tasks, cls=JSONEncoder),
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return func.HttpResponse("An error occurred while processing the request.", status_code=500)

```
#### **function_app.py コード解説**

ここでは、Azure Functions と Cosmos DB for MongoDB を連携させるための function_app.py ファイルのコードについて、セクションごとに詳しく解説します。

**1. ModuleNotFoundError への対策**
```
import sys  
from pathlib import Path

# --- モジュールが見つからないエラー(ModuleNotFoundError)への対策 ---  
# Azure Functionsのローカル実行環境が仮想環境(venv)を  
# 正しく認識しない場合があるため、ライブラリのパスを直接追加します。  
# このコードはWindows環境を想定しています。  
# macOS/Linuxをお使いの場合は、"Lib"の部分を "lib/pythonX.Y/site-packages" など、  
# 実際のsite-packagesのパスに合わせて変更してください。(X.YはPythonのバージョン)  
venv_path = Path(__file__).parent / "venv" / "Lib" / "site-packages"  
sys.path.append(str(venv_path))
```
* **目的**: Azure Functionsのローカル実行ツール (func start) が、プロジェクト用に作成した仮想環境(venv)内のライブラリ（pymongoなど）を見つけられない問題を解消するためのコードです。  
* Path(__file__).parent: 現在のファイル (function_app.py) があるディレクトリのパスを取得します。  
* / "venv" / "Lib" / "site-packages":そこから仮想環境内のライブラリが格納されているsite-packagesフォルダへのパスを組み立てます。  
* sys.path.append(...): 組み立てたパスを、Pythonがライブラリを探しに行く場所のリスト(sys.path)に強制的に追加します。これにより、import pymongo が成功するようになります。

**2. 主要ライブラリのインポート**
```
import logging      # ログ出力用  
import os           # 環境変数(接続文字列など)の読み込み用  
import json         # JSONデータの操作用  
import pymongo      # MongoDB (Cosmos DB) を操作するための主要ライブラリ  
from bson import ObjectId # MongoDB固有のID形式を扱うため  
import azure.functions as func # Azure Functionsの機能を利用するため
```
* アプリケーションで必要となるPythonの標準ライブラリや、今回インストールした外部ライブラリをインポートしています。

**3. FunctionAppの初期化**
```
# FunctionAppインスタンスを作成  
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
```
* Azure Functions v2 プログラミングモデルの中心となる FunctionApp オブジェクトを作成します。  
* http_auth_level=func.AuthLevel.ANONYMOUS: この関数アプリのHTTPトリガーの認証レベルを設定しています。ANONYMOUSは「匿名」を意味し、APIキーなしで誰でもアクセスできる設定です。開発やテスト段階では便利ですが、本番環境では FUNCTION や ADMIN など、よりセキュアな設定を検討します。

**4. JSONEncoder クラス**
```
# MongoDBのObjectIdをJSONシリアライズ可能な文字列に変換するカスタムエンコーダー  
class JSONEncoder(json.JSONEncoder):  
    def default(self, o):  
        if isinstance(o, ObjectId):  
            return str(o)  
        return json.JSONEncoder.default(self, o)
```
* **目的**: MongoDBが自動で生成する _id は、ObjectId という特殊なデータ型です。この型は、Python標準のjson.dumps()関数ではJSON形式の文字列に変換できず、エラーになります。  
* このカスタムクラスは、json.JSONEncoder を継承し、default メソッドをオーバーライド（上書き）しています。  
* データが ObjectId 型であった場合に、それを単純な文字列 (str(o)) に変換する処理を追加することで、エラーを防いでいます。

**5. create_task 関数 (タスク作成: POST)**
```
# POST /api/tasks : 新しいタスクを作成  
@app.route(route="tasks", methods=["POST"])  
def create_task(req: func.HttpRequest) -> func.HttpResponse:  
    # ... (処理内容)
```
* @app.route(...): このデコレーターが、関数を特定のHTTPリクエストに応答させます。  
  * route="tasks": この関数が http://localhost:7071/api/tasks というパスに対応することを意味します。  
  * methods=["POST"]: この関数は POST メソッドのリクエストのみを受け付けます。  
* **処理の流れ**:  
  1. req.get_json(): リクエストのボディ部分をJSONとして読み込みます。  
  2. os.environ["CosmosDBConnectionString"]: local.settings.json に設定した接続文字列を環境変数として読み込みます。  
  3. pymongo.MongoClient(...): 接続文字列を使ってCosmos DBへの接続を確立します。  
  4. collection.insert_one(req_body): 受け取ったJSONデータをデータベースのTasksコレクションに挿入します。  
  5. func.HttpResponse(...): 処理結果をクライアントに返します。status_code=201 は「リソースの作成に成功した」ことを示すHTTPステータスコードです。

**6. get_tasks 関数 (タスク取得: GET)**
```
# GET /api/tasks : 全てのタスクを取得  
@app.route(route="tasks", methods=["GET"])  
def get_tasks(req: func.HttpRequest) -> func.HttpResponse:  
    # ... (処理内容)
```
* @app.route(...): create_task と同じパス (route="tasks") ですが、こちらは methods=["GET"] に設定されているため、GET メソッドのリクエストを処理します。  
* **処理の流れ**:  
  1. Cosmos DBへの接続を確立します（create_taskと同様）。  
  2. collection.find({}): Tasksコレクション内の**すべての**ドキュメント（タスク）を検索して取得します。{} は「条件なし」を意味します。  
  3. list(...): 取得したデータをリスト形式に変換します。  
  4. json.dumps(tasks, cls=JSONEncoder): 取得したタスクのリストを、先ほど定義したカスタムの JSONEncoder を使ってJSON文字列に変換します。これにより ObjectId が正しく処理されます。  
  5. func.HttpResponse(...): 変換したJSONデータをレスポンスのボディに含めて、クライアントに返します。status_code=200 は「成功」を示す標準的なステータスコードです。


### **ステップ8: 実行とテスト**

作成したRESTful APIをローカルで実行し、APIテストクライアント（VS Codeの拡張機能である Thunder Client や、Postman など）を使って動作を確認します。

#### **1. Azure Functions のローカル実行**

まず、開発用サーバーを起動します。

1. VS Code のターミナルを開きます。  
2. 仮想環境が有効になっていること（ターミナルのプロンプトの先頭に (venv) と表示されていること）を確認します。有効でない場合は、以下のコマンドで有効化してください。  
   * **Windows:** .\venv\Scripts\activate  
   * **macOS/Linux:** source venv/bin/activate  
3. 次のコマンドを実行して、Functionsホストを開始します。  
   ```
   func start
   ```
4. 起動に成功すると、ターミナルに以下のようなURLが表示されます。これが今回テストするAPIのエンドポイントです。  
   ```
   Functions:  
           tasks: [GET,POST] http://localhost:7071/api/tasks
   ```
#### **2. タスクの作成 (POSTリクエスト)**

APIテストクライアントを使用して、新しいタスクをデータベースに作成します。

1. お使いのAPIテストクライアントで、新しいリクエストを作成します。  
2. 以下の情報を設定します。  
   * **メソッド (Method):** POST  
   * **URL:** http://localhost:7071/api/tasks  
3. **ヘッダー (Headers)** タブで、以下のキーと値を追加します。これは、送信するデータがJSON形式であることをサーバーに伝えます。  
   * **キー:** Content-Type  
   * **値:** application/json  
4. **ボディ (Body)** タブを選択し、送信するデータをJSON形式で入力します。  
   ```json
   {  
       "task": "RESTful APIの設計",  
       "category": "Work",  
       "completed": false  
   }
   ```
5. **「送信 (Send)」** ボタンをクリックしてリクエストを実行します。  
6. **レスポンス (Response)** として、以下のようにステータスコード 201 Created と、作成されたデータ（_idが追加されている）が返ってくれば成功です。  
   ```
   {  
       "task": "RESTful APIの設計",  
       "category": "Work",  
       "completed": false,  
       "_id": "..."  
   }
   ```
7. 同様に、ボディの内容を変えて、もう一つタスクを作成してみましょう。 
   ``` 
   {  
       "task": "買い物リストを更新",  
       "category": "Private",  
       "completed": true  
   }
   ```
#### **3. Azure Portal でのデータ確認**

リクエストが成功したか、実際にデータベースの中身を見て確認します。

1. Azure Portal を開き、このハンズオンで作成したCosmos DBアカウントに移動します。  
2. 左側のメニューから「データ エクスプローラー」を選択します。  
3. TodoDB -> Tasks -> Items を順に展開します。  
4. 先ほどPOSTリクエストで送信した2つのタスクが、ドキュメントとして保存されていることを確認できます。

#### **4. 全タスクの取得 (GETリクエスト)**

次に、作成したすべてのタスクをまとめて取得します。

1. APIテストクライアントで、新しいリクエストを作成します。  
2. 以下の情報を設定します。今回はボディや特別なヘッダーは不要です。  
   * **メソッド (Method):** GET  
   * **URL:** http://localhost:7071/api/tasks  
3. **「送信 (Send)」** ボタンをクリックしてリクエストを実行します。  
4. **レスポンス (Response)** として、ステータスコード 200 OK と、データベースに保存されている全てのタスクがJSONの配列（[ ]で囲まれた形式）で返ってくれば成功です。  
   ```
   [  
       {  
           "_id": "...",  
           "task": "RESTful APIの設計",  
           "category": "Work",  
           "completed": false  
       },  
       {  
           "_id": "...",  
           "task": "買い物リストを更新",  
           "category": "Private",  
           "completed": true  
       }  
   ]
   ```
以上で、作成したAPIの基本的な動作確認は完了です。

## **6. Azureへのデプロイ**

ローカルでの動作確認が完了したら、APIをAzureにデプロイします。
   ( デプロイ先となるAzure Functions アプリケーションがない場合は作成してください。)

1. **VS CodeからAzureへデプロイ**  
   * VS CodeのアクティビティバーからAzureアイコンを選択します。  
   * RESOURCESビューでデプロイする対象のアプリケーションを表示し、右クリックします。
   * コンテキストメニューから、「Deploy to Function App...」 を選択します。

2. **デプロイした関数アプリに接続文字列を設定する**  
   * Azure Portalでデプロイした関数アプリのページを開き、左側メニューの「設定」セクションから「**環境変数**」を選択します。  
   * 「アプリケーション設定」タブが表示されていることを確認し、「**+ 追加**」をクリックします。  
   * **名前**の欄に CosmosDbConnectionString、**値**の欄に（手順3.8でコピーしたCosmos DBのプライマリ接続文字列）を入力し、「OK」と「保存」をクリックして変更を適用します。  
3. **デプロイしたAPIのテスト**  
   * Azure Portalでデプロイした関数アプリのページを開き、「関数」からcreate_itemまたはget_itemsを選択し、「関数のURLの取得」でベースURLを取得します。エンドポイントは /api/items です。  
   * ローカルテストと同様にAPIテストツールを使って、今度はURLを**デプロイ先のURL**に変更してPOSTとGETのリクエストを送信し、動作を確認してください。

これで、クラウド上で実行される関数アプリが、Cosmos DBに接続できるようになりました。デプロイしたAPIのエンドポイント（URLはAzure Portalの関数アプリの概要ページで確認できます）に対して、ローカルと同様のテストを行ってみましょう。

## **7. まとめ**

このハンズオンでは、Azure FunctionsとCosmos DBというサーバーレスアーキテクチャの強力な組み合わせについて、以下の重要なスキルを学びました。

* **Azureリソースの作成**: Azure Portal を使用して、Web APIのバックエンドとなるCosmos DBアカウント、データベース、コレクションを作成しました。  
* **ローカル開発環境の構築**: venv を用いてPythonの仮想環境を構築し、プロジェクトに必要なライブラリ (pymongo など) を独立した環境で管理する手法を実践しました。  
* **RESTful APIの実装**: Azure Functions の v2プログラミングモデルを利用し、単一のエンドポイント (/api/tasks) に対してHTTPメソッド (GET/POST) で処理を分岐させる、モダンで分かりやすいAPIを実装しました。  
* **データベース連携**: pymongo ライブラリを使い、Function AppからCosmos DBへ接続し、データの永続化（作成・読み取り）を行いました。  
* **実践的なテスト**: APIテストクライアントを使い、作成したAPIが正しく動作することを体系的に確認しました。  
* **クラウドへのデプロイ**: 開発したアプリケーションをAzureにデプロイし、公開するまでの一連の流れを体験しました。

これらの知識と経験は、スケーラブルで効率的なWebアプリケーションやサービスを開発するための確かな土台となります。

## **8. 発展課題**

今回のハンズオンで作成したAPIを、さらに本格的なものに発展させてみましょう。

* **完全なCRUD操作の実装**:  
  * GET /api/tasks/{id}: 特定のIDを持つタスクを1件取得する。  
  * PUT /api/tasks/{id}: 特定のタスクの内容を更新する。  
  * DELETE /api/tasks/{id}: 特定のタスクを削除する。  
