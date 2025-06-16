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