## **OpenAPI とは何か？ API設計の共通言語を学ぼう**

### **OpenAPIの概要**

OpenAPIは、**RESTful APIの仕様を記述するための世界標準のフォーマット**です。以前は「Swagger」という名前で知られていました。

APIを開発する際、「どのようなエンドポイントがあるのか？」「どのようなデータを送れば良いのか？」「どのようなデータが返ってくるのか？」といった情報を、開発者間で正確に共有する必要があります。OpenAPIは、これらのAPIの仕様を、**人間とコンピュータの両方が理解できる形式**で記述するためのルールを定めています。

この仕様書（YAMLまたはJSON形式で記述）があることで、APIに関するコミュニケーションが円滑になり、開発プロセスを大幅に効率化できます。

### **なぜOpenAPIを使うのか？**

OpenAPIを利用することで、以下のような多くのメリットが得られます。

* **APIドキュメントの自動生成**: 仕様書から、見やすくインタラクティブなAPIドキュメントを自動で作成できます。これにより、ドキュメント作成の手間が省け、常に最新の状態を保てます。  
* **コードの自動生成**: APIの仕様書を基に、クライアント（フロントエンド）がAPIを呼び出すためのコード（SDK）や、サーバー（バックエンド）の雛形となるコード（スタブ）を自動生成できます。  
* **テストの自動化**: 仕様書通りのリクエストを送信し、レスポンスが正しいかを確認するテストを簡単に作成できます。  
* **仕様と実装の一貫性**: APIの仕様書が「正」となるため、設計と実装の間の認識のズレを防ぎ、開発チーム全体で一貫した開発が可能になります。

## **OpenAPIドキュメントの基本構造**

OpenAPIの仕様書は、いくつかの主要なセクションから構成される一つのYAML（またはJSON）ファイルです。まずは、APIの詳細を記述する前の骨格となる、最も重要な3つのセクションについて見ていきましょう。
```yaml
# OpenAPI仕様のバージョンを記述します。必須項目です。  
openapi: 3.0.3

# APIに関する基本情報（メタデータ）を記述します。  
info:  
  title: ユーザー管理API  
  description: ユーザー情報の取得、作成、更新、削除を行うためのAPIです。  
  version: 1.0.0

# APIがホストされているサーバーの情報を記述します。  
servers:  
  - url: https://api.example.com/v1  
    description: 本番環境サーバー  
  - url: https://stg-api.example.com/v1  
    description: ステージング環境サーバー
```
* openapi (必須)  
  この仕様書が、どのバージョンのOpenAPI Specificationに準拠しているかを示す文字列です。ツールなどがこのバージョンを解釈して正しく処理するために必要となります。現在、広く使われているのは 3.0.x 系です。  
* info (必須)  
  APIそのものに関する基本情報を定義するオブジェクトです。  
  * title: APIのタイトルです。  
  * description: APIが何をするものなのか、詳細な説明を記述します。  
  * version: APIの現在のバージョンを記述します。1.0.0 のようなセマンティックバージョニングが一般的です。  
* servers  
  APIへの接続情報（エンドポイント）を定義するオブジェクトの配列です。urlにはAPIのベースURLを記述します。開発環境、ステージング環境、本番環境など、複数のサーバーがある場合は、それぞれを配列の要素として定義することができます。

## **OpenAPIの書き方：リソースのCRUD操作を定義する**

次に、APIの最も基本となる、リソースに対するCRUD（Create, Read, Update, Delete）操作の定義方法を見ていきましょう。ここでは「ユーザー管理API」を例に、各操作を個別に解説します。

* **Create**: POSTメソッドを使い、新しいリソースを作成します。  
* **Read**: GETメソッドを使い、リソースを読み取ります。  
* **Update**: PUTまたはPATCHメソッドを使い、既存のリソースを更新します。  
* **Delete**: DELETEメソッドを使い、リソースを削除します。

### 【補足：コードサンプルの見方について】
以下のコードサンプルは、説明のためにCRUDの各操作を個別に抜き出したものです。実際には、これらはOpenAPIドキュメントのpathsという大きなセクションの中に、各パス（例: /usersや/users/{userId}）ごとにまとめて記述します。各サンプルがドキュメント全体のどの部分に該当するのかを意識しながらご覧ください。
以下の内容を実際に記述する際は
```yaml
paths:  
  /users  
    post:  
      summary: 新規ユーザー作成 (Create)  
# 省略
    get:  
      summary: ユーザー一覧取得 (Read)    
# 省略
  /users/{userId}:        
    get:  
      summary: 特定ユーザー取得 (Read)        
# 省略
    put:
      summary: ユーザー情報更新 (Update)  
# 省略
    delete:  
      summary: ユーザー削除 (Delete)  
# 省略
```

### **1\. 新規ユーザー作成 (Create) - POST /users**

新しいユーザーを作成するためのエンドポイントです。requestBody で作成するユーザーの情報（名前、メールアドレス）を受け取ります。
```yaml
# paths:  
#   /users:  
    post:  
      summary: 新規ユーザー作成 (Create)  
      description: 新しいユーザーを作成します。  
      requestBody:  
        required: true  
        content:  
          application/json:  
            schema:  
              type: object  
              properties:  
                name:  
                  type: string  
                email:  
                  type: string  
              required:  
                - name  
                - email  
      responses:  
        '201':  
          description: ユーザーの作成に成功
```
### **2\. ユーザー一覧の取得 (Read) - GET /users**

登録されている全てのユーザーを一覧で取得します。レスポンスとしてユーザーオブジェクトの配列が返されます。
```yaml
# paths:  
#   /users:  
    get:  
      summary: ユーザー一覧取得 (Read)  
      description: 登録されている全てのユーザー情報を一覧で取得します。  
      responses:  
        '200':  
          description: ユーザー一覧の取得に成功  
          content:  
            application/json:  
              schema:  
                type: array  
                items:  
                  type: object  
                  properties:  
                    id:  
                      type: integer  
                    name:  
                      type: string  
                    email:  
                      type: string  
                  required:  
                    - id  
                    - name  
                    - email
```
### **3\. 特定ユーザーの取得 (Read) - GET /users/{userId}**

パスパラメータで指定されたIDを持つ、特定のユーザー1件の情報を取得します。
```yaml
# paths:  
#   /users/{userId}:  
    get:  
      summary: 特定ユーザー取得 (Read)  
      parameters:  
        - name: userId  
          in: path  
          required: true  
          schema:  
            type: integer  
      responses:  
        '200':  
          description: ユーザー情報の取得に成功  
          content:  
            application/json:  
              schema:  
                type: object  
                properties:  
                  id:  
                    type: integer  
                  name:  
                    type: string  
                  email:  
                    type: string  
                required:  
                  - id  
                  - name  
                  - email
```
### **4\. ユーザー情報の更新 (Update) - PUT /users/{userId}**

指定されたIDのユーザー情報を更新します。PUTはリソース全体を置き換える意味合いで使われることが多いです。
```yaml
# paths:  
#   /users/{userId}:  
    put:  
      summary: ユーザー情報更新 (Update)  
      parameters:  
        - name: userId  
          in: path  
          required: true  
          schema:  
            type: integer  
      requestBody:  
        content:  
          application/json:  
            schema:  
              type: object  
              properties:  
                name:  
                  type: string  
                email:  
                  type: string  
              required:  
                - name  
                - email  
      responses:  
        '200':  
          description: ユーザー情報の更新に成功
```
### **5\. ユーザーの削除 (Delete) - DELETE /users/{userId}**

指定されたIDのユーザーを削除します。成功した場合、多くは204 No Content（レスポンスボディなし）を返します。
```yaml
# paths:  
#   /users/{userId}:  
    delete:  
      summary: ユーザー削除 (Delete)  
      parameters:  
        - name: userId  
          in: path  
          required: true  
          schema:  
            type: integer  
      responses:  
        '204':  
          description: ユーザーの削除に成功 (No Content)
```

ここまでの内容で作成したYAMLファイルは[こちら(./openapi-basics-resource/sample1.yml)](./openapi-basics-resource/sample1.yml)です。

## **【追加情報】componentsで仕様書をクリーンにする**

さて、上記のCRUDの定義を見て、同じような記述（特にユーザー情報を表すschemaの部分）が何度も出てくることに気づいたでしょうか？APIが大きくなるほど、この繰り返しは増え、仕様書の見通しを悪くし、修正も大変になります。

この問題を解決するのが components です。

componentsオブジェクトは、API仕様書の中で**繰り返し登場する部品をまとめて定義しておく**ための場所です。プログラミングにおける「関数」や「クラス」のように、一度定義したものを様々な場所から参照（$refを使用）することで、仕様書の重複をなくし、可読性とメンテナンス性を劇的に向上させます。

### **components を使ってCRUD定義をリファクタリングする**

先ほどのCRUDの定義を、componentsを使って書き直してみましょう。

#### **1\. components に再利用する部品を定義する**

まず、ユーザー情報(User)や、新規作成時の入力(UserInput)、パラメータ(UserIdInPath)などをcomponentsにまとめて定義します。
```yaml
# このセクションを info や servers と同じ階層に追加します。  
components:  
  schemas:  
    User:  
      type: object  
      properties:  
        id:  
          type: integer  
          format: int64  
          description: ユーザーID  
        name:  
          type: string  
          description: ユーザー名  
        email:  
          type: string  
          format: email  
          description: メールアドレス  
      required:  
        - id  
        - name  
        - email  
    UserInput:  
      type: object  
      properties:  
        name:  
          type: string  
        email:  
          type: string  
      required:  
        - name  
        - email  
  parameters:  
    UserIdInPath:  
      name: userId  
      in: path  
      required: true  
      description: 操作対象のユーザーID  
      schema:  
        type: integer  
        format: int64
```
#### **2\. paths から $ref で部品を参照する（リファクタリング後の完成形）**

componentsに定義した部品を、$refを使って参照するようにpathsの記述を修正します。これにより、全てのCRUD定義が非常にスッキリします。
```yaml
paths:  
  /users:  
    get:  
      summary: ユーザー一覧取得 (Read)  
      responses:  
        '200':  
          description: ユーザー一覧の取得に成功  
          content:  
            application/json:  
              schema:  
                type: array  
                items:  
                  $ref: '#/components/schemas/User'  
    post:  
      summary: 新規ユーザー作成 (Create)  
      requestBody:  
        content:  
          application/json:  
            schema:  
              $ref: '#/components/schemas/UserInput'  
      responses:  
        '201':  
          description: ユーザーの作成に成功  
          content:  
            application/json:  
              schema:  
                $ref: '#/components/schemas/User'

  /users/{userId}:  
    parameters:  
      - $ref: '#/components/parameters/UserIdInPath'  
    get:  
      summary: 特定ユーザー取得 (Read)  
      responses:  
        '200':  
          description: ユーザー情報の取得に成功  
          content:  
            application/json:  
              schema:  
                $ref: '#/components/schemas/User'  
    put:  
      summary: ユーザー情報更新 (Update)  
      requestBody:  
        content:  
          application/json:  
            schema:  
              $ref: '#/components/schemas/UserInput'  
      responses:  
        '200':  
          description: ユーザー情報の更新に成功  
          content:  
            application/json:  
              schema:  
                $ref: '#/components/schemas/User'  
    delete:  
      summary: ユーザー削除 (Delete)  
      responses:  
        '204':  
          description: ユーザーの削除に成功 (No Content)
```
どうでしょうか。paths以下の記述が大幅にスッキリし、「どのエンドポイントが、どのデータを使って、何をするか」が一目でわかるようになりました。データ構造の変更が必要になった場合も、componentsの中の定義を1ヶ所修正するだけで済むため、メンテナンスが非常に楽になります。

### **まとめ**

OpenAPIを学ぶ上で、まずはCRUD操作を直接記述する方法を理解し、その上でcomponentsを使った効率化の手法を学ぶことは非常に重要です。この流れでAPIの仕様を記述することで、分かりやすく、メンテナンス性の高い設計が可能になります。