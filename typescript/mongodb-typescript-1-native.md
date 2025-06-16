# **TypeScriptとMongoDBの連携**
## 第1回演習: TypeScriptとMongoDB Native DriverによるCRUD操作

## **1. 本演習の目的**

本演習では、バックエンド開発で頻繁に利用される技術スタックである TypeScript (Node.js) と NoSQLデータベースの MongoDB を用いて、基本的なデータ操作（CRUD）を行うアプリケーションを開発します。開発環境全体は Docker Compose を使ってコンテナとして構築・管理し、モダンな開発フローを体験することを目的とします。

**学習目標:**

* Docker Compose を用いて、アプリケーションとデータベースのコンテナを連携させる方法を理解する。  
* TypeScript プロジェクトを初期化し、必要なライブラリを導入できる。  
* TypeScript のコードから MongoDB に接続し、データベース操作を行える。  
* CRUD (Create, Read, Update, Delete) の各操作を実装できる。

## **2. 開発環境の構築**

まず、アプリケーションとデータベースを動作させるための環境を Docker Compose で構築します。

### **2.1. プロジェクト構成**

以下の構成でファイルを作成していきます。
```
/  
|-- docker-compose.yml  
|-- app/  
|   |-- Dockerfile  
|   |-- package.json  
|   |-- tsconfig.json  
|   |-- src/  
|       |-- index.ts
```
### **2.2. Docker Compose の設定**

プロジェクトのルートディレクトリに docker-compose.yml を作成します。このファイルは、アプリケーションを実行する app サービスと、データベースである mongo サービスの2つのコンテナを定義します。

[docker-compose.yml](./mongodb-typescript-1-native-resource/docker-compose.yml)

### **2.3. アプリケーションコンテナの Dockerfile**

次に、app ディレクトリ内に Dockerfile を作成します。このファイルは、Node.js 環境をセットアップし、アプリケーションの依存関係をインストールし、開発サーバーを起動するためのものです。

[app/Dockerfile](./mongodb-typescript-1-native-resource/Dockerfile)


## **3. TypeScript プロジェクトのセットアップ**

次に、app ディレクトリ内で TypeScript のプロジェクトを設定し、MongoDB に接続するためのライブラリをインストールします。

### **3.1. package.json**

app ディレクトリに package.json を作成します。ここにはプロジェクトの情報と、インストールする npm パッケージを定義します。

[app/package.json](./mongodb-typescript-1-native-resource/package.json)

### **3.2. tsconfig.json**

app ディレクトリに tsconfig.json を作成します。これは TypeScript のコンパイラオプションを設定するファイルです。
[app/tsconfig.json](./mongodb-typescript-1-native-resource/tsconfig.json)


## **4. CRUD処理の実装 (MongoDB Native Driver)**

ここでは、MongoDB が公式に提供している mongodb ドライバ（Native Driver）を直接使用して、CRUD処理を実装します。

### **4.1. 実装コード (app/src/index.ts)**

[index.ts](./mongodb-typescript-1-native-resource/index.ts)
```TypeScript
// app/src/index.ts  
import { MongoClient, ObjectId } from 'mongodb';

// MongoDBへの接続URL  
// 'mongo'はdocker-compose.ymlで定義したサービス名  
const url = 'mongodb://mongo:27017';  
const dbName = 'myCrudApp'; // 使用するデータベース名

// メインの非同期処理関数  
async function main() {  
    // MongoClientのインスタンスを作成  
    const client = new MongoClient(url);

    try {  
        // MongoDBに接続  
        await client.connect();  
        console.log('[INFO] Successfully connected to MongoDB.');

        // データベースを取得  
        const db = client.db(dbName);  
        // コレクション（テーブルのようなもの）を取得  
        const collection = db.collection('users');

        // 既存のデータをクリアして、毎回同じ状態から始められるようにする  
        await collection.deleteMany({});

        // --- 1. Create (作成) ---  
        console.log('\n--- 1. Create ---');  
        const newUser = {  
            name: 'Taro Yamada',  
            age: 30,  
            email: 'taro@example.com'  
        };  
        const insertResult = await collection.insertOne(newUser);  
        console.log(`Document inserted with _id: ${insertResult.insertedId}`);  
        const userId = insertResult.insertedId;

        // --- 2. Read (読み取り) ---  
        console.log('\n--- 2. Read ---');  
        // IDを指定して1件検索  
        const foundUser = await collection.findOne({ _id: userId });  
        console.log('Found one document:', foundUser);  
          
        // 全件検索  
        const allUsers = await collection.find({}).toArray();  
        console.log('Found multiple documents:', allUsers);

        // --- 3. Update (更新) ---  
        console.log('\n--- 3. Update ---');  
        const updateResult = await collection.updateOne(  
            { _id: userId }, // 更新対象のドキュメントを特定するクエリ  
            { $set: { age: 31, email: 'taro.yamada@example.com' } } // 更新内容  
        );  
        console.log(`${updateResult.matchedCount} document(s) matched the filter, ${updateResult.modifiedCount} document(s) was/were updated.`);  
        const updatedUser = await collection.findOne({ _id: userId });  
        console.log('Updated document:', updatedUser);  
          
        // --- 4. Delete (削除) ---  
        console.log('\n--- 4. Delete ---');  
        const deleteResult = await collection.deleteOne({ _id: userId });  
        console.log(`${deleteResult.deletedCount} document(s) was/were deleted.`);  
        const deletedUser = await collection.findOne({ _id: userId });  
        console.log(deletedUser ? 'Document found.' : 'Document not found.');  
          
    } catch (err) {  
        // エラーハンドリング  
        console.error('[ERROR]', err);  
    } finally {  
        // 接続を閉じる  
        await client.close();  
        console.log('\n[INFO] Connection to MongoDB closed.');  
    }  
}

// main関数を実行  
main();
```
### **4.2. コードの解説**
#### **データベース接続と全体構造**

* const url = 'mongodb://mongo:27017';  
  * MongoDBへの接続情報を定義します。mongo の部分は docker-compose.yml で定義したMongoDBサービスのコンテナ名を指します。Dockerの内部ネットワーク機能により、この名前でコンテナにアクセスできます。  
* async function main() { ... }  
  * データベース操作は非同期で行われるため、async/await を使って処理を記述します。  
* const client = new MongoClient(url);  
  * MongoDBに接続するためのクライアントオブジェクトを作成します。  
* try...catch...finally  
  * try ブロック内でデータベースへの接続と操作を実行します。  
  * catch ブロックで処理中にエラーが発生した場合の処理を記述します。  
  * finally ブロックには、処理が成功しても失敗しても、必ず実行したい処理（ここではデータベース接続のクローズ）を記述します。これはリソースリークを防ぐための重要なパターンです。  
* await client.connect();  
  * 実際にデータベースへの接続を開始します。  
* const db = client.db(dbName); と const collection = db.collection('users');  
  * 接続後、操作対象のデータベースとコレクション（RDBにおけるテーブルに相当）を取得します。

#### **Create (作成)**

* const newUser = { ... };  
  * データベースに保存したいデータをJavaScriptオブジェクトとして定義します。  
* await collection.insertOne(newUser);  
  * insertOne() メソッドを使って、1つのドキュメント（データオブジェクト）をコレクションに挿入します。  
  * 戻り値には、挿入されたドキュメントに自動で割り振られたユニークなID (_id) が含まれます。

#### **Read (読み取り)**

* await collection.findOne({ _id: userId });  
  * findOne() メソッドは、引数で指定したクエリ条件に一致する **最初の1件** のドキュメントを検索して返します。ここでは、先ほど作成したドキュメントの _id を使って検索しています。  
* await collection.find({}).toArray();  
  * find() メソッドは、クエリ条件に一致する **すべての** ドキュメントを検索します。引数に空のオブジェクト {} を渡すと、全件検索になります。  
  * find() の戻り値は「カーソル」というオブジェクトなので、.toArray() メソッドを使って結果を配列に変換します。

#### **Update (更新)**

* await collection.updateOne(filter, updateDoc);  
  * updateOne() メソッドは、条件に一致した最初の1件のドキュメントを更新します。  
  * 第1引数には、更新対象を特定するためのクエリ（フィルター）を渡します。  
  * 第2引数には、更新内容を記述します。$set はMongoDBの更新演算子の一つで、指定したフィールドの値を上書きします。

#### **Delete (削除)**

* await collection.deleteOne({ _id: userId });  
  * deleteOne() メソッドは、クエリ条件に一致した最初の1件のドキュメントを削除します。
  
### **4.3. 環境の起動**

ターミナルでプロジェクトのルートディレクトリに移動し、以下のコマンドを実行してコンテナをビルドし、バックグラウンドで起動します。
```
docker compose up -d --build
```
以下のコマンドで、2つのコンテナ (app と mongo) が正常に起動していることを確認できます。
```
docker compose ps
```
### **4.4. 実行結果の確認**

コードを保存すると、nodemon が変更を検知して自動的に index.ts を実行します。```docker compose logs -f app``` コマンドで app コンテナのログを確認すると、コード内の console.log が出力され、各ステップの実行結果を確認できます。

## **5. まとめ**

この演習では、Docker Compose を使って TypeScript と MongoDB の開発環境を構築し、**MongoDB Native Driver** を直接利用して基本的なCRUD操作を一通り実装しました。コンテナ技術を利用することで、再現性の高い開発環境を簡単に用意できることを体験できたかと思います。

今回の演習で、データベース操作の基本的な仕組みを理解することができました。次回の演習では、**Mongoose** というライブラリを使い、より安全で構造化されたデータ操作を行う方法を学びます。