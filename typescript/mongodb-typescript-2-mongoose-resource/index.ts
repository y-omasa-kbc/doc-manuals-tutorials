// app/src/index.ts (Mongoose版)
import mongoose from 'mongoose';
import User from './models/user.model'; // 作成したUserモデルをインポート

const url = 'mongodb://mongo:27017/myCrudApp'; // 接続URLとDB名は同じ

async function main() {
  console.log("main関数を実行します..."); // 関数が呼び出されたことを確認
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
    console.error('[ERROR] An error occurred in main function:', error); // エラー内容を明確に
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
