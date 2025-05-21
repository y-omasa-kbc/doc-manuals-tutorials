# FlaskとSQLAlchemyを使用したMariaDBへのアクセス
## 1. SQLAlchemyとは
SQLAlchemyは、Pythonで利用できる強力なORマッパーです。ORマッパーを利用することで、データベースのテーブルをPythonのオブジェクトとして扱うことができ、SQLを直接記述することなくデータベース操作を行えるようになります。これにより、コードの可読性が向上し、データベースの種類に依存しない開発が可能になります。

## 2. 必要なライブラリのインストール
まず、プロジェクトで必要なライブラリをインストールしましょう。Flask、SQLAlchemy、そしてMariaDBに接続するためのドライバ（mysqlclient または PyMySQL）が必要です。
```bash
pip install Flask SQLAlchemy mysqlclient
# または
# pip install Flask SQLAlchemy PyMySQL
```

## 3. Flaskアプリケーションの設定
次に、FlaskアプリケーションでSQLAlchemyを使用するための設定を行います。

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# SQLAlchemyの設定
# MariaDBへの接続URIを設定します。
# フォーマット: 'mysql+mysqlclient://<ユーザー名>:<パスワード>@<ホスト名>/<データベース名>'
# PyMySQLを使用する場合は 'mysql+pymysql://...' となります。
# 環境変数から読み込むことを推奨します。
db_user = os.environ.get('DB_USER', 'your_mariadb_user')
db_password = os.environ.get('DB_PASSWORD', 'your_mariadb_password')
db_host = os.environ.get('DB_HOST', 'localhost')
db_name = os.environ.get('DB_NAME', 'your_mariadb_database')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlclient://{db_user}:{db_password}@{db_host}/{db_name}'
# SQLALCHEMY_TRACK_MODIFICATIONS は、変更の追跡を無効にすることでパフォーマンスを向上させます。
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# SQLAlchemyオブジェクトを初期化
db = SQLAlchemy(app)

# --- この下にモデル定義やルーティングを記述 ---

if __name__ == '__main__':
    app.run(debug=True)
```


ポイント：
- 接続文字列の <ユーザー名>、<パスワード>、<ホスト名>、<データベース名> は、ご自身のMariaDB環境に合わせて変更してください。
- セキュリティのため、パスワードなどの機密情報は直接コードに記述せず、環境変数から読み込むようにしましょう。
- SQLALCHEMY_TRACK_MODIFICATIONS は、Flask-SQLAlchemyのイベントシステムに関連する設定です。通常は False に設定することが推奨されます。

## 4. データベースモデルの作成
データベースのテーブルに対応するPythonのクラス（モデル）を作成します。db.Model を継承し、テーブルのカラムを db.Column で定義します。
例として、ユーザー情報を格納する User モデルを作成してみましょう。
```python
# ... (上記の設定コードの続き)

class User(db.Model):
    __tablename__ = 'users'  # テーブル名を指定（省略可能、その場合はクラス名が小文字化される）

    id = db.Column(db.Integer, primary_key=True)  # 主キー
    username = db.Column(db.String(80), unique=True, nullable=False) # 文字列、ユニーク、NULL不可
    email = db.Column(db.String(120), unique=True, nullable=False) # 文字列、ユニーク、NULL不可
    is_active = db.Column(db.Boolean, default=True) # 真偽値、デフォルト値あり

    def __repr__(self):
        return f'<User {self.username}>'

# データベーステーブルの作成 (初回実行時など)
# Flaskアプリケーションコンテキスト内で実行する必要があります。
# pythonインタプリタで以下を実行するか、Flaskシェルを使用します。
# from app import app, db (app.pyというファイル名の場合)
# with app.app_context():
#     db.create_all()

```

解説：
- \_\_tablename\_\_：データベース内のテーブル名を明示的に指定します。
- db.Column: テーブルのカラムを定義します。
    - db.Integer, db.String, db.Boolean などでデータ型を指定します。
    - primary_key=True: 主キーであることを示します。
    - unique=True: 値が一意であることを示します。
    - nullable=False: NULL値を許可しないことを示します。
    - default: デフォルト値を設定します。
- \_\_repr\_\_ メソッド：オブジェクトを文字列で表現する際に使用されます（デバッグなどに便利）。
  
**テーブルの作成:**
モデルを定義した後、実際にデータベースにテーブルを作成するには、db.create_all() を実行します。これは通常、Flaskアプリケーションのコンテキスト内で行う必要があります。Flaskシェル (flask shell) を使うか、以下のようなスクリプトを実行します。
```python
# create_tables.py
from your_app_file import app, db # your_app_file は Flask アプリケーションが定義されているファイル名

with app.app_context():
    db.create_all()
    print("データベーステーブルが作成されました。")
```

そしてコマンドラインで ```python create_tables.py``` を実行します。

## 5. CRUD操作
作成したモデルを使って、データの作成（Create）、読み取り（Read）、更新（Update）、削除（Delete）を行う方法を見ていきましょう。
### 5.1. データの作成 (Create)
新しいデータを作成するには、モデルのインスタンスを作成し、db.session.add() でセッションに追加後、db.session.commit() でデータベースに保存します。
```python
from flask import request, jsonify
# ... (Userモデル定義の後)

@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or not 'username' in data or not 'email' in data:
        return jsonify({'message': 'Username and email are required'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400

    new_user = User(username=data['username'], email=data['email'])
    if 'is_active' in data:
        new_user.is_active = data['is_active']

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'New user created!', 'user': {'id': new_user.id, 'username': new_user.username, 'email': new_user.email}}), 201
    except Exception as e:
        db.session.rollback() # エラー発生時はロールバック
        return jsonify({'message': 'Failed to create user', 'error': str(e)}), 500
```


コード解説 (Create):
- @app.route('/users', methods=['POST']): /users というURLパスに対して、HTTPのPOSTメソッドでリクエストがあった場合に create_user 関数が実行されるようにルーティングを設定します。
- data = request.get_json(): リクエストボディからJSON形式のデータを取得します。クライアントはユーザー名やメールアドレスをJSONで送信することを想定しています。
- if not data or not 'username' in data or not 'email' in data:: 受信したデータに必要なキー（username と email）が含まれているか検証します。不足している場合は、ステータスコード400（Bad Request）と共にエラーメッセージを返します。
- if User.query.filter_by(username=data['username']).first():: User モデルのクエリオブジェクト (User.query) を使用して、指定されたユーザー名 (data['username']) がデータベースに既に存在するかどうかを確認します。filter_by() は特定の条件でフィルタリングし、first() は最初に見つかったレコード（または存在しない場合は None）を返します。
- if User.query.filter_by(email=data['email']).first():: 同様に、指定されたメールアドレスが既に存在するか確認します。
- new_user = User(username=data['username'], email=data['email']): User モデルの新しいインスタンスを作成します。コンストラクタの引数として、リクエストから受け取ったユーザー名とメールアドレスを渡します。
- if 'is_active' in data: new_user.is_active = data['is_active']: リクエストデータに is_active が含まれていれば、その値で new_user オブジェクトの is_active 属性を更新します。含まれていなければ、モデル定義時のデフォルト値（True）が使用されます。
- db.session.add(new_user): 作成した new_user オブジェクトをSQLAlchemyのセッションに追加します。この時点ではまだデータベースには保存されていません。
- db.session.commit(): セッションに加えられた変更（この場合は新しいユーザーの追加）をデータベースに永続化（コミット）します。
- return jsonify(...) , 201: ユーザー作成成功のメッセージと、作成されたユーザーの情報（ID、ユーザー名、メールアドレス）をJSON形式で返します。HTTPステータスコード201 (Created) は、リソースの作成が成功したことを示します。
- except Exception as e:: db.session.add() や db.session.commit() の過程で何らかの例外（例：データベース接続エラー、制約違反など）が発生した場合の処理です。
- db.session.rollback(): 例外が発生した場合、データベースへの変更を元に戻します（ロールバック）。これにより、中途半端な状態でデータが保存されるのを防ぎます。
- return jsonify(...) , 500: エラーメッセージと具体的なエラー内容 (str(e)) をJSON形式で返します。HTTPステータスコード500 (Internal Server Error) は、サーバー内部でエラーが発生したことを示します。
  
### 5.2. データの読み取り (Read)
#### 全件取得
```python
@app.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    output = []
    for user in users:
        user_data = {'id': user.id, 'username': user.username, 'email': user.email, 'is_active': user.is_active}
        output.append(user_data)
    return jsonify({'users': output})
```


コード解説 (Read - 全件取得):
- @app.route('/users', methods=['GET']): /users というURLパスに対して、HTTPのGETメソッドでリクエストがあった場合に get_all_users 関数が実行されます。
- users = User.query.all(): User モデルのクエリオブジェクト (User.query) を使用して、users テーブルに格納されている全てのユーザーレコードを取得します。all() メソッドは、結果をPythonのリストとして返します。リストの各要素は User オブジェクトです。
- output = []: 返却するユーザー情報を格納するための空のリストを初期化します。
- for user in users:: 取得した User オブジェクトのリストを反復処理します。
- user_data = {'id': user.id, 'username': user.username, 'email': user.email, 'is_active': user.is_active}: 各 User オブジェクトから必要な属性（id, username, email, is_active）を取り出し、辞書形式でまとめます。これはJSONとしてクライアントに返すための準備です。
- output.append(user_data): 作成したユーザー情報の辞書を output リストに追加します。
- return jsonify({'users': output}): output リストを 'users' というキーの値として持つ辞書を作成し、それをJSON形式でクライアントに返します。
  
#### IDを指定して取得
```python
@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id) # 主キーで検索
    # または user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    user_data = {'id': user.id, 'username': user.username, 'email': user.email, 'is_active': user.is_active}
    return jsonify({'user': user_data})
```

コード解説 (Read - ID指定取得):
- @app.route('/users/<int:user_id>', methods=['GET']): /users/<user_id> というURLパスに対してGETリクエストがあった場合に get_user 関数が実行されます。<int:user_id> の部分はURLパスパラメータで、int は user_id が整数であることを示し、関数の引数 user_id に渡されます。
- user = User.query.get(user_id): User モデルのクエリオブジェクトの get() メソッドを使用します。get() は主キーを指定して単一のレコードを効率的に取得するためのメソッドです。引数に user_id を渡すことで、対応するユーザーを検索します。
- コメントアウトされている user = User.query.filter_by(id=user_id).first() も同様の結果を得られますが、主キー検索の場合は get() の方が一般的に推奨されます。
- if not user:: get() メソッドでユーザーが見つからなかった場合（user が None の場合）、エラーメッセージとステータスコード404 (Not Found) をJSON形式で返します。
- user_data = {'id': user.id, 'username': user.username, 'email': user.email, 'is_active': user.is_active}: 見つかった User オブジェクトから情報を辞書にまとめます。
- return jsonify({'user': user_data}): ユーザー情報を 'user' というキーの値として持つ辞書を作成し、JSON形式で返します。

#### 条件を指定して取得
```python
@app.route('/users/search', methods=['GET'])
def search_users():
    username = request.args.get('username')
    email = request.args.get('email')

    query = User.query
    if username:
        query = query.filter(User.username.ilike(f'%{username}%')) # 大文字小文字を区別しない部分一致
    if email:
        query = query.filter(User.email.ilike(f'%{email}%'))

    users = query.all()
    if not users:
        return jsonify({'message': 'No users found matching criteria'}), 404

    output = []
    for user in users:
        user_data = {'id': user.id, 'username': user.username, 'email': user.email, 'is_active': user.is_active}
        output.append(user_data)
    return jsonify({'users': output})
```

コード解説 (Read - 条件指定取得):
- @app.route('/users/search', methods=['GET']): /users/search というURLパスに対してGETリクエストがあった場合に search_users 関数が実行されます。
- username = request.args.get('username'): URLのクエリパラメータから username の値を取得します。例えば、/users/search?username=test のようなリクエストの場合、username に 'test' が代入されます。指定がなければ None になります。
- email = request.args.get('email'): 同様にクエリパラメータから email の値を取得します。
- query = User.query: ベースとなるクエリオブジェクトを作成します。
- if username:: username クエリパラメータが指定されている場合、以下のフィルターを追加します。
  - query = query.filter(User.username.ilike(f'%{username}%')): User.username カラムに対して、指定された username を含む（部分一致）レコードを検索します。ilike() は大文字・小文字を区別しない検索を行います。% はワイルドカードで、任意の文字列を表します。
- if email:: email クエリパラメータが指定されている場合、同様にメールアドレスで部分一致検索（大文字・小文字区別なし）のフィルターを追加します。
- users = query.all(): 構築されたクエリを実行し、条件に一致する全てのユーザーレコードを取得します。
- if not users:: 条件に一致するユーザーが見つからなかった場合、メッセージとステータスコード404を返します。
- 残りの部分は「全件取得」と同様に、取得したユーザーリストをJSON形式で返します。

### 5.3. データの更新 (Update)
更新対象のデータを取得し、属性値を変更した後、db.session.commit() で保存します。
```python
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    if 'username' in data:
        # 他のユーザーが既に使用しているユーザー名は許可しない
        existing_user = User.query.filter(User.username == data['username'], User.id != user_id).first()
        if existing_user:
            return jsonify({'message': 'Username already exists'}), 400
        user.username = data['username']
    if 'email' in data:
        # 他のユーザーが既に使用しているメールアドレスは許可しない
        existing_email = User.query.filter(User.email == data['email'], User.id != user_id).first()
        if existing_email:
            return jsonify({'message': 'Email already exists'}), 400
        user.email = data['email']
    if 'is_active' in data:
        user.is_active = data['is_active']

    try:
        db.session.commit()
        return jsonify({'message': 'User updated!', 'user': {'id': user.id, 'username': user.username, 'email': user.email}})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update user', 'error': str(e)}), 500
```

コード解説 (Update):
- @app.route('/users/<int:user_id>', methods=['PUT']): /users/<user_id> というURLパスに対して、HTTPのPUTメソッドでリクエストがあった場合に update_user 関数が実行されます。PUTはリソースの更新に使われることが多いメソッドです。
- user = User.query.get(user_id): URLパスから受け取った user_id を使って、更新対象のユーザーレコードを取得します。
- if not user:: ユーザーが見つからなければ、404エラーを返します。
- data = request.get_json(): リクエストボディから更新内容を含むJSONデータを取得します。
- if 'username' in data:: リクエストデータに username が含まれていれば、更新処理を行います。
  - existing_user = User.query.filter(User.username == data['username'], User.id != user_id).first(): 新しいユーザー名 (data['username']) が、現在のユーザー (user_id) 以外で既に使われていないかを確認します。User.id != user_id という条件で、自分自身との重複チェックは除外しています。
  - if existing_user:: もし他のユーザーがそのユーザー名を使っていたら、400エラー（Bad Request）を返します。
  - user.username = data['username']: 問題がなければ、取得した user オブジェクトの username 属性を新しい値で更新します。この時点ではまだデータベースには反映されていません。
- if 'email' in data:: username と同様に、リクエストデータに email が含まれていれば、メールアドレスの重複チェックを行い、問題なければ user.email 属性を更新します。
- if 'is_active' in data:: is_active が含まれていれば、user.is_active 属性を更新します。
- db.session.commit(): user オブジェクトに加えられた変更（属性値の更新）をデータベースに永続化します。SQLAlchemyは変更を追跡しており、コミット時に適切なUPDATE文が発行されます。
- return jsonify(...): 更新成功のメッセージと、更新後のユーザー情報（ID、ユーザー名、メールアドレス）をJSON形式で返します。
- except Exception as e: と db.session.rollback(): データ作成時と同様に、コミット処理中にエラーが発生した場合の例外処理とロールバックを行います。
  
### 5.4. データの削除 (Delete)
削除対象のデータを取得し、db.session.delete() でセッションから削除後、db.session.commit() でデータベースから削除します。
```python
@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete user', 'error': str(e)}), 500
```

コード解説 (Delete):
- @app.route('/users/<int:user_id>', methods=['DELETE']): /users/<user_id> というURLパスに対して、HTTPのDELETEメソッドでリクエストがあった場合に delete_user 関数が実行されます。DELETEはリソースの削除に使われます。
- user = User.query.get(user_id): URLパスから受け取った user_id を使って、削除対象のユーザーレコードを取得します。
- if not user:: ユーザーが見つからなければ、404エラーを返します。
- db.session.delete(user): 取得した user オブジェクトをSQLAlchemyのセッションから削除対象としてマークします。
- db.session.commit(): セッションに加えられた変更（この場合はユーザーの削除）をデータベースに永続化します。これにより、対応するレコードがデータベースから削除されます。
- return jsonify({'message': 'User deleted!'}): 削除成功のメッセージをJSON形式で返します。
- except Exception as e: と db.session.rollback(): データ作成・更新時と同様に、コミット処理中にエラーが発生した場合の例外処理とロールバックを行います。

## 6. まとめ
重要なポイントは以下の通りです。
- SQLAlchemyの設定: SQLALCHEMY_DATABASE_URI で接続情報を正しく設定する。
- モデルの定義: db.Model を継承してPythonクラスとしてテーブルを表現する。
- セッション管理: db.session を通じてデータベース操作を行い、変更を commit() する。エラー時は rollback() する。
- クエリ: Model.query を使用して、all(), get(), filter_by(), filter() などでデータを取得する。

