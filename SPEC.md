# SPEC: ドキュメント・マニュアル・チュートリアル集

このリポジトリの目的、構成、`general` に置くものの基準、既知の課題を定める。
エージェント向けの作業手順は [AGENTS.md](AGENTS.md) を参照する。

## 1. 目的

IT系専門学校の学生向けに、**複数の授業で使える参考ドキュメント**を公開する。

- 読者は学生である。教員向けの内部資料は置かない。
- 1つの文書は特定の授業に依存せず、単体で読めるようにする。
  「第2回で学んだ」のように、授業の回や順序を前提にした記述は避ける。
- 連載は、同じディレクトリ内の前後の文書へのリンクで関係を示す。

## 2. 公開形態

- GitHub の公開リポジトリ（`y-omasa-kbc/doc-manuals-tutorials`）で公開している。
  GitHub Pages は使っておらず、学生は GitHub 上で Markdown を閲覧する。
- したがって Markdown は GitHub のレンダリングで正しく読めることを基準とする（Mermaid 図を含む）。
- ファイルパスはそのまま公開URLになる。授業資料からリンクされている可能性があるため、
  移動・改名は必要な場合に限って行う。
- [README.md](README.md) が全文書の索引である。

## 3. ディレクトリ構成

| ディレクトリ | 内容 |
| --- | --- |
| `general/` | 特定の技術に縛られない内容（第4章） |
| `azure/` | Azure の各サービス。サービスごとにサブディレクトリを分ける |
| `docker/` | Docker、Docker Compose |
| `llm/` | LLM の利用、LLM 関連のサービスやフレームワーク |
| `php/` | PHP |
| `python/` | Python の環境構築、フレームワーク、Python による実装 |
| `typescript/` | TypeScript の環境、テスト、DB連携 |

新しい言語や製品の文書を追加するときは、トップレベルに技術名のディレクトリを作る。

## 4. `general` に置くもの

### 4.1 定義

`general` は、**汎用的に使えるツール**と、**設計など特定の技術だけに縛られない話題**を置く場所である。
どの言語、フレームワーク、クラウドを使う授業でも参照できることを条件とする。

### 4.2 判定基準

上から順に判定し、最初に当てはまったものに従う。

1. **主題が特定の言語、フレームワーク、クラウド製品の習得である** → その技術のディレクトリに置く。
   タイトルやファイル名に技術名が入っている文書（`-python`、「PHPにおける」など）はここに該当する。
2. **複数の授業で共通して使う開発ツールの使い方である** → `general` に置く。
   Git、作図ツール、APIクライアント、OS のコマンド操作が該当する。
3. **設計、概念、Web標準の解説である** → `general` に置く。
   HTTP、HTML、ブラウザの JavaScript は Web の共通基盤であり、特定の技術としては扱わない。
4. **上記で決まらない** → コード例を別の言語に置き換えても本文の大半が成り立つなら `general`、
   成り立たないならその技術のディレクトリに置く。

文書中に特定の言語のコード例があるだけでは、`general` から外す理由にならない。
たとえば CORS の文書の Express の設定例や、CSP の文書の PHP の例は、概念を説明するための例である。

概念の解説と実装のハンズオンが1つの文書に混在し、実装が主である場合は、その技術のディレクトリに置く。
概念部分を複数の授業で使いたい場合は、概念を `general` の文書として切り出し、実装の文書からリンクする。

### 4.3 サブディレクトリ

| ディレクトリ | 内容 | 文書 |
| --- | --- | --- |
| `general/architecture/` | 設計パターン、アーキテクチャ | キューベースの設計パターン |
| `general/git/` | Git の操作と運用 | ブランチの基礎、コミットメッセージの書き方 |
| `general/tool/` | 汎用の開発ツールの使い方 | Draw.io、Thunder Client、Postman |
| `general/web/` | Web の概念、標準、API設計 | CORS、CSP、REST、OpenAPI、GET/POST、SSR/SPA、JavaScript からの Web API 利用 |
| `general/windows/` | Windows の基本操作 | コマンドプロンプト、PowerShell の基礎 |

サブディレクトリは話題の種類で分ける。`general/azure/` のように技術名で分ける必要が生じたら、
その内容はトップレベルの技術のディレクトリに置くべきものである。

## 5. ファイルの規則

| 対象 | 規則 | 例 |
| --- | --- | --- |
| 文書名 | 英小文字の kebab-case。実装の言語がある場合は末尾に付ける | `jwt-basics-python.md` |
| 連載 | 末尾に連番を付ける | `drawio-basics-1.md` |
| 画像 | `<文書名>-img/` に置く | `install-python-windows-store-img/001.png` |
| サンプルコードなどの付属ファイル | `<文書名>-resource/` に置く | `openapi-basics-resource/sample1.yml` |
| 演習の解答 | `<文書名>-ans.md` とする | `azure-queue-storage-basics-ans.md` |

文書内のリンクと画像は相対パスで書く。

## 6. 既知の課題

現状の棚卸しで見つかった課題である。`general` の整理とは別に、個別のセッションで対応する。

### 索引

- 次の文書が README に載っていない。
  - `azure/functions/azure-functions-http-documentdb-python.md`
  - `azure/functions/azure-functions-http-documentdb-mongodb-python.md`
  - `azure/queue-storage/azure-queue-storage-basics-python.md`
  - `python/python-concurrency.md`
- README に載っている CosmosDB の2文書は、本文の先頭で DEPRECATED とされている。
  DocumentDB 版への案内に置き換えるかを判断する。
- README の冒頭に、同じ見出しと説明文が重複している。

### 内容

- `azure/overview/azure-staticapp-webapi.md` 5行目: 「静적コンテンツ」にハングルが混入している。
- `azure/app-configuration/azure-app-configuration-basics.md` 122行目:
  「第2回で学んだ」が授業の回に依存している。参照先の文書もリポジトリ内にない。
- `general/tool/postman-basics-01.md` 9行目: 「Brunoと同様に」とあるが Bruno の文書はない。
  タイトルが Part 1 だが Part 2 もない。
- `general/windows/command-prompt-basics.md`: タイトルが特定の授業名（システム開発入門）を含む。
- `general/web/javascript-webapi-basics.md`: 章番号が2から4に飛んでいる。
- `general/web/about-cors.md`: 第3章が重複し、見出しレベルも揃っていない。
- 全体の情報の鮮度（ツールのUI、ライブラリのバージョン、クラウドサービスの仕様）を確認していない。

### 概念の切り出し

次の文書は概念部分が他の授業でも使えるため、`general/web/` への切り出しを検討する。

- `php/http-session-management.md`: HTTP のステートレス性、Cookie、セッションの概念
- `python/auth/jwt-basics-python.md`: JWT の構造、認証フロー、セキュリティ上の注意点
- `python/auth/passkey-basics-python.md`: 第1部の概論（FIDO、公開鍵による認証の仕組み）

### 表記と命名

- Google ドキュメントから変換した痕跡が残っている（`## **1\. はじめに**` の太字とエスケープ、行末の空白）。
- 見出しの付け方が文書によって異なる（タイトルが `#` でなく `##` の文書がある）。
- ファイル名の誤字: `azure/ai-services/azure-ai-language-pyhton.md`
- 表記の不統一: 付属ファイルの `-resource` と `-resources`、連番の `-1` と `-01`、
  README の「MongoDB MyMongo」とファイル名の `mymongo`（本文は pymongo）。

### リポジトリ

- ライセンスが未設定である。学生や他の授業での再利用条件を明示するか判断する。
