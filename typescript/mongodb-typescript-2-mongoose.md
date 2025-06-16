# **TypeScriptとMongoDBの連携**
## 第2回演習: Mongooseを使った高度なCRUD操作

## **1. はじめに**

この演習は、「第1回演習: TypeScriptとMongoDB Native DriverによるCRUD操作」の続きです。第1回で構築したDocker Composeによる開発環境をそのまま利用します。

今回の目的は、**Mongoose** というライブラリを導入し、より安全で効率的なデータベース操作を学ぶことです。

**学習目標:**

* Mongooseの役割とメリットを理解する。  
* スキーマを定義し、データの構造とルールを定めることができる。  
* モデルを通して、オブジェクト指向的にCRUD操作を実装できる。  
* Native Driverを使った場合との違いを理解する。

## **2. Mongooseとは？**

Mongoose は、MongoDB のためのオブジェクトデータモデリング(ODM)ライブラリです。これを利用することで、以下のようなメリットがあります。

* **スキーマ(Schema)の定義**: ドキュメントの構造、データ型、デフォルト値、バリデーション（入力値の検証）などをあらかじめ定義できます。これにより、意図しないデータが保存されるのを防ぎ、データの整合性を高めます。  
* **モデル(Model)の利用**: スキーマから作成される「モデル」を通して、より直感的（オブジェクト指向的）にデータベースを操作できます。  
* **便利な機能**: populate を使ったドキュメント間の関連付けなど、複雑な操作を簡単に行うための機能が豊富に用意されています。

## **3. 環境の更新**

まず、第1回で作成したプロジェクトに Mongoose を追加します。

### **3.1. package.jsonの更新**

app/package.json ファイルを開き、dependencies に mongoose を追加します。以下の内容に更新してください。

[app/package.json](./mongodb-typescript-2-mongoose-resource/package.json) (Mongoose追加版)

### **3.2. コンテナの再ビルド**

package.json を変更して新しいパッケージを追加したため、コンテナのイメージを再ビルドして、mongoose をインストールする必要があります。

ターミナルで以下のコマンドを実行し、コンテナを一度停止・削除してから、再ビルドして起動します。

# 現在のコンテナを停止・削除  
```
docker compose down
```
# イメージを再ビルドしてコンテナを起動  
```
docker compose up -d --build
```
これにより、Dockerfile 内の RUN npm install が再度実行され、mongoose がプロジェクトにインストールされます。

## **4. スキーマとモデルの定義**

Mongoose を使う上で最も重要な概念が スキーマ と モデル です。  
まず、保存する User データの構造をスキーマとして定義し、そのスキーマからデータベース操作の窓口となるモデルを作成します。  
コードの関心事を分離するため、モデルの定義は別のファイルに記述しましょう。  
app/src/models というディレクトリを新たに作成し、その中に user.model.ts というファイルを作成します。  
**新しいプロジェクト構成:**
```
/  
|-- (前回と同じ)  
|-- app/  
|   |-- (前回と同じ)  
|   |-- src/  
|       |-- models/  
|       |   |-- user.model.ts  <-- 新規作成  
|       |-- index.ts           <-- 後で書き換える
```
### **4.1. モデルの実装コード (app/src/models/user.model.ts)**
[user.model.ts](./mongodb-typescript-2-mongoose-resource/user.model.ts)
```
// app/src/models/user.model.ts  
import mongoose, { Schema, Document } from 'mongoose';

// ユーザーのデータ構造をTypeScriptのInterfaceで定義  
export interface IUser extends Document {  
  name: string;  
  age: number;  
  email: string;  
  createdAt: Date;  
}

// Mongooseのスキーマを定義  
const UserSchema: Schema = new Schema({  
  name: {  
    type: String,  
    required: true // このフィールドは必須  
  },  
  age: {  
    type: Number,  
    required: true  
  },  
  email: {  
    type: String,  
    required: true,  
    unique: true, // このフィールドの値はユニークでなければならない  
    lowercase: true // 保存時に小文字に変換  
  }  
}, {  
  timestamps: true // ドキュメントの作成日時(createdAt)と更新日時(updatedAt)を自動で追加  
});

// スキーマからモデルを作成し、エクスポート  
// mongoose.model<ドキュメントの型>('モデル名', スキーマ)  
export default mongoose.model<IUser>('User', UserSchema);
```
### **4.2. スキーマとモデルの解説**

* export interface IUser extends Document: TypeScriptの**Interface**を使って、Userドキュメントが持つべきプロパティ（name, ageなど）を型として定義します。mongoose.Document を継承することで、_id などのMongoDBが持つプロパティも型に含まれます。  
* const UserSchema: Schema = new Schema({ ... });: Mongooseの Schema を作成します。ここにドキュメントの「設計図」を記述します。  
  * type: String: フィールドのデータ型を指定します。  
  * required: true: このフィールドが必須項目であることを示します。この値がない状態で保存しようとするとエラーになります。  
  * unique: true: このフィールドの値はコレクション内で一意でなければなりません。同じemailを持つユーザーを複数作成できなくなります。  
  * lowercase: true: 保存する前に、このフィールドの値を自動的に小文字に変換します。  
  * { timestamps: true }: このオプションを有効にすると、データの作成時(createdAt)と更新時(updatedAt)に自動でタイムスタンプが記録されます。  
* export default mongoose.model<IUser>('User', UserSchema);: 作成したスキーマを元に**モデル**を生成し、他のファイルから使えるようにエクスポートします。  
  * 第1引数の 'User' はモデルの名前です。MongoDB上では、この名前が複数形になった users という名前のコレクションとして扱われます。  
  * 第2引数に、元となるスキーマを渡します。

## **5. Mongooseを使ったCRUD処理の実装**

それでは、app/src/index.ts の内容を、先ほど作成した User モデルを使って Mongoose で操作するように書き換えましょう。

### **5.1. 実装コード (app/src/index.ts)**
[index.ts](./mongodb-typescript-2-mongoose-resource/index.ts)
```
// app/src/index.ts (Mongoose版)  
import mongoose from 'mongoose';  
import User from './models/user.model'; // 作成したUserモデルをインポート

const url = 'mongodb://mongo:27017/myCrudApp'; // 接続URLとDB名は同じ

async function main() {  
  try {  
    // Mongooseを使ってMongoDBに接続  
    await mongoose.connect(url);  
    console.log('[INFO] Successfully connected to MongoDB via Mongoose.');

    // 既存のデータをクリア  
    await User.deleteMany({});

    // --- 1. Create (作成) ---  
    console.log('\n--- 1. Create (Mongoose) ---');  
    // モデルのインスタンスを作成  
    const user = new User({  
      name: 'Hanako Mongoose',  
      age: 28,  
      email: 'hanako@mongoose.example.com',  
    });  
    // データを保存  
    await user.save();  
    console.log('User created:', user.toObject());  
    const userId = user._id;

    // --- 2. Read (読み取り) ---  
    console.log('\n--- 2. Read (Mongoose) ---');  
    // IDでユーザーを検索  
    const foundUser = await User.findById(userId);  
    console.log('Found user by ID:', foundUser?.toObject());

    // 全ユーザーを検索  
    const allUsers = await User.find({});  
    console.log('All users:', allUsers.map(u => u.toObject()));

    // --- 3. Update (更新) ---  
    console.log('\n--- 3. Update (Mongoose) ---');  
    // ユーザーをIDで検索して更新  
    const updatedUser = await User.findByIdAndUpdate(  
      userId,  
      { age: 29, name: 'Hanako Suzuki' },  
      { new: true } // オプション: 更新後のドキュメントを返す  
    );  
    console.log('Updated user:', updatedUser?.toObject());

    // --- 4. Delete (削除) ---  
    console.log('\n--- 4. Delete (Mongoose) ---');  
    const deletedUser = await User.findByIdAndDelete(userId);  
    console.log('Deleted user:', deletedUser ? 'Success' : 'Failed');  
      
    // 削除されたことを確認  
    const checkUser = await User.findById(userId);  
    console.log('User exists after deletion:', checkUser ? 'Yes' : 'No');

  } catch (error) {  
    console.error('[ERROR] An error occurred in main function:', error);  
  } finally {  
    // Mongooseの接続を閉じる  
    await mongoose.connection.close();  
    console.log('\n[INFO] Mongoose connection closed.');  
  }  
}

// 呼び出し部分でエラーをキャッチする  
main().catch(err => {  
  console.error("未処理の致命的なエラー:", err);  
  process.exit(1);  
});
```
### **5.2. コードの解説**

Native Driver を使った実装と比較すると、コードがより宣言的で、何をしているかが分かりやすくなっていることに注目してください。

* **接続処理:**  
  * import User from './models/user.model';: 先ほど作成したUserモデルをインポートします。  
  * await mongoose.connect(url);: Mongooseのconnectメソッドで接続します。Mongooseは内部で接続を管理するため、操作ごとに接続・切断を記述する必要がありません。  
* **Create (作成):**  
  * const user = new User({ ... });: Userモデルをnewすることで、新しいドキュメントのインスタンスを作成します。  
  * await user.save();: インスタンスのsaveメソッドを呼び出すことで、データベースに保存されます。非常にオブジェクト指向的で直感的な操作です。  
* **Read (読み取り):**  
  * await User.findById(userId);: Userモデル自体が持つ静的メソッドfindByIdを使って、IDによる検索ができます。  
  * await User.find({});: findメソッドも同様にモデルから直接呼び出せます。  
* **Update (更新):**  
  * await User.findByIdAndUpdate(userId, { ... }, { new: true });: IDでドキュメントを検索し、更新までを一度に行います。  
  * 第1引数に対象のID、第2引数に更新内容を渡します。  
  * 第3引数の { new: true } というオプションは重要で、これを指定すると、**更新後**のドキュメントを戻り値として受け取ることができます（指定しない場合は更新前のドキュメントが返されます）。  
* **Delete (削除):**  
  * await User.findByIdAndDelete(userId);: IDを指定してドキュメントを検索し、削除します。  
* **切断処理:**  
  * await mongoose.connection.close();: 最後にfinallyブロックで接続を閉じます。  
* **実行とエラーハンドリング:**  
  * main().catch(...): main関数自体を呼び出し、もしtry...catchでも捕まえられないような致命的なエラー（Promiseの失敗など）が発生した場合に、それをコンソールに出力してプロセスを終了するようにしています。これにより、エラーが「静かに」無視されるのを防ぎます。

### **5.3. 実行結果の確認**

app/src/index.ts を上記のコードに書き換えて保存してください。nodemon が自動でアプリケーションを再起動します。再起動されなかった場合は、次のコマンドで環境を再起動してください。
```
docker compose down
docker compose up -d --build
```

その後、```docker compose logs -f app``` でコンテナのログを確認してみてください。

## **6. まとめ**

この演習では、**Mongoose** を導入し、スキーマとモデルを使ってより安全で構造化されたデータ操作を行う方法を学びました。

* **Native Driver**: 低レベルな操作が可能で柔軟性が高いですが、コードが冗長になりがちです。  
* **Mongoose**: スキーマによるデータ整合性の担保や、直感的なAPIが魅力で、多くのNode.jsアプリケーションで採用されています。

どちらの技術にも長所があり、プロジェクトの要件に応じて使い分けることが重要です。ここからさらに、Express などのフレームワークを導入してREST APIを構築することで、本格的なWebアプリケーション開発へとステップアップしていくことができます。