# **Docker Composeハンズオン：Webアプリ環境を構築しよう**

## **1. はじめに**

このハンズオンでは、コンテナ仮想化技術であるDockerと、複数のコンテナを管理するためのツール「Docker Compose」を使い、Webアプリケーションの実行環境を構築します。具体的には、以下の3つのコンテナを連携させる方法を学びます。

1. **Webサーバー (Nginx):** ユーザーからのリクエストを受け付ける窓口  
2. **アプリケーションサーバー (Node.js):** ビジネスロジックを実行する頭脳  
3. **データベースサーバー (PostgreSQL):** データを保存・管理する倉庫

このハンズオンを終える頃には、docker-compose.yml という設定ファイルを使って、複数のコンテナから成るアプリケーション環境を簡単に立ち上げ、管理できるようになります。

### **なぜDocker Composeを使うのか？**

現代のWebアプリケーション開発では、機能ごとにコンテナを分割して開発・運用することが一般的です。しかし、コンテナが複数になると、それぞれの起動・停止やコンテナ間の通信設定が煩雑になります。

Docker Composeは、docker-compose.yml というたった1つのファイルに、複数のコンテナの構成情報（使用するイメージ、ポート設定、依存関係など）をまとめて記述することで、それらのコンテナ群を docker compose up というコマンド一つで一括管理できるようにするツールです。

これにより、開発環境の構築が誰でも簡単かつ迅速に行えるようになり、開発効率が飛躍的に向上します。

## **2. 準備**

### **必要なもの**

* **Docker Desktop:** DockerとDocker Composeがセットでインストールされます。公式サイトからご自身のOSに合ったものをインストールしてください。  
  * [Docker公式サイト](https://www.docker.com/products/docker-desktop/)

### **プロジェクトのセットアップ**

まず、このハンズオンで作業するためのフォルダ（ディレクトリ）を準備しましょう。

1. 好きな場所にプロジェクト用のフォルダを作成します。（例: docker-handson）  
2. ターミナル（Windowsの場合はPowerShellやコマンドプロンプト）を開き、作成したフォルダに移動します。
```
# フォルダを作成  

mkdir docker-handson

# 作成したフォルダに移動  
cd docker-handson
```
最終的なプロジェクトのファイル構成は以下のようになります。
```
docker-handson/  
├── app/  
│   ├── Dockerfile  
│   ├── index.js  
│   └── package.json  
├── nginx/  
│   └── default.conf  
└── docker-compose.yml
```
それでは、ステップバイステップで環境を構築していきましょう！

## **3. ステップ1：Webサーバー(Nginx)を起動する**

最初に、リクエストの窓口となるNginxコンテナを起動してみましょう。

### **docker-compose.yml の作成**

プロジェクトのルート（docker-handson フォルダ直下）に docker-compose.yml という名前のファイルを作成し、以下の内容を記述してください。

**docker-compose.yml**
```
services: # ここに起動したいコンテナ（サービス）を定義していく  
  web: # サービス名（ここではwebと命名）  
    image: nginx:latest # 使用するDockerイメージ  
    ports:  
      - "8080:80" # ホストOSの8080番ポートをコンテナの80番ポートに接続
```
**解説:**

* services: 起動するコンテナ群を定義します。  
* web: コンテナを管理するためのサービス名です。好きな名前をつけられます。  
* image: コンテナの元となるDockerイメージを指定します。今回は公式の最新版Nginxイメージを使います。  
* ports: ホストOSとコンテナのポートを繋ぐ設定です。「ホストOSのポート:コンテナのポート」と記述します。これにより、ホストOSのブラウザから http://localhost:8080 にアクセスすると、Nginxコンテナの80番ポートにリクエストが転送されます。

### **Nginxの起動と確認**

docker-compose.yml を保存したら、ターミナルで以下のコマンドを実行してください。（docker-compose はハイフンなしの docker compose コマンドを推奨します）
```
docker compose up -d
```
* up: docker-compose.yml に基づいてコンテナを起動します。  
* -d (detach): コンテナをバックグラウンドで起動するオプションです。

実行結果の確認:  
docker ps コマンドでコンテナが起動しているか確認しましょう。 
``` 
docker ps  
```
`docker-handson-web-1` のような名前のコンテナが起動していれば成功です。

次に、Webブラウザを開き、アドレスバーに `http://localhost:8080` と入力してください。

Nginxのウェルカムページが表示されれば、最初のステップは完了です！

### コンテナの停止  
確認が終わったら、以下のコマンドでコンテナを停止・削除しておきましょう。

```bash  
docker compose down  
```
`down` コマンドは `up` で作成したコンテナやネットワークをまとめてクリーンアップしてくれます。

---

## 4. ステップ2：アプリケーションサーバー(Node.js)を追加する

次に、簡単なAPIを持つNode.jsアプリケーションのコンテナを追加し、Nginxからリクエストを転送するように設定します。

### Node.jsアプリの準備  
1.  `docker-handson` フォルダの中に `app` フォルダを作成します。  
2.  `app` フォルダの中に、以下の3つのファイルを作成します。

**`app/package.json`**  
```json  
{  
  "name": "sample-app",  
  "version": "1.0.0",  
  "main": "index.js",  
  "scripts": {  
    "start": "node index.js"  
  },  
  "dependencies": {  
    "express": "^4.18.2"  
  }  
}
```
*Node.jsプロジェクトの定義ファイルです。WebフレームワークのExpressに依存していることを示します。*

**app/index.js**
```javascript
const express = require('express');  
const app = express();  
const port = 3000;

app.get('/', (req, res) => {  
  res.send('Hello from Node.js App!');  
});

app.get('/api', (req, res) => {  
  res.json({ message: 'これはNode.jsからのAPIレスポンスです。' });  
});

app.listen(port, () => {  
  console.log(`App listening at http://localhost:${port}`);  
});
```
*/ と /api という2つのエンドポイントを持つ簡単なWebサーバーです。*

**app/Dockerfile**
```dockerfile
# ベースとなるイメージを指定  
FROM node:18-alpine

# 作業ディレクトリを設定  
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー  
COPY package*.json ./

# 依存パッケージをインストール  
RUN npm install

# アプリケーションのソースコードをコピー  
COPY . .

# コンテナ起動時に実行するコマンド  
CMD [ "npm", "start" ]
```
*このDockerfileは、Node.jsアプリケーションをコンテナ化するための設計図です。*

### **Nginxの設定**

NginxがNode.jsアプリにリクエストを転送するための設定ファイルを作成します。

1. docker-handson フォルダの中に nginx フォルダを作成します。  
2. nginx フォルダの中に default.conf というファイルを作成します。

**nginx/default.conf**
```
server {  
    listen 80;

    location / {  
        proxy_pass http://app:3000; # / へのアクセスを app:3000 に転送  
        proxy_set_header Host $host;  
        proxy_set_header X-Real-IP $remote_addr;  
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
        proxy_set_header X-Forwarded-Proto $scheme;  
    }  
}
```
**解説:**

* location /: すべてのリクエスト (/ 以下) に対する設定です。  
* proxy_pass http://app:3000;: リクエストを http://app:3000 に転送（プロキシ）します。ここで使われている app というホスト名は、後ほど docker-compose.yml で定義するNode.jsアプリのサービス名です。Docker Composeは、サービス名をホスト名としてコンテナ間で通信できるようにしてくれます。

### **docker-compose.yml の更新**

それでは、docker-compose.yml にNode.jsアプリのサービスを追加し、Nginxの設定を更新しましょう。

**docker-compose.yml**
```
services:  
  web:  
    image: nginx:latest  
    ports:  
      - "8080:80"  
    volumes:  
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf # Nginxの設定ファイルをマウント  
    depends_on: # 依存関係を定義  
      - app

  app: # Node.jsアプリのサービス  
    build: ./app # ./app ディレクトリのDockerfileを使ってイメージをビルド  
    environment:  
      NODE_ENV: production
```
**変更点の解説:**

* **webサービス:**  
  * volumes: ホストOSのファイルをコンテナ内のファイルシステムにマウント（接続）します。ここでは、先ほど作成した nginx/default.conf をコンテナ内のNginx設定ファイル置き場にマウントしています。これにより、コンテナ内のNginxが我々のカスタム設定を読み込んでくれます。  
  * depends_on: サービスの起動順序を制御します。webサービスはappサービスが起動してから起動するようになります。  
* **appサービス (新規追加):**  
  * build: image の代わりに build を指定すると、Dockerイメージをリポジトリから取得するのではなく、指定したディレクトリにある Dockerfile を使ってビルドします。  
  * environment: コンテナ内で使用する環境変数を設定します。

### **起動と確認**

設定が完了したので、コンテナをビルドして起動してみましょう。--build オプションを付けると、イメージの再ビルドが行われます。
```
docker compose up --build -d
```
起動したら、ブラウザで http://localhost:8080 にアクセスしてみてください。

"Hello from Node.js App!" と表示されれば成功です。Nginxがリクエストを受け取り、appコンテナに正しく転送してくれました。

次に、http://localhost:8080/api にアクセスしてみましょう。JSON形式のレスポンスが返ってくるはずです。

確認が終わったら、一度コンテナを停止しておきましょう。

docker compose down

## **5. ステップ3：データベース(PostgreSQL)を追加する**

最後に、データを永続的に保存するためのPostgreSQLデータベースを追加し、Node.jsアプリから接続します。

### **docker-compose.yml の更新**

docker-compose.yml に db サービスを追加し、app サービスにデータベース接続情報を環境変数として渡します。

**docker-compose.yml**
```yaml
services:  
  web:  
    image: nginx:latest  
    ports:  
      - "8080:80"  
    volumes:  
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf  
    depends_on:  
      - app

  app:  
    build: ./app  
    environment:  
      NODE_ENV: production  
      # DB接続情報を環境変数として追加  
      POSTGRES_HOST: db  
      POSTGRES_PORT: 5432  
      POSTGRES_USER: user  
      POSTGRES_PASSWORD: password  
      POSTGRES_DB: mydatabase  
    depends_on:  
      - db # appはdbに依存する

  db: # PostgreSQLサービス  
    image: postgres:14-alpine  
    environment:  
      POSTGRES_USER: user  
      POSTGRES_PASSWORD: password  
      POSTGRES_DB: mydatabase  
    volumes:  
      - postgres_data:/var/lib/postgresql/data # データを永続化するためのボリューム

volumes: # トップレベルでボリュームを定義  
  postgres_data:
```
**変更点の解説:**

* **dbサービス (新規追加):**  
  * image: postgres:14-alpine: 公式のPostgreSQLイメージを使用します。  
  * environment: PostgreSQLコンテナの初期設定（ユーザー名、パスワード、データベース名）を環境変数で指定します。  
  * volumes: postgres_data という名前付きボリュームを、PostgreSQLのデータが保存される /var/lib/postgresql/data ディレクトリにマウントします。これにより、コンテナを停止・削除してもデータが消えずに保持されます。  
* **appサービス:**  
  * environment: appコンテナからdbコンテナに接続するための情報を環境変数として追加しました。ホスト名にはサービス名であるdbを指定します。  
  * depends_on: appサービスはdbサービスが起動してから起動するように設定します。  
* **トップレベルのvolumes:**  
  * docker-compose.yml内で使用する名前付きボリュームを定義します。

### **Node.jsアプリの更新**

データベースに接続し、簡単なデータの読み書きを行うように app/index.js と app/package.json を修正します。

まず、PostgreSQLに接続するためのライブラリ pg を追加します。

**app/package.json**
```json
{  
  "name": "sample-app",  
  "version": "1.0.0",  
  "main": "index.js",  
  "scripts": {  
    "start": "node index.js"  
  },  
  "dependencies": {  
    "express": "^4.18.2",  
    "pg": "^8.11.3"  // pgライブラリを追加  
  }  
}
```
次に、index.js をデータベースと連携するように書き換えます。

**app/index.js**
```javascript
const express = require('express');  
const { Pool } = require('pg');

const app = express();  
const port = 3000;

// 環境変数からDB接続情報を取得  
const pool = new Pool({  
  host: process.env.POSTGRES_HOST,  
  port: process.env.POSTGRES_PORT,  
  user: process.env.POSTGRES_USER,  
  password: process.env.POSTGRES_PASSWORD,  
  database: process.env.POSTGRES_DB,  
});

// アプリ起動時にテーブルを作成する  
const initDb = async () => {  
  try {  
    await pool.query(`  
      CREATE TABLE IF NOT EXISTS visits (  
        id SERIAL PRIMARY KEY,  
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()  
      );  
    `);  
    console.log('Database table initialized');  
  } catch (err) {  
    console.error('Error initializing database', err);  
    // 起動時にDB接続に失敗した場合、リトライする  
    setTimeout(initDb, 5000);  
  }  
};  
initDb();

app.get('/', async (req, res) => {  
  try {  
    // アクセスログをDBに保存  
    await pool.query('INSERT INTO visits DEFAULT VALUES');  
    // 訪問回数を取得  
    const result = await pool.query('SELECT COUNT(*) FROM visits');  
    const visitCount = result.rows[0].count;  
    res.send(`Hello from Node.js App! You are visitor #${visitCount}.`);  
  } catch (err) {  
    console.error(err);  
    res.status(500).send('Database error');  
  }  
});

app.listen(port, () => {  
  console.log(`App listening at http://localhost:${port}`);  
});
```
**変更点の解説:**

* pgライブラリをインポートし、環境変数を使ってDB接続プールを作成します。  
* initDb関数: アプリ起動時にvisitsテーブルが存在しない場合に作成します。  
* /へのGETリクエスト:  
  1. visitsテーブルに新しいレコードを1行挿入します。  
  2. visitsテーブルの全行数をカウントします。  
  3. 訪問回数を含んだメッセージを返します。

### **起動と最終確認**

すべてのファイルが更新されたので、ビルドして起動しましょう。
```
docker compose up --build -d
```
起動したら、ブラウザで http://localhost:8080 に何度かアクセス（リロード）してみてください。

"You are visitor #1.", "You are visitor #2." のように、訪問回数が増えていけば成功です！

最後に、docker compose down でコンテナを停止した後、もう一度 docker compose up -d で起動し、http://localhost:8080 にアクセスしてみてください。  
訪問者数がリセットされず、続きからカウントされていれば、volumesによるデータの永続化も正しく機能していることが確認できます。

## **6. まとめ**

お疲れ様でした！このハンズオンでは、以下のことを学びました。

* docker-compose.yml を使って複数のサービス（コンテナ）を定義する方法  
* ports を使って外部にポートを公開する方法  
* Dockerfile を使って独自のアプリケーションイメージをビルドする方法 (build)  
* volumes を使って設定ファイルをコンテナにマウントしたり、データを永続化したりする方法  
* environment を使ってコンテナに設定情報を渡す方法  
* depends_on を使ってサービスの起動順序を制御する方法  
* Docker Composeが提供する内部ネットワークを使って、サービス名でコンテナ間通信を行う方法

Docker Composeは、ローカルでの開発環境構築を劇的に効率化するだけでなく、本番環境へのデプロイにも応用できる非常に強力なツールです。ぜひこのハンズオンを足がかりに、様々なコンテナを組み合わせたアプリケーション開発に挑戦してみてください。