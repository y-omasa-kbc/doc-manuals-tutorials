# **MongoDB+pymongo ハンズオン：MongoDBのCRUD操作**

## **1. はじめに**

### **このハンズオンの目的**

現代のWebシステム開発において、データベースは必要不可欠な要素です。ユーザー情報、商品データ、投稿記事など、あらゆる情報を効率的に管理するためにデータベースが利用されます。

このハンズオンでは、NoSQLデータベースの一つである**MongoDB**と、PythonからMongoDBを操作するためのライブラリ**pymongo**を使い、データベースの基本操作である**CRUD**（Create, Read, Update, Delete）を実際に手を動かしながら学びます。

### **学習目標**

* Dockerを使ってMongoDBのローカル開発環境を構築できる。  
* Pythonの仮想環境を構築し、ライブラリを管理できる。  
* Python (pymongo) を使ってMongoDBに接続できる。  
* Pythonの辞書型データを使って、MongoDBのドキュメントを作成（Create）できる。  
* 条件を指定して、MongoDBからドキュメントを読み取り（Read）できる。  
* MongoDBのドキュメントを更新（Update）できる。  
* MongoDBのドキュメントを削除（Delete）できる。

## **2. 準備するもの**

### **1. Python実行環境**

お使いのPCにPythonがインストールされていることを確認してください。

### **2. Docker Desktop**

このハンズオンでは、MongoDBをローカル環境で簡単に起動するためにDockerを使用します。事前にDocker Desktopをインストールし、起動しておいてください。

* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### **3. Python仮想環境の準備 (venv)**

プロジェクトごとにPythonのライブラリ（パッケージ）を独立して管理するために、仮想環境を作成します。これにより、他のプロジェクトやPC全体の環境に影響を与えることなく、開発を進められます。

まず、プロジェクト用のディレクトリを作成し、そこに移動します。
```
mkdir mongo-handson  
cd mongo-handson
```
次に、ターミナルで以下のコマンドを実行して、venv という名前の仮想環境を作成します。

```
python -m venv venv
```
作成した仮想環境を有効化します。

**macOS / Linux の場合:**
```
source venv/bin/activate
```
**Windows (コマンドプロンプト / PowerShell) の場合:**
```
.\venv\Scripts\activate
```
成功すると、ターミナルのプロンプトの先頭に (venv) と表示されます。これ以降のコマンドは、この仮想環境が有効化されたターミナルで実行してください。

### **4. pymongoライブラリのインストール**

仮想環境が有効化されている状態で、ターミナルで以下のコマンドを実行し、pymongoをインストールします。
```
(venv) $ pip install pymongo
```

### **5. DockerでMongoDBを起動する**

ターミナルを開き（仮想環境とは別のターミナルでも構いません）、以下のコマンドを実行してMongoDBのコンテナを起動します。
```
docker run --name my-mongo -p 27017:27017 -d mongo
```

**【コマンド解説】**

* docker run: Dockerコンテナを起動するコマンドです。  
* --name my-mongo: コンテナに my-mongo という名前を付けます。管理しやすくなります。  
* -p 27017:27017: ローカルPCのポート 27017 を、コンテナ内のMongoDBが使用するポート 27017 に接続します。これにより、localhost:27017 でMongoDBにアクセスできるようになります。  
* -d: コンテナをバックグラウンドで実行します。  
* mongo: Docker Hubにある公式のMongoDBイメージを指定します。

docker ps コマンドを実行して、my-mongo という名前のコンテナが起動していれば準備完了です。

## **3. MongoDBへの接続 (Connect)**

Dockerで起動したローカルのMongoDBに、Pythonから接続します。

### **Pythonから接続する**

pymongo.MongoClient を使ってMongoDBに接続します。Dockerで起動したMongoDBには、mongodb://localhost:27017/ という接続文字列でアクセスできます。

**【サンプルコード: connect.py】**
```python
import pymongo

# 1. MongoDBに接続する  
# Dockerで起動したローカルのMongoDBに接続  
client = pymongo.MongoClient('mongodb://localhost:27017/')

# 2. 接続を確認する (疎通確認)  
# サーバー情報を取得することで接続を確認できます  
try:  
    client.server_info()  
    print("Successfully connected to MongoDB!")  
except Exception as e:  
    print(f"Failed to connect to MongoDB: {e}")

# 3. データベースとコレクションを選択する  
# データベースは存在しない場合、最初のデータ挿入時に自動で作成されます。  
db = client['university']  
collection = db['students']

print("データベースとコレクションの準備ができました。")

# --- ここにMongoDBに対する操作（C/R/U/D）を記述します ---

# MongoDBへの接続を閉じる  
client.close()
```
**【実行してみよう】**

1. 上記のコードをプロジェクトディレクトリ（例: mongo-handson）にconnect.pyとして保存します。  
2. 仮想環境を有効化したターミナルで ```python connect.py``` を実行します。  
3. "Successfully connected to MongoDB!" と表示されれば接続成功です。

## **4. ドキュメントの作成 (Create)**

MongoDBでは、データを**ドキュメント**という単位で扱います。これはPythonの辞書（dict）と非常によく似た形式（BSON）です。

### **1件のドキュメントを挿入する: insert_one()**

insert_one() メソッドを使うと、1件のドキュメントをコレクションに挿入できます。

**【サンプルコード: create_one.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 挿入する学生データ（Pythonの辞書）  
student_data = {  
    "student_id": "s001",  
    "name": "山田 太郎",  
    "faculty": "工学部",  
    "grade": 2,  
    "courses": ["プログラミング基礎", "情報理論"]  
}

# 1件のドキュメントを挿入  
result = collection.insert_one(student_data)

print(f"ドキュメントを挿入しました。挿入されたドキュメントのID: {result.inserted_id}")

# MongoDBへの接続を閉じる  
client.close()  
```
`result.inserted_id` を確認すると、`_id` というユニークなIDが自動で付与されていることがわかります。

### 複数のドキュメントを挿入する: `insert_many()`

複数のドキュメントを一度に挿入するには `insert_many()` を使います。引数には、辞書のリストを渡します。

**【サンプルコード: `create_many.py`】**

```python  
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 挿入する複数の学生データ（辞書のリスト）  
students_data = [  
    {  
        "student_id": "s002",  
        "name": "佐藤 花子",  
        "faculty": "文学部",  
        "grade": 3,  
        "courses": ["日本文学史", "比較文化論"]  
    },  
    {  
        "student_id": "s003",  
        "name": "鈴木 一郎",  
        "faculty": "工学部",  
        "grade": 1,  
        "courses": ["線形代数", "微分積分学"]  
    }  
]

# 複数のドキュメントを挿入  
result = collection.insert_many(students_data)

print(f"複数のドキュメントを挿入しました。挿入されたドキュメントのIDリスト: {result.inserted_ids}")

# MongoDBへの接続を閉じる  
client.close()
```
### **【演習1】**

あなたの大学の友人、または架空の学生情報を3名分作成し、students コレクションに insert_many() を使って挿入してみましょう。 必須フィールドは student_id, name, faculty とします。

## **5. ドキュメントの読み取り (Read)**

データベースに保存したデータを読み取ってみましょう。

### **1件のドキュメントを検索する: find_one()**

条件に一致する最初の1件のドキュメントを見つけるには find_one() を使います。引数に検索条件を辞書で指定します。

**【サンプルコード: read_one.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 検索条件（工学部の学生）  
query = {"faculty": "工学部"}

# 条件に一致する最初の1件を取得  
student = collection.find_one(query)

if student:  
    print("見つかった学生情報:")  
    print(student)  
else:  
    print("該当する学生は見つかりませんでした。")

# MongoDBへの接続を閉じる  
client.close()
```
### **複数のドキュメントを検索する: find()**

条件に一致する**すべて**のドキュメントを検索するには find() を使います。find() の戻り値は**カーソル**と呼ばれるオブジェクトで、for ループで一つずつデータを取り出すことができます。

**【サンプルコード: read_many.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 検索条件（工学部の学生全員）  
query = {"faculty": "工学部"}

# 条件に一致するすべてのドキュメントを取得  
cursor = collection.find(query)

print("工学部の学生一覧:")  
for student in cursor:  
    print(f"- {student['name']} (学籍番号: {student['student_id']})")

# MongoDBへの接続を閉じる  
client.close()
```
### **比較演算子を使った検索**

MongoDBでは $gt (より大きい), $lt (より小さい), $gte (以上), $lte (以下) などの比較演算子が使えます。

**【サンプルコード: read_query.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 検索条件（2年生以上の学生）  
query = {"grade": {"$gte": 2}}

print("2年生以上の学生一覧:")  
cursor = collection.find(query)  
for student in cursor:  
    print(f"- {student['name']} (学年: {student['grade']})")

# MongoDBへの接続を閉じる  
client.close()
```
### **【演習2】**

1. students コレクションから、学籍番号（student_id）が "s002" の学生を find_one() を使って検索してみましょう。  
2. students コレクションから、3年生の学生を find() を使って全員検索してみましょう。

## **6. ドキュメントの更新 (Update)**

既存のドキュメントの情報を変更します。

### **1件のドキュメントを更新する: update_one()**

条件に一致する最初の1件のドキュメントを更新するには update_one() を使います。 引数は2つで、第1引数に更新対象を絞り込む**フィルタ**、第2引数に更新内容を指定します。更新内容では $set 演算子をよく使います。

**【サンプルコード: update_one.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 更新対象のフィルタ（山田 太郎さん）  
filter_query = {"student_id": "s001"}

# 更新内容（学年を3に更新し、新しいフィールドを追加）  
update_data = {"$set": {  
    "grade": 3,  
    "email": "taro.yamada@example.com"  
}}

# 1件更新  
result = collection.update_one(filter_query, update_data)

print(f"更新されたドキュメント数: {result.modified_count}")

# 更新後のドキュメントを確認  
updated_student = collection.find_one(filter_query)  
print("更新後のデータ:", updated_student)

# MongoDBへの接続を閉じる  
client.close()
```
### **複数のドキュメントを更新する: update_many()**

条件に一致する**すべて**のドキュメントを更新するには update_many() を使います。

**【サンプルコード: update_many.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 更新対象のフィルタ（工学部の学生全員）  
filter_query = {"faculty": "工学部"}

# 更新内容（キャンパス情報を追加）  
update_data = {"$set": {"campus": "Aキャンパス"}}

# 複数件更新  
result = collection.update_many(filter_query, update_data)

print(f"更新されたドキュメント数: {result.modified_count}")

# MongoDBへの接続を閉じる  
client.close()
```
### **【演習3】**

1. students コレクションから、学籍番号 "s002" の佐藤花子さんの履修科目に "卒業研究" を追加してみましょう。（ヒント: 更新演算子 $push を調べてみよう）  
2. students コレクションの全ドキュメントに、university_name: "Python大学" というフィールドを update_many() を使って追加してみましょう。（ヒント: フィルタに空の辞書 {} を指定すると全件対象になります）

## **7. ドキュメントの削除 (Delete)**

不要になったドキュメントを削除します。**この操作は元に戻せないので注意してください。**

### **1件のドキュメントを削除する: delete_one()**

条件に一致する最初の1件を削除するには delete_one() を使います。
```python
**【サンプルコード: delete_one.py】**

# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 削除対象のフィルタ（学籍番号 s003）  
filter_query = {"student_id": "s003"}

# 1件削除  
result = collection.delete_one(filter_query)

print(f"削除されたドキュメント数: {result.deleted_count}")

# MongoDBへの接続を閉じる  
client.close()
```
### **複数のドキュメントを削除する: delete_many()**

条件に一致する**すべて**のドキュメントを削除するには delete_many() を使います。

**【サンプルコード: delete_many.py】**
```python
# (connect.py の接続コードは省略)  
# ... client, db, collection の準備ができている前提 ...

# 演習用に一時的なデータを作成  
collection.insert_one({"name": "退学者", "grade": 99})

# 削除対象のフィルタ（99年生）  
filter_query = {"grade": {"$gt": 10}}

# 複数件削除  
result = collection.delete_many(filter_query)

print(f"削除されたドキュメント数: {result.deleted_count}")

# MongoDBへの接続を閉じる  
client.close()
```
### **【演習4】**

1. これまでの演習で作成した、あなた自身の情報を students コレクションから delete_one() を使って削除してみましょう。  
2. （注意：この操作はコレクションを空にします！）students コレクションのすべてのドキュメントを delete_many() を使って削除してみましょう。（ヒント: フィルタに空の辞書 {} を使います）

## **8. ハンズオンの終了**

ハンズオンが終わったら、以下のコマンドでDockerコンテナを停止・削除できます。

# コンテナを停止  
```
docker container stop my-mongo
```
# コンテナを削除  
```
docker container rm my-mongo
```
仮想環境を無効化するには、以下のコマンドを実行します。
```
(venv) $ deactivate
```
## **9. まとめ**

このハンズオンでは、DockerでMongoDBの開発環境を構築し、Pythonのpymongoライブラリを使って基本的なCRUD操作を学びました。

* **Connect**: pymongo.MongoClient で接続  
* **Create**: insert_one(), insert_many() でドキュメントを作成  
* **Read**: find_one(), find() でドキュメントを検索  
* **Update**: update_one(), update_many() でドキュメントを更新  
* **Delete**: delete_one(), delete_many() でドキュメントを削除

ここで学んだ知識は、Webアプリケーションのバックエンドを開発する際のデータベース操作の基礎となります。今後は、Webフレームワーク（FlaskやDjangoなど）と組み合わせて、動的なWebサイトを構築することに挑戦してみてください。

また、MongoDBには、より高度なデータ集計を行う**Aggregation Framework**や、検索を高速化する**インデックス**など、さらに多くの強力な機能があります。興味があればぜひ学習を進めてみてください。