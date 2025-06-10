# **演習テキスト：TypeScriptとExpressによるWeb API開発入門**
## 1.HTTPリクエストに対応するスケルトンコード

## **1. はじめに**

この演習では、[TypeScript](https://www.typescriptlang.org/) と [Express](https://expressjs.com/ja/) を用いて、学生情報を管理するための基本的なWeb APIサーバーを構築します。目標は、データ操作の基本であるCRUD（作成、読み取り、更新、削除）操作を行うためのAPIエンドポイントのスケルトン（骨組み）を、**単一のファイル内**に実装することです。

### **学習目標**

* Node.jsプロジェクトのセットアップ方法を理解する。  
* TypeScriptをNode.jsプロジェクトに導入する方法を学ぶ。  
* Expressを使って基本的なWebサーバーとAPIエンドポイントを構築する方法を習得する。  
* RESTful APIの基本的なエンドポイント設計を理解する。  
* HTTPリクエストを受け取り、適切なレスポンスを返す処理の流れを実装する。

## **2. 開発環境の準備**

演習を始める前に、以下のツールがコンピュータにインストールされていることを確認してください。

* **Node.js**: [公式サイト](https://nodejs.org/) からLTS版をインストールしてください。インストールすると、パッケージ管理ツールであるnpmも同時にインストールされます。  
* **コードエディタ**: [Visual Studio Code](https://code.visualstudio.com/) など、お好みのエディタをご利用ください。  
* **APIクライアントツール**: VS Codeの拡張機能である **Thunder Client** や、デスクトップアプリケーションの **Postman** など。APIの動作確認に使用します。

ターミナルで以下のコマンドを実行し、バージョンが表示されれば準備完了です。
```
node -v  
npm -v
```
## **3. プロジェクトのセットアップ**

### **3.1. プロジェクトディレクトリの作成と初期化**

まず、演習用のプロジェクトディレクトリを作成し、そのディレクトリに移動します。
```
mkdir student-api-server  
cd student-api-server
```
次に、npm init -yコマンドを実行して、プロジェクトの管理ファイルであるpackage.jsonを作成します。
```
npm init -y
```
### **3.2. 必要なパッケージのインストール**

このプロジェクトで利用するライブラリをnpmでインストールします。

**アプリケーション実行に必要なライブラリ:**

* express: Webフレームワーク
```
npm install express
```
**開発時にのみ必要なライブラリ:**

* typescript: TypeScriptコンパイラ  
* @types/express, @types/node: ExpressとNode.jsの型定義ファイル  
* ts-node: TypeScriptをコンパイルせずに直接実行するツール  
* nodemon: ファイルの変更を検知して自動でサーバーを再起動するツール
```
npm install --save-dev typescript @types/express @types/node ts-node nodemon
```
### **3.3. TypeScriptコンパイラの設定**

TypeScriptコンパイラの設定ファイルtsconfig.jsonを npx tsc --init コマンドで作成します。生成されたファイルで、以下の項目が指定されていることを確認してください。

* "target": "ES2020"  
* "module": "commonjs"  
* "rootDir": "./src"  
* "outDir": "./dist"  
* "esModuleInterop": true  
* "strict": true

### **3.4. プロジェクトのディレクトリ構造**

ソースコードを管理するために、srcディレクトリを作成します。今回はこのsrcディレクトリの中にindex.tsを1つだけ作成します。
```
mkdir src
```
この時点でのプロジェクトの構造は以下のようになります。
```
student-api-server/  
├── node_modules/  
├── src/  
│   └── index.ts      (ここにすべてのコードを記述します)  
├── package.json  
├── package-lock.json  
└── tsconfig.json
```
### **3.5. 実行スクリプトの登録**

package.jsonを開き、scriptsセクションを以下のように編集します。これにより、簡単なコマンドでサーバーを起動できるようになります。
```
{  
  ...  
  "scripts": {  
    "start": "node dist/index.js",  
    "build": "tsc",  
    "dev": "nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/index.ts"  
  },  
  ...  
}
```
## **4. APIサーバーの実装**

それでは、APIサーバーのすべての機能を src/index.ts ファイルに実装していきます。このファイルでExpressサーバーを起動し、学生情報を操作するための5つのAPIエンドポイント（CRUD操作）を定義します。

srcディレクトリにindex.tsファイルを作成し、以下のコードを記述してください。

【重要】インポート方法について  
tsconfig.jsonの"esModuleInterop": true設定が正しく読み込まれない環境で発生するエラーを回避するため、import express from 'express'ではなくimport * as express from 'express'という、より確実なインポート方法を使用します。これに伴い、ApplicationやRequestといった型もexpress.Applicationのように記述する必要があります。  
**src/index.ts**
```typescript
import * as express from 'express';

const app: express.Application = express();  
const PORT: number = 3000;

// POSTやPUTリクエストのJSONボディを解析するためのミドルウェア  
app.use(express.json());

// --- APIエンドポイントの定義 ---

// GET /api/students - 全学生を取得  
app.get('/api/students', (req: express.Request, res: express.Response) => {  
  res.status(200).json({ message: 'Get all students' });  
});

// GET /api/students/:id - 特定の学生を取得  
app.get('/api/students/:id', (req: express.Request, res: express.Response) => {  
  const { id } = req.params;  
  res.status(200).json({ message: `Get student with ID: ${id}` });  
});

// POST /api/students - 新しい学生を作成  
app.post('/api/students', (req: express.Request, res: express.Response) => {  
  // 本来はここで req.body の内容を使ってデータベースに保存する  
  res.status(201).json({ message: 'Create a new student', data: req.body });  
});

// PUT /api/students/:id - 特定の学生情報を更新  
app.put('/api/students/:id', (req: express.Request, res: express.Response) => {  
  const { id } = req.params;  
  // 本来はここで req.body の内容を使ってIDが一致する学生情報を更新する  
  res.status(200).json({ message: `Update student with ID: ${id}`, data: req.body });  
});

// DELETE /api/students/:id - 特定の学生を削除  
app.delete('/api/students/:id', (req: express.Request, res: express.Response) => {  
  const { id } = req.params;  
  res.status(200).json({ message: `Delete student with ID: ${id}` });  
});

// サーバーを指定したポートで起動  
app.listen(PORT, () => {  
  console.log(`Server is running at http://localhost:${PORT}`);  
});
```
## **5. サーバーの起動と動作確認**

ターミナルで以下のコマンドを実行し、開発サーバーを起動します。
```
npm run dev  
Server is running at http://localhost:3000
``` 
と表示されれば成功です。

次に、**Thunder Client**や**Postman**のようなAPIクライアントツールを使って、各エンドポイントの動作を確認します。

---

#### 1. 全ての学生を取得 (GET)

* **メソッド**: `GET`  
* **URL**: `http://localhost:3000/api/students`

リクエストを送信すると、レスポンスとして以下の様なJSONが返ってきます。  
`{"message":"Get all students"}`

---

#### 2. 特定の学生を取得 (GET)

* **メソッド**: `GET`  
* **URL**: `http://localhost:3000/api/students/123`

リクエストを送信すると、レスポンスとして以下の様なJSONが返ってきます。  
`{"message":"Get student with ID: 123"}`

---

#### 3. 新しい学生を作成 (POST)

* **メソッド**: `POST`  
* **URL**: `http://localhost:3000/api/students`  
* **ボディ (Body)**:  
    1.  ツールの「Body」タブを選択します。  
    2.  形式として「JSON」を選びます。  
    3.  テキストエリアに以下のJSONデータを入力します。

    ```json  
    {  
        "name": "Taro Yamada",  
        "email": "taro@example.com"  
    }  
    ```

リクエストを送信すると、レスポンスとして以下の様なJSONが返ってきます。  
`{"message":"Create a new student","data":{"name":"Taro Yamada","email":"taro@example.com"}}`

---

#### 4. 学生情報を更新 (PUT)

* **メソッド**: `PUT`  
* **URL**: `http://localhost:3000/api/students/123`  
* **ボディ (Body)**:  
    1.  POSTの時と同様に「Body」タブで「JSON」を選択します。  
    2.  テキストエリアに更新したい内容のJSONデータを入力します。

    ```json  
    {  
        "grade": 3  
    }  
    ```

リクエストを送信すると、レスポンスとして以下の様なJSONが返ってきます。  
`{"message":"Update student with ID: 123","data":{"grade":3}}`

---

#### 5. 学生を削除 (DELETE)

* **メソッド**: `DELETE`  
* **URL**: `http://localhost:3000/api/students/123`

リクエストを送信すると、レスポンスとして以下の様なJSONが返ってきます。  
`{"message":"Delete student with ID: 123"}`

## 6. まとめと次のステップ

この演習では、TypeScriptとExpressを使って、単一ファイルで完結するシンプルなWeb APIサーバーの雛形を作成しました。

**学んだこと:**

* プロジェクトのセットアップとライブラリ管理  
* TypeScriptでのExpressサーバーの基本的な記述方法  
* RESTfulな設計に基づいたCRUD操作のスケルトン実装

このスケルトンをベースに、さらに機能を発展させていくことができます。



