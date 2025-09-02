# **Playwrightハンズオン - PythonではじめるE2Eテスト入門**

## **1. はじめに**

このテキストは、Pythonを使ったWeb開発を学んでいる皆さんを対象に、モダンなE2E（End-to-End）テストツールである**Playwright**の基本的な使い方を解説するハンズオン形式のチュートリアルです。

### **E2Eテストとは？**

E2Eテストは「End-to-End（エンドツーエンド）テスト」の略で、**ユーザーの操作を模倣して、アプリケーション全体の動作を端から端まで通しで確認する**テスト手法です。

例えば、「ユーザーがサイトにアクセスし、ログインボタンをクリックし、IDとパスワードを入力してログインし、マイページが表示される」といった一連の流れ（シナリオ）を自動でテストします。

これにより、各機能が単体で正しく動くだけでなく、それらが連携しても問題なく動作することを保証できます。

### **Playwrightとは？**

Playwrightは、Microsoftが開発したモダンなE2Eテストフレームワークです。以下のような大きな特徴があります。

* **クロスブラウザ対応**: Chromium (Google Chrome, Edge), Firefox, WebKit (Safari) の主要な3つのブラウザエンジンをすべてサポートしています。  
* **高速で信頼性が高い**: 自動待機機能が賢く、要素が表示されるまで自動で待ってくれるため、不安定なテスト（flaky test）が起こりにくくなっています。  
* **優れた開発者体験**: テストの記録（Codegen）、実行結果の詳細なレポート、ステップごとの状態を確認できるTrace Viewerなど、開発を強力にサポートするツールが揃っています。  
* **Pythonとの親和性**: PythonicなAPIが提供されており、Pythonのテストフレームワーク（特にpytest）とシームレスに連携できます。

さあ、Playwrightを使ってテストの世界に飛び込んでみましょう！

## **2. 環境構築**

まずはPlaywrightを動かすための準備をします。

### **前提条件**

* [Python](https://www.python.org/) (3.7以上) がインストールされていること  
* pipが使えること  
* ターミナル（コマンドプロンプト、PowerShell, or Terminal）の基本的な操作がわかること

### **Playwrightのインストール**

1. まず、プロジェクト用のディレクトリを作成し、その中に移動します。  
   mkdir playwright-python-handson  
   cd playwright-python-handson

2. （推奨）Pythonの仮想環境を作成し、有効化します。  
   ```python
   python -m venv venv  
   # Windowsの場合  
   .\venv\Scripts\activate  
   # macOS/Linuxの場合  
   source venv/bin/activate
    ```
3. PlaywrightのPythonライブラリと、テストフレームワークであるpytestをインストールします。  
   ```
   pip install playwright pytest
    ```
4. Playwrightがブラウザを操作するために必要な実行ファイルをインストールします。  
   ```
   playwright install
   ```

これで準備は完了です！

## **3. はじめてのテストを書いてみよう**

早速、最初のテストコードを書いてみましょう。

### **テストファイルの作成**

プロジェクトディレクトリ直下に、test_first.py という名前でファイルを作成してください。（pytestはtest_で始まるファイルをテストファイルとして認識します）

### **テストコード**

作成した test_first.py に、以下のコードを貼り付けてください。
```python
import re  
from playwright.sync_api import Page, expect

# テストケースを関数として定義します。  
# pytest-playwrightプラグインが、引数に `page` オブジェクトを自動で渡してくれます。  
def test_access_playwright_and_check_title(page: Page):  
    # 1. 指定したURLにアクセスする  
    page.goto("https://playwright.dev/")

    # 2. ページのタイトルが特定の値であることを検証する  
    # expect関数で検証（アサーション）を行います。  
    # re.compileを使って正規表現でマッチングします。  
    expect(page).to_have_title(re.compile("Playwright"))
```
### **コードの解説**

* from playwright.sync_api import Page, expect  
  * Playwrightの同期APIから、型ヒント用のPageとアサーション用のexpectをインポートしています。  
* def test_...(page: Page):  
  * test_で始まる関数が1つのテストケースになります。  
  * 引数のpage: Pageは、操作対象のブラウザページを表すオブジェクトです。pytest-playwrightが自動的にこの引数を設定してくれます。  
* page.goto("https://playwright.dev/")  
  * 指定したURLにページを遷移させるメソッドです。  
* expect(page).to_have_title(re.compile("Playwright"))  
  * expect()は検証（アサーション）を行うための関数です。  
  * .to_have_title()は、ページのタイトルを検証するマッチャーです。ここではPythonのreモジュールを使い、「Playwright」という文字列がタイトルに含まれていることを確認しています。

## **4. テストの実行と結果の確認**

書いたテストを実行してみましょう。

### **テスト実行コマンド**

ターミナルで以下のコマンドを実行します。

pytest

このコマンドは、現在のディレクトリ以下にあるtest_で始まるファイルをすべて探し、テストを実行します。デフォルトではヘッドレスモード（ブラウザUIが表示されないモード）のChromiumで実行されます。

実行結果がターミナルに表示され、「1 passed」のように表示されれば成功です！

### **テストレポートの確認**

Playwrightの素晴らしい機能の1つが、詳細なHTMLレポートです。pytestでレポートを生成するには、実行時にオプションを追加します。
```
pytest --output=test-results/test-report.html --reporter=html
```
テスト実行後、以下のコマンドでレポートを表示できます。
```
playwright show-report test-results/test-report.html
```
コマンドを実行すると、自動でブラウザが立ち上がり、テスト結果のレポートが表示されます。

## **5. Webページの要素を操作する**

次に、実際のユーザー操作のように、ページ上の要素をクリックしたり、テキストを入力したりする方法を学びます。

### **テストシナリオ**

今回は以下のシナリオをテストコードにしてみましょう。

1. Playwright公式サイトにアクセスする  
2. ナビゲーションにある「Get started」リンクをクリックする  
3. ページの ``` <h1> ``` 見出しが「Installation」であることを確認する

### **テストコードの作成**

test_interaction.py というファイルを作成し、以下のコードを記述します。
```python
from playwright.sync_api import Page, expect

def test_click_get_started_link(page: Page):  
    # Playwright公式サイトにアクセス  
    page.goto("https://playwright.dev/")

    # 要素を特定してクリックする  
    # get_by_roleは、要素の役割（role）に基づいて要素を特定する推奨される方法です。  
    # 'link'の役割を持ち、名前が 'Get started' の要素を探します。  
    page.get_by_role("link", name="Get started").click()

    # 遷移後のページで特定の要素のテキストを検証する  
    # 'heading'の役割を持ち、名前が 'Installation' であるh1要素を検証します。  
    expect(page.get_by_role("heading", name="Installation")).to_be_visible()
```
### **コードの解説：ロケーター**

Playwrightで要素を操作する上で最も重要な概念が**ロケーター (Locator)** です。PythonでもTypeScript版と同じAPI名（スネークケース）で利用できます。

* page.get_by_role(role, name="...")  
  * WAI-ARIAのロールに基づいて要素を特定します。  
* page.get_by_text("テキスト"): 指定したテキストを持つ要素を特定します。  
* page.get_by_label("ラベルテキスト"): <label>要素に関連付けられたフォーム部品を特定します。

### **テストの実行**

特定のファイルだけを実行することも可能です。
```
pytest test_interaction.py
```
実行後、レポートも確認してみてください。

## **6. さらに便利な機能**

最後に、Playwrightの開発をさらに加速させる2つの便利機能を紹介します。

### **1. Codegen (コードジェネレーター)**

codegen は、**ブラウザ上で行った操作を自動でPythonのテストコードに変換してくれる**魔法のようなツールです。

以下のコマンドを実行してみてください。--target pythonオプションでPythonコードを指定します。
```
playwright codegen --target python -o "tests/generated_test.py" [https://playwright.dev/](https://playwright.dev/)
```
すると、ChromiumブラウザとPlaywright Inspectorという2つのウィンドウが立ち上がります。ブラウザ上で行った操作がリアルタイムでコードとして記録され、指定したファイル（この場合はtests/generated_test.py）に保存されます。

### **2. Trace Viewer (トレースビューア)**

Trace Viewer は、テストが失敗した原因を調査するための強力なデバッグツールです。pytest実行時に--tracing onオプションを付けます。
```
pytest --tracing on
```
テストが失敗すると、ターミナルにTraceファイルへのパスが表示されます。もしくは、テスト成功時でもtest-resultsディレクトリ内にtrace.zipが生成されます。

HTMLレポートを開き、失敗したテストのセクションにある虫眼鏡アイコンをクリックすると、Trace Viewerが起動します。

## **7. まとめと次のステップ**

このハンズオンでは、以下のことを学びました。

* E2EテストとPlaywrightの概要  
* Playwright for Pythonの環境構築方法  
* pytestを使った基本的なテストの書き方と実行方法  
* ロケーターを使った要素の特定と操作  
* expect を使った検証（アサーション）  
* codegen や Trace Viewer といった便利なツール

**次のステップ:**

* **いろいろなサイトで試す**: 普段使っているWebサイトや、自分で作ったアプリケーションでテストを書いてみましょう。  
* **認証のテスト**: ログインが必要なページのテスト方法を調べてみましょう (storage_state がキーワードです)。  
* **公式ドキュメントを読む**: Playwrightの公式ドキュメントは非常に充実しています。  
* [Playwright for Python公式ドキュメント](https://playwright.dev/python/docs/intro)

E2Eテストは、Webアプリケーションの品質を担保する上で非常に重要です。ぜひPlaywrightを使いこなし、自信を持ってコードをリリースできる開発者を目指してください。

## **付録: unittestと組み合わせて利用する**

このチュートリアルの本編では、Playwright公式が推奨するpytestとpytest-playwrightプラグインを使った方法を紹介しました。プラグインがブラウザの起動やpageオブジェクトの準備などを自動で行ってくれるため、非常に便利です。

ここでは、Pythonに標準で組み込まれているunittestフレームワークを使ってPlaywrightのテストを記述する方法を解説します。この方法では、ブラウザの起動や終了などを手動で管理する必要があります。

### **1. テストファイルの作成**

test_unittest_playwright.pyという名前でファイルを作成し、以下のコードを記述します。
```python
import unittest  
import re  
from playwright.sync_api import sync_playwright

class PlaywrightTests(unittest.TestCase):

    # 各テストメソッドが実行される「前」に呼ばれる  
    def setUp(self):  
        # Playwrightのコンテキストマネージャーを開始  
        self.playwright = sync_playwright().start()  
        # Chromiumブラウザを起動  
        self.browser = self.playwright.chromium.launch(headless=True)  
        # 新しいページ（タブ）を作成  
        self.page = self.browser.new_page()

    # 各テストメソッドが実行された「後」に呼ばれる  
    def tearDown(self):  
        # ブラウザを閉じる  
        self.browser.close()  
        # Playwrightを停止する  
        self.playwright.stop()

    # 'test_'で始まるメソッドがテストケースとして認識される  
    def test_playwright_website_title(self):  
        # Playwright公式サイトにアクセス  
        self.page.goto("[ttps://playwright.dev/")

        # ページタイトルを取得  
        title = self.page.title()

        # unittestのアサーションメソッドを使ってタイトルを検証  
        self.assertIn("Playwright", title)  
          
        # Playwrightのexpectを使ったアサーションも利用可能です  
        from playwright.sync_api import expect  
        expect(self.page).to_have_title(re.compile("Playwright"))

if __name__ == '__main__':  
    unittest.main()
```
### **コードの解説**

* **setUp(self)メソッド**:  
  * unittest.TestCaseの特別なメソッドで、各テストメソッド（test_...）が実行される直前に必ず呼び出されます。  
  * ここでsync_playwright()を開始し、ブラウザを起動、新しいページを作成して、selfの属性として保持しています。  
* **tearDown(self)メソッド**:  
  * こちらも特別なメソッドで、各テストメソッドの実行直後に必ず呼び出されます。  
  * テストの後片付けとして、ブラウザを閉じ、Playwrightのプロセスを停止しています。これにより、リソースが解放されます。  
* **test_playwright_website_title(self)**:  
  * 実際のテスト処理を記述するメソッドです。setUpで準備されたself.pageを使ってWebページを操作します。  
  * 検証には、unittestに組み込まれているself.assertIn()のようなアサーションメソッドを使用します。  
  * もちろん、Playwrightのexpectをインポートして使うことも可能です。

### **2. テストの実行**

ターミナルで以下のコマンドを実行して、テストを実行します。
```
python -m unittest test_unittest_playwright.py
```
実行結果が表示され、OKと表示されればテストは成功です。

このように、unittestでもPlaywrightを利用することは可能ですが、setUp/tearDownの定型コードを自分で記述する必要があります。特別な理由がない限りは、pytestとpytest-playwrightプラグインの組み合わせがよりシンプルでおすすめです。