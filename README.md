# ドキュメント、マニュアル、チュートリアル

IT系専門学校の学生向けに、複数の授業で使える参考ドキュメントを公開しています。

特定の技術に縛られない内容は「総合」に、特定の言語や製品に関する内容は技術ごとの項目にまとめています。

## 目次

- [総合](#総合)
- [Azure](#azure)
- [Docker](#docker)
- [LLM](#llm)
- [PHP](#php)
- [Python](#python)
- [TypeScript](#typescript)

## 総合

### アーキテクチャ

- [Queueベースのシステム設計パターン](general/architecture/queue-base-pattern.md)

### Git

- [Gitブランチ機能の概要](general/git/git-branch-basics.md)
- [Gitコミットメッセージの書き方](general/git/writing-commit-message.md)

### ツール

- [Draw.io入門 Part 1：基本操作をマスターしよう！](general/tool/drawio-basics-1.md)
- [Draw.io入門(Part 2)：フローチャートとUML図を描いてみよう！](general/tool/drawio-basics-2.md)
- [VSCode拡張機能「Thunder Client」によるWeb APIテスト入門](general/tool/api-testing-thunder-client.md)
- [Postman入門 Part 1](general/tool/postman-basics-01.md)

### Web

- [フォームのGETとPOSTメソッドの違い](general/web/form-get-post.md)
- [SSRとSPA 基礎](general/web/ssr-spa-basics.md)
- [RESTful API 入門](general/web/basics-restful-api.md)
- [OpenAPI とは何か？ API設計の共通言語を学ぼう](general/web/openapi-basics.md)
- [Web APIハンズオン：PokeAPIで学ぶJavaScriptからのAPI呼び出し](general/web/javascript-webapi-basics.md)
- [Webシステム開発：CORS（オリジン間リソース共有）を理解しよう](general/web/about-cors.md)
- [Content Security Policy (CSP) 解説](general/web/content-security-policy.md)

### Windows

- [WindowsのCUI操作をマスターしよう！](general/windows/command-prompt-basics.md)

## Azure

### 概論

- [静的WebアプリケーションとAzure Functions 概論およびAWSとの比較](azure/overview/azure-staticapp-webapi.md)

### Azure AI サービス

- [演習：PythonによるAzure AI Languageサービスの活用：感情分析とキーフレーズ抽出](azure/ai-services/azure-ai-language-python.md)
- [演習：PythonとAzure AI VisionによるAI画像分析](azure/ai-services/azure-ai-vision-python.md)
- [演習：PythonによるAzure OpenAI Serviceの利用](azure/ai-services/azure-openai-python-basics.md)

### Azure Functions

- [Azure Functions を用いたWeb API作成　基礎](azure/functions/azure-functions-http-basic-python.md)
- [Azure Functions を用いたWeb API作成　CosmosDBとの連携(Azure DocumentDB)](azure/functions/azure-functions-http-documentdb-python.md)
- [Azure Functions と Azure DocumentDB による ToDo API の作成](azure/functions/azure-functions-http-documentdb-mongodb-python.md)
- （非推奨）[Azure Functions を用いたWeb API作成　CosmosDBとの連携](azure/functions/azure-functions-http-cosmosdb-python.md)
- （非推奨）[Azure Functions を用いたWeb API作成　CosmosDBとの連携(for MongoDB)](azure/functions/azure-functions-http-cosmosdb-mongodb-python.md)

### Azure Queue Storage

- [Azure Queue Storage 基礎 (Node.js版)](azure/queue-storage/azure-queue-storage-basics.md)
- [Azure Queue Storage 基礎 (Python版)](azure/queue-storage/azure-queue-storage-basics-python.md)
- [Azure Queue Storage によるメッセージングパターン実践1](azure/queue-storage/queue-pattern-azure-storage-1.md)
- [Azure Queue Storage によるメッセージングパターン実践2](azure/queue-storage/queue-pattern-azure-storage-2.md)

### Azure App Configuration

- [Azure App Configuration で学ぶ機能フラグ (Feature Flags)](azure/app-configuration/azure-app-configuration-basics.md)

### Azure Application Insights

- [Azure Application Insights による Webシステムの可観測性確保](azure/application-insights/azure-application-insights-basics.md)

## Docker

- [Docker Composeハンズオン：Webアプリ環境を構築しよう](docker/docker-compose-websystem.md)

## LLM

### OpenRouter

- [OpenRouter入門：多様なLLMを使いこなす](llm/openrouter.md)

### LangChain

- [LangChain RAG 第1回 - Python, LangChain, OpenRouterによるPDF QAシステム構築](llm/langchain/langchain-rag-01.md)
- [LangChain RAG 第2回 - 対話機能とストリーミング出力](llm/langchain/langchain-rag-02.md)
- [LangChain RAG 第3回 - RAGの精度向上テクニック](llm/langchain/langchain-rag-03.md)
- [LangChain RAG 第4回 - RAGの精度向上テクニック2](llm/langchain/langchain-rag-04.md)

## PHP

- [PHPにおけるCookieとセッションを利用したセッション管理](php/http-session-management.md)

## Python

### セットアップ

- [Windows 11でコマンドプロンプトを使ってpyenvをインストールし、Python 3.12を導入・デフォルト設定する手順](python/setup/install-pyenv-windows.md)
- [Windows Store から Python をインストールする手順](python/setup/install-python-windows-store.md)

### フレームワーク

- [FlaskとSQLAlchemyを使用したMariaDBへのアクセス](python/framework/flask-sqlalchemy-mariadb.md)
- [LangChainとOllamaを使用したMarkdown情報に基づく質疑応答システムの構築](python/framework/langchain-ollama-rag.md)
- [PythonとStreamlitで学ぶWeb API活用ハンズオン：PokeAPIでポケモン図鑑を作成](python/framework/streamlit-webapi-basics.md)

### データベース

- [MongoDB+pymongo ハンズオン：MongoDBのCRUD操作](python/mongodb-pymongo-python-basics.md)

### 認証

- [Web API開発：JWTによる認証・認可の仕組みと実装 (Python版)](python/auth/jwt-basics-python.md)
- [パスキー認証の概論と実装ハンズオン (Python版)](python/auth/passkey-basics-python.md)

### 並行処理

- [Python並行処理ハンズオン：マルチスレッド、マルチプロセス、キュー](python/python-concurrency.md)

### テスト

- [Playwrightハンズオン - PythonではじめるE2Eテスト入門](python/test/playwright-python-basics.md)

## TypeScript

### API サーバー

- [演習テキスト：TypeScriptとExpressによるWeb API開発入門](typescript/apiserver-typescript/apiserver-typescript-1.md)

### Jest

- [Jestによるユニットテスト入門 Part 1](typescript/jest-typescript-basics-1.md)
- [Jestによるユニットテスト入門ハンズオン (後半)](typescript/jest-typescript-basics-2.md)
- [JestとTypeScriptによるモックテストガイド](typescript/jest-typescript-mock.md)

### MongoDB

- [TypeScriptとMongoDBの連携 第1回演習: TypeScriptとMongoDB Native DriverによるCRUD操作](typescript/mongodb-typescript-1-native.md)
- [TypeScriptとMongoDBの連携 第2回演習: Mongooseを使った高度なCRUD操作](typescript/mongodb-typescript-2-mongoose.md)
