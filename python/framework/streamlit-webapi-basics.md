# **PythonとStreamlitで学ぶWeb API活用ハンズオン：PokeAPIでポケモン図鑑を作成**

## **1. はじめに**

このハンズオンでは、PythonのWebアプリケーションフレームワークである**Streamlit**と、世界中のポケモンデータを集めた**PokeAPI**を使用し、オリジナルのポケモン図鑑を作成します。

Web APIからデータを取得し、Webアプリケーションとして表示する一連の流れを体験することで、モダンなシステム開発の基礎を実践的に学習します。

### **学習目標**

* Web APIの基本的な概念（リクエスト、レスポンス、JSON）を理解する。  
* Pythonのrequestsライブラリを使用してAPIにアクセスする。  
* Streamlitを使用してインタラクティブなWebアプリケーションを構築する。  
* APIから取得したデータを整形して画面に表示する方法を習得する。

### **完成イメージ**

ユーザーがポケモンの名前を入力してボタンを押すと、そのポケモンの情報（名前、図鑑番号、タイプ、画像）が表示されるシンプルなWebアプリケーションを作成します。

## **2. 準備**

### **2.1. Web APIとは**

Web API (Application Programming Interface) は、ソフトウェアやプログラムの機能を外部から利用するためのインターフェースとして機能します。今回は、ポケモンのデータを提供している「PokeAPI」というWeb APIを利用します。

作成するアプリケーションがPokeAPIにデータ取得のリクエストを送信すると、PokeAPIは指定されたポケモンのデータを**JSON**という形式で返します。

### **2.2. Streamlitとは**

Streamlitは、データ分析や機械学習の成果を共有するための、オープンソースのPythonライブラリです。最大の特長は、**Pythonスクリプトのみで、対話的な操作が可能なWebアプリケーションを容易かつ迅速に作成できる**点にあります。

通常、Webアプリケーションを開発するにはHTML、CSS、JavaScriptといった複数の技術知識が必要ですが、Streamlitを使用すれば、それらの知識がなくてもPythonのみで開発が可能です。

* **インタラクティブなUI部品**: ボタン、スライダー、テキスト入力などのUI部品（ウィジェット）を、簡単なPython関数を呼び出すだけで追加できます。  
* **コードの変更が即座に反映**: コードを保存すると、Webアプリケーションが自動的にリロードされ、変更内容がすぐに反映されます。このため、試行錯誤を伴う開発を円滑に進めることができます。  
* **データサイエンスとの親和性**: もともとデータ分析の結果を可視化するために作られたツールであるため、PandasのデータフレームやMatplotlib/Plotlyのグラフなどを簡単に表示できます。

このハンズオンでは、Streamlitを使用することで、Webフロントエンドの複雑な部分を意識することなく、APIからのデータ取得と処理という本質的な部分に集中できます。

### **2.3. 開発環境の準備**

このハンズオンを進めるには、Pythonがインストールされている必要があります。

1. プロジェクト用フォルダの作成  
   任意の場所に作業用のフォルダを作成します。  
   ```
   mkdir streamlit-pokedex  
   cd streamlit-pokedex
   ```
2. 仮想環境の作成と有効化  
   プロジェクトごとにPythonの環境を分離するため、仮想環境を作成します。これにより、他のプロジェクトとの依存関係の競合を防止できます。  
   ターミナルで以下のコマンドを実行し、venvという名前の仮想環境を作成します。  
   ```
   python -m venv venv
   ```
   次に、作成した仮想環境を有効化します。  
   **Windowsの場合:**  
   ```
   .\venv\Scripts\activate
   ```
   **macOS / Linuxの場合:**
   ```  
   source venv/bin/activate
   ```
   有効化されると、ターミナルのプロンプトの先頭に (venv) と表示されます。  
3. 必要なライブラリのインストール  
   次に、使用するstreamlitとrequestsをインストールします。ターミナルで以下のコマンドを実行してください。  
   ```
   pip install streamlit requests
   ```
   これで準備は完了です。

## **3. ステップ・バイ・ステップによる開発**

### **ステップ1: Streamlitアプリケーションの起動**

まず、Streamlitが正しく動作するか確認します。  
streamlit-pokedexフォルダの中にapp.pyという名前のファイルを作成し、以下のコードを記述してください。  
**app.py**
```
import streamlit as st

st.title('Streamlitアプリケーション')  
st.write('Streamlitの動作確認')
```
ファイルを保存した後、ターミナルで以下のコマンドを実行します。
```
streamlit run app.py
```
コマンドを実行すると、自動的にブラウザが起動し、「Streamlitアプリケーション」と表示されれば成功です。

### **ステップ2: PokeAPIからのデータ取得**

次に、Pythonのrequestsライブラリを使用してPokeAPIにアクセスし、データを取得する関数を作成します。例として「ピカチュウ」の情報を取得します。

app.pyを以下のように書き換えてください。

**app.py**
```
import streamlit as st  
import requests

# PokeAPIからデータを取得する関数  
def fetch_pokemon_data(pokemon_name):  
    # APIのエンドポイントURL  
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}"  
    # APIにリクエストを送信  
    response = requests.get(url)  
      
    # レスポンスが正常（ステータスコード200）ならJSONを返す  
    if response.status_code == 200:  
        return response.json()  
    # 失敗した場合はNoneを返す  
    else:  
        return None

# アプリのタイトル  
st.title('ポケモン図鑑')

# テスト用にピカチュウのデータを取得  
pikachu_data = fetch_pokemon_data("pikachu")

# 取得したデータを表示  
if pikachu_data:  
    st.write("ピカチュウのデータを取得しました。")  
    st.json(pikachu_data) # JSONデータを整形して表示  
else:  
    st.error("データの取得に失敗しました。")
```
再度streamlit run app.pyでアプリを実行（または実行中のブラウザをリロード）すると、ピカチュウに関するデータがJSON形式で表示されます。これがAPIからのレスポンスです。

### **ステップ3: ユーザーインターフェース（UI）の作成**

APIから取得したデータをそのまま表示するだけでは実用的ではありません。ユーザーがポケモンの名前を入力できるフォームを作成します。

app.pyを以下のように変更してください。

**app.py**
```
import streamlit as st  
import requests

# (fetch_pokemon_data関数はそのまま)  
def fetch_pokemon_data(pokemon_name):  
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}"  
    response = requests.get(url)  
    if response.status_code == 200:  
        return response.json()  
    else:  
        return None

st.title('Streamlit ポケモン図鑑')

# ユーザーがポケモンの名前を入力するテキストボックス  
pokemon_name_input = st.text_input('ポケモンの名前を入力してください:', 'Pikachu')

# 検索ボタン  
if st.button('検索'):  
    # ポケモンデータを取得  
    data = fetch_pokemon_data(pokemon_name_input)  
      
    if data:  
        st.success(f"「{pokemon_name_input}」のデータが見つかりました。")  
        st.write("---") # 区切り線  
          
        # 取得したデータを表示（JSON形式）  
        st.json(data)  
    else:  
        st.error(f"「{pokemon_name_input}」のデータが見つかりませんでした。名前を確認してください。")
```
これにより、テキストボックスと検索ボタンが画面に表示されます。ポケモンの名前（英語）を入力して検索してください。

### **ステップ4: データ表示の整形**

最後のステップとして、JSON形式のデータを整形し、必要な情報のみを抽出して分かりやすく表示します。

PokeAPIのレスポンスの中から、以下の情報を抽出します。

* **名前**: name  
* **図鑑番号**: id  
* **画像**: sprites['front_default']  
* **タイプ**: types[n]['type']['name']

app.pyのif st.button('検索'):以降を、以下のように書き換えてください。これがこのハンズオンの最終形です。

**app.py (最終版)**
```
import streamlit as st  
import requests

# PokeAPIからデータを取得する関数  
def fetch_pokemon_data(pokemon_name):  
    """  
    指定されたポケモンのデータをPokeAPIから取得する。  
    """  
    if not pokemon_name:  
        return None  
      
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}"  
    try:  
        response = requests.get(url)  
        response.raise_for_status()  # 200番台以外のステータスコードで例外を発生させる  
        return response.json()  
    except requests.exceptions.RequestException as e:  
        print(f"API request error: {e}")  
        return None

# --- Streamlit アプリケーション ---

st.title('Streamlit ポケモン図鑑')  
st.caption('PokeAPIを使用してポケモンの情報を表示します。')

# ユーザーがポケモンの名前を入力するテキストボックス  
pokemon_name_input = st.text_input('ポケモンの名前を入力してください (例: pikachu, charizard):', '')

# 検索ボタン  
if st.button('検索', key='search_button'):  
    if pokemon_name_input:  
        # ポケモンデータを取得  
        data = fetch_pokemon_data(pokemon_name_input)  
          
        if data:  
            st.success(f"「{data['name'].capitalize()}」のデータが見つかりました。")  
            st.write("---")  
              
            # 2カラムレイアウトを作成  
            col1, col2 = st.columns(2)  
              
            with col1:  
                # ポケモンの画像  
                st.image(data['sprites']['front_default'], caption='公式アート', width=200)

            with col2:  
                # ポケモンの基本情報  
                st.subheader("基本情報")  
                st.write(f"**図鑑番号:** No. {data['id']}")  
                st.write(f"**名前:** {data['name'].capitalize()}")  
                  
                # タイプの情報を抽出して表示  
                types = [t['type']['name'] for t in data['types']]  
                st.write(f"**タイプ:** {', '.join(types).capitalize()}")

                # その他の情報  
                st.write(f"**高さ:** {data['height'] / 10} m")  
                st.write(f"**重さ:** {data['weight'] / 10} kg")

        else:  
            st.error(f"「{pokemon_name_input}」のデータが見つかりませんでした。名前（英語）を確認してください。")  
    else:  
        st.warning('ポケモンの名前を入力してください。')
```
### **解説**

* st.columns(2): 画面を2つの列に分割し、レイアウトを構成します。  
* with col1: / with col2:: それぞれの列に表示するコンテンツを記述します。  
* st.image(): URLを指定して画像を表示します。  
* st.subheader(): 小見出しを作成します。  
* data['sprites']['front_default']: JSONデータはPythonの辞書（dictionary）と同様に ['キー名'] でアクセスできます。これは入れ子になったデータ構造にも適用されます。  
* [t['type']['name'] for t in data['types']]: リスト内包表記を使用し、タイプのリストから名前の要素のみを効率的に抽出しています。

## **4. まとめと次のステップ**

以上で、Web APIからデータを取得し、Streamlitで表示する基本的なWebアプリケーションの開発は完了です。

このハンズオンを通じて、

* 外部APIとの連携方法  
* インタラクティブなUIの構築  
* 取得したデータの処理と表示  
  といった、実践的な開発スキルを習得できます。

### **発展: POSTメソッドによるデータ送信**

このハンズオンでは、APIから情報を取得するGETメソッドを使用しました。しかし、Web APIにはサーバーに新しいデータを作成したり、既存のデータを更新したりするためにPOSTメソッドも広く使われます。

POSTメソッドは、リクエストの本体（ボディ）に送信したいデータを含めてサーバーに送ります。例えば、新しいユーザーを登録する、ブログ記事を投稿するといった操作で利用されます。

Pythonのrequestsライブラリを使用してPOSTリクエストを送信する方法は以下の通りです。

#### **requests.post()の使用例**

ここでは、架空のAPIエンドポイント https://api.example.com/items に新しい商品データを登録するシナリオを想定します。
```
import requests  
import json

# 送信するデータ (Pythonの辞書)  
new_item_data = {  
    "name": "新しい商品",  
    "price": 1500,  
    "description": "これはテスト用の商品です。"  
}

# POSTリクエストを送信するAPIのURL  
url = "https://api.example.com/items"

# ヘッダーでContent-Typeを 'application/json' に指定  
headers = {  
    "Content-Type": "application/json"  
}

try:  
    # requests.post() を使用してデータをJSON形式で送信  
    # requestsのjson引数を使用すると、辞書が自動的にJSON文字列に変換されます  
    response = requests.post(url, json=new_item_data, headers=headers)  
      
    # レスポンスのステータスコードを確認  
    response.raise_for_status() # 200番台以外で例外を発生

    # 成功した場合、サーバーからのレスポンス(JSON)を表示  
    print("データの作成に成功しました。")  
    print("レスポンス:", response.json())

except requests.exceptions.RequestException as e:  
    print(f"エラーが発生しました: {e}")
```
**コードのポイント:**

* requests.post(url, json=data): postメソッドの第一引数にURL、json引数にPythonの辞書を渡すことで、自動的にJSON形式に変換してリクエストボディとして送信されます。  
* headers: Content-Type: application/json は、送信するデータがJSON形式であることをサーバーに伝えるための重要な情報です。requestsのjson引数を使用するとこのヘッダーは自動的に付与されますが、APIによっては他のヘッダー情報（認証トークンなど）が必要になる場合もあります。

この知識は、今後ご自身でデータを登録・更新する機能を持つAPIクライアントを開発する際に役立ちます。

### **発展課題**

このアプリケーションには、さらに機能を追加することが可能です。以下に発展課題の例を示します。

* **表示情報の追加**: 「とくせい（abilities）」や「ステータス（stats）」を表示する。  
* **進化情報の表示**: 別のAPIエンドポイントにアクセスし、進化先のポケモンの情報を取得・表示する。  
* **日本語対応**: ポケモンの名前を日本語で表示する。（ヒント: pokemon-speciesエンドポイントに日本語名が含まれています）  
* **キャッシュ機能の実装**: 一度検索したデータを保存し、再度同じポケモンを検索した際にAPIへのアクセスを省略する（@st.cache_dataデコレータを使用します）。  
* **デザインの改善**: CSSを使用して外観をカスタマイズする。

このハンズオンが、今後のシステム開発学習の助けとなることを期待します。