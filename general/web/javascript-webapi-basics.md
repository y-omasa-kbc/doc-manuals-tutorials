# **Web APIハンズオン：PokeAPIで学ぶJavaScriptからのAPI呼び出し**

## **1. はじめに ** 

本授業では、現代のWeb開発に不可欠な「Web API」について、実践を通して学習する。

本授業のゴールは、JavaScriptを用いて外部のWeb APIを呼び出し、取得したデータをWebページに表示させる技術を習得することである。題材として、ポケモンのデータを取得できるPokeAPIを使用する。このハンズオンを通じて、Webページの内部動作と動的なWebアプリケーション開発の基礎を理解することを目的とする。

最終的に、ポケモンの名前またはIDを入力すると、該当する画像や情報を表示する簡易的な「ポケモン図鑑」を作成する。

## **2. 講義：Web APIの基本**

### **2.1. APIとは？**

APIとは **Application Programming Interface** の略称であり、「ソフトウェアやプログラムの機能を共有するための仕組み（インターフェース）」を指す。

身近な例としてレストランを想定する。

* **利用者**: 料理を注文する客  
* **機能提供元**: 料理を調理するキッチン  
* **API**: 利用者の注文をキッチンに伝え、完成した料理を利用者に提供するウェイター

この例における「ウェイター」の役割を果たすのがAPIである。利用者は、機能を提供する側の内部構造や実装方法を意識することなく、定められた手順で要求を伝えるだけで、目的の結果を得ることができる。

IT分野においても同様に、あるソフトウェアが公開している窓口（API）を通じて、別のソフトウェアがその機能を利用することが可能である。

### **2.2. Web APIとJSON**

本稿で扱う **Web API** とは、HTTP/HTTPSプロトコルを通じてインターネット経由で利用可能なAPIである。

Web APIを呼び出すと、多くの場合、データは **JSON (JavaScript Object Notation)** 形式で返却される。JSONは、その名の通り、JavaScriptのオブジェクトの書き方を基にしたデータ記述形式であり、可読性が高く、機械による処理も容易であるため、Web APIにおけるデータ交換の標準的な形式として広く利用されている。

**JSONの主な特徴:**

* **軽量性:** テキストベースであるため、データ量が少なく、通信に適している。  
* **可読性:** 人間が読み書きしやすいシンプルな構造を持つ。  
* **言語からの独立性:** 特定のプログラミング言語に依存しないため、サーバー側（例: Java, Python, Ruby）とクライアント側（例: JavaScript）で異なる言語が使われていても、問題なくデータをやり取りできる。

JSONで利用できるデータ型:  
JSONは、以下の基本的なデータ型を組み合わせることで、複雑なデータを表現できる。

* **文字列 (String):** "pikachu" のようにダブルクォーテーションで囲む。  
* **数値 (Number):** 25 のような整数や 6.0 のような浮動小数点数。  
* **真偽値 (Boolean):** true または false。  
* **配列 (Array):** ["denki", "nezumi"] のように [] で囲んだ値のリスト。  
* **オブジェクト (Object):** {"key": "value"} のように {} で囲んだキーと値のペアの集まり。オブジェクトの中にさらにオブジェクトや配列を入れることで、階層構造を表現できる。  
* **null:** 値が存在しないことを示す。

**JSONの例:**
```json
{  
  "id": 25,  
  "name": "pikachu",  
  "height": 4,  
  "weight": 60,  
  "is_legendary": false,  
  "types": [  
    {  
      "slot": 1,  
      "type": {  
        "name": "electric",  
        "url": "https://pokeapi.co/api/v2/type/13/"  
      }  
    }  
  ],  
  "location": null  
}
```
このようにデータは{}で囲まれ、"キー": 値 のペアで表現される。値には、文字列や数値だけでなく、配列（types）や他のオブジェクト（typeオブジェクト）も指定できる。

JSONの学習リソース:  
JSONの構造や書き方に慣れるために、以下のリソースが役立つ。

* **MDN Web Docs (Mozilla):** JSONの公式な仕様や使い方について、簡潔かつ正確に解説されている。  
  * [JSON の紹介](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/JSON)  
* **JSON入門 (ドットインストール):** 動画形式でJSONの基本を視覚的に学ぶことができる。  
  * [JSON入門 (全6回)](https://www.google.com/search?q=https://dotinstall.com/lessons/basic_json)  
* **JSONLint / JSON Formatter:** 自身で書いたJSONが正しい形式か検証したり、読みにくいJSONを整形（インデントを付けて見やすく）したりできるオンラインツール。デバッグ時に非常に有用である。  
  * [JSONLint](https://jsonlint.com/)

### **2.3. 非同期処理と fetch**

Web APIからのデータ取得には通信時間が伴う。データの到着を待つ間、Webページ全体の動作が停止（ブロッキング）すると、ユーザー体験を損なう原因となる。

この問題を解決するため、JavaScriptでは **非同期処理（Asynchronous Processing）** が用いられる。これは、時間のかかる処理の完了を待たずに後続の処理を進め、完了後に結果を受け取る仕組みである。

この非同期処理を実装するため、現在のJavaScriptには fetch 関数が標準で提供されている。fetch は、指定したURLにリクエストを送信し、結果を **Promise** オブジェクトとして返す。Promiseを利用することで、処理の成功時（.then()）と失敗時（.catch()）のコールバック関数を予約できる。

**fetch の基本的な処理手順：**

1. fetch('APIのURL') でリクエストを送信。  
2. .then(response => response.json()) で、レスポンスをJSON形式に変換。  
3. .then(data => { ... }) で、変換されたデータを用いてページを更新するなどの処理を行う。  
4. .catch(error => { ... }) で、通信失敗などのエラー発生時の処理を行う。

具体的な実装は、次のハンズオンで確認する。

### **2.4. JavaScriptの事前学習について（推奨）**

本ハンズオンでは、Webページに動的な機能を追加するためにJavaScriptを使用する。JavaScriptの経験がない、または復習が必要な学生は、事前に以下のリソースで基礎を学習することを推奨する。

最低限、以下の概念を理解していると、ハンズオンがスムーズに進む。

* 変数と定数 (let, const)  
* 関数 (function)  
* イベントリスナー (addEventListener)  
* DOM (Document Object Model) の基本操作 (getElementById)

**【推奨学習リソース】**

* **MDN Web Docs (Mozilla):** JavaScriptの公式リファレンスとして非常に信頼性が高い。基本的な文法から網羅的に学習できる。  
  * [JavaScript | MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript)  
* **Progate:** スライドと実践形式で、ブラウザ上で手を動かしながら学習できるサービス。  
  * [JavaScriptコース](https://prog-8.com/courses/es6)  
* **ドットインストール:** 3分動画で簡潔に学べる学習サイト。JavaScriptの基礎講座が豊富に用意されている。  
  * [JavaScript入門](https://dotinstall.com/lessons/basic_javascript_v5)

## **4. ハンズオン：ミニポケモン図鑑の作成**

本項では、実際にコードを記述し、簡易的なポケモン図鑑を作成する。以下の手順に従い、ファイルを作成・編集していくこと。

### **4.1. 今回使用するPokeAPIについて**

今回のハンズオンでは、**PokeAPI** というWeb APIを利用する。

PokeAPIは、世界中の開発者コミュニティによって維持されている、ポケモンに関するデータを無料で提供するWeb APIである。登録やAPIキーは不要で、誰でも自由に利用できるため、APIの学習に最適な教材である。

このAPIを通じて、ポケモンの名前、図鑑番号、タイプ、画像、技など、非常に詳細なデータを取得することが可能である。

* **公式サイト:** https://pokeapi.co/

### **4.2. Step 1: HTMLファイルの作成**

まず、プロジェクトの土台となるindex.htmlファイルを作成する。エディタ（Visual Studio Codeなど）で新しいファイルを作成し、以下のコードをすべてコピーして貼り付けること。

ポイント：  
\</body\>タグの直前に\<script src="script.js" defer\>\</script\>という行がある。これが、外部のJavaScriptファイルscript.jsを読み込むための記述である。defer属性は、HTMLの解析が完了してからスクリプトを実行するための重要な指定である。  
```html
<!DOCTYPE html>  
<html lang="ja">  
<head>  
    <meta charset="UTF-8">  
    <meta name="viewport" content="width=device-width, initial-scale=1.0">  
    <title>ミニポケモン図鑑</title>  
    <style>  
        /* 簡単なスタイリング */  
        body {  
            font-family: sans-serif;  
            line-height: 1.6;  
            background-color: #f4f4f4;  
            color: #333;  
            padding: 20px;  
            max-width: 600px;  
            margin: 0 auto;  
        }  
        h1 {  
            color: #e3350d; /* ポケモンロゴ風の赤 */  
            text-align: center;  
        }  
        .search-container {  
            display: flex;  
            gap: 10px;  
            margin-bottom: 20px;  
        }  
        #pokemonInput {  
            flex-grow: 1;  
            padding: 10px;  
            border: 2px solid #ccc;  
            border-radius: 5px;  
            font-size: 16px;  
        }  
        #searchButton {  
            padding: 10px 20px;  
            background-color: #3b4cca; /* ポケモンロゴ風の青 */  
            color: white;  
            border: none;  
            border-radius: 5px;  
            font-size: 16px;  
            cursor: pointer;  
            transition: background-color 0.3s;  
        }  
        #searchButton:hover {  
            background-color: #303ca1;  
        }  
        #pokemonResult {  
            background-color: #fff;  
            border: 2px solid #dedede;  
            border-radius: 8px;  
            padding: 20px;  
            text-align: center;  
            min-height: 200px;  
        }  
        #pokemonResult h2 {  
            margin-top: 0;  
            text-transform: capitalize; /* 名前を大文字始まりにする */  
        }  
        #pokemonResult img {  
            width: 150px;  
            height: 150px;  
            image-rendering: pixelated; /* ドット絵をきれいに見せる */  
        }  
    </style>  
</head>  
<body>

    <h1>ミニポケモン図鑑</h1>  
    <p>ポケモンの名前か全国図鑑IDを入力して検索ボタンを押してください。</p>  
      
    <div class="search-container">  
        <input type="text" id="pokemonInput" placeholder="例: pikachu または 25">  
        <button id="searchButton">検索</button>  
    </div>

    <div id="pokemonResult">  
        <p>ここに検索結果が表示されます</p>  
    </div>

    <!-- script.jsファイルを読み込む -->  
    <script src="script.js" defer></script>

</body>  
</html>
```

### **4.3. Step 2: JavaScriptファイルの作成**

次に、Webページに動きをつけるためのJavaScriptコードを記述する。  
index.htmlと同じ階層（同じフォルダ内）にscript.jsという名前で新しいファイルを作成し、以下のコードをすべてコピーして貼り付けること。  
コード内のコメントで各処理の詳細な解説を行っているため、一行ずつ意味を確認すること。
```javascript
// === JavaScript Code (script.js) ===

// 1. HTMLの要素を取得し、変数に格納する  
// これにより、JavaScriptからHTMLの各部分を操作できるようになる  
const pokemonInput = document.getElementById('pokemonInput');  
const searchButton = document.getElementById('searchButton');  
const pokemonResult = document.getElementById('pokemonResult');

// 2. 検索ボタンがクリックされたときに実行する関数を登録する  
searchButton.addEventListener('click', fetchPokemonData);

// Enterキーが押されたときも、検索ボタンがクリックされたときと同じ関数を実行する  
pokemonInput.addEventListener('keydown', (event) => {  
    if (event.key === 'Enter') {  
        fetchPokemonData();  
    }  
});

// 3. PokeAPIからデータを取得し、表示を更新するためのメインの関数  
function fetchPokemonData() {  
    // 入力された値を取得し、APIで使えるように小文字に変換する  
    const pokemonNameOrId = pokemonInput.value.toLowerCase();

    // 入力が空の場合は、ユーザーに通知して処理を中断する  
    if (!pokemonNameOrId) {  
        alert('ポケモンの名前かIDを入力してください。');  
        return;  
    }  
      
    // API通信中は「検索中...」というメッセージを表示する  
    pokemonResult.innerHTML = '<p>検索中...</p>';

    // PokeAPIのエンドポイントURLを組み立てる  
    const apiUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId}`;

    // 4. fetch API を使ってデータを非同期で取得する  
    fetch(apiUrl)  
        .then(response => {  
            // レスポンスが成功したかチェック (HTTPステータスコードが 200-299)  
            // 失敗した場合 (例: ポケモンが見つからない 404 Not Found)、エラーを投げて .catch() に処理を移す  
            if (!response.ok) {  
                throw new Error('そのポケモンは見つかりませんでした。名前やIDを確認してください。');  
            }  
            // レスポンスのボディをJSONとして解析する。この処理も非同期であるため、.then()でつなぐ  
            return response.json();  
        })  
        .then(data => {  
            // 5. データ取得成功：受け取ったデータを使って表示を更新する関数を呼び出す  
            // console.log(data); // どんなデータが返ってくるかコンソールで確認すると、構造がわかって便利  
            displayPokemon(data);  
        })  
        .catch(error => {  
            // 6. データ取得失敗：エラーメッセージを表示する  
            console.error('API呼び出しでエラーが発生しました:', error);  
            pokemonResult.innerHTML = `<p style="color: red;">${error.message}</p>`;  
        });  
}

// 7. 取得したポケモンデータをHTMLに整形して表示する関数  
function displayPokemon(data) {  
    // APIから返されたデータオブジェクトから必要な情報を取り出す  
    const name = data.name;  
    const id = data.id;  
    const imageUrl = data.sprites.front_default;  
    const height = data.height / 10; // デシメートルからメートルに変換  
    const weight = data.weight / 10; // ヘクトグラムからキログラムに変換  
    const types = data.types.map(typeInfo => typeInfo.type.name).join(' / ');

    // 表示するためのHTML文字列をテンプレートリテラルで作成する  
    const html = `  
        <h2>${name} (No.${id})</h2>  
        <img src="${imageUrl}" alt="${name}" onerror="this.style.display='none'">  
        <p><strong>タイプ:</strong> ${types}</p>  
        <p><strong>高さ:</strong> ${height} m</p>  
        <p><strong>重さ:</strong> ${weight} kg</p>  
    `;

    // 結果表示用のdiv要素の中身を、作成したHTMLで上書きする  
    pokemonResult.innerHTML = html;  
}
```
### **4.4. Step 3: 動作確認**

index.htmlとscript.jsの2つのファイルを保存し、index.htmlファイルをWebブラウザ（Google Chromeなど）で開く。  
表示されたページの入力欄に「pikachu」や「25」などのポケモンの名前かIDを入力し、「検索」ボタンをクリックすること。  
入力に対応したポケモンの情報が表示されれば成功である。  
以上でハンズオンは完了である。

## **5. まとめと発展課題**

### **まとめ**

* **API**は、プログラムの機能を外部から利用するためのインターフェースである。  
* **Web API**は、HTTP/HTTPS通信で利用でき、多くは**JSON**形式でデータを返却する。  
* JavaScriptの **fetch** を用いることで、**非同期**にWeb APIを呼び出し、動的にページを更新できる。  
* fetch は **Promise** を返し、.then() で成功時の処理、.catch() で失敗時の処理を記述する。

### **発展課題**

以上のハンズオンで基本を習得した。さらに理解を深めるための発展課題を以下に示す。

1. **表示情報の追加**: dataオブジェクトには、「覚えている技(moves)」などの情報も含まれる。これらを追加で表示すること。（console.log(data) をコードに追加すると、返却されるデータ構造を確認できる）  
2. **タイプの日本語化**: 現在英語で表示されているタイプを日本語に変換する処理を追加すること。（ヒント: script.jsのdisplayPokemon関数内で、連想配列やswitch文を使う）  
3. **デザインの改善**: index.htmlの\<style\>タグ内にCSSをさらに追記し、UIをより魅力的に改善すること。  
4. **様々なWeb APIを試してみる**: PokeAPI以外にも、世の中には学習や開発に利用できる無料のWeb APIが数多く存在する。いくつか例を挙げるので、次のステップとして挑戦してみること。  
   * **JSONPlaceholder**: テストやプロトタイピングのための「偽」のAPI。ユーザー、投稿、写真などのダミーデータを手軽に取得でき、API操作の練習に最適。APIキーは不要。  
     * 公式サイト: https://jsonplaceholder.typicode.com/  
   * **気象庁 天気予報データ**: 日本の各地域の天気予報データをJSON形式で提供している。身近なデータを扱う良い実践になる。APIキーは不要。  
     * 公式サイト: https://www.jma.go.jp/jma/bosai/forecast/  
   * **Studio Ghibli API**: スタジオジブリの映画、登場人物、場所などの情報を取得できる。楽しく学べる題材として人気がある。APIキーは不要。  
     * 公式サイト: https://ghibliapi.dev/  
   * **OpenWeatherMap**: 世界中の都市の現在の天気や週間予報を取得できる、非常に有名なAPI。無料プランを利用するには、サイトで登録してAPIキーを取得する必要がある。APIキーの扱い方を学ぶ良い機会となる。  
     * 公式サイト: https://openweathermap.org/

