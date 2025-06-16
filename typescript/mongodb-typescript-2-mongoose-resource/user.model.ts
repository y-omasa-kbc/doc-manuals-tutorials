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