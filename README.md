# ドキュメント、マニュアル、チュートリアル

このリポジトリには、さまざまな技術やトピックに関するドキュメント、マニュアル、チュートリアルが含まれています。

## ドキュメント、マニュアル、チュートリアル

このリポジトリには、さまざまな技術やトピックに関するドキュメント、マニュアル、チュートリアルが含まれています。

## 目次

- [ドキュメント、マニュアル、チュートリアル](#ドキュメントマニュアルチュートリアル)
  - [ドキュメント、マニュアル、チュートリアル](#ドキュメントマニュアルチュートリアル-1)
  - [目次](#目次)
  - [総合](#総合)
    - [Git関連](#git関連)
    - [Web関連](#web関連)
    - [Windows関連](#windows関連)
    - [アーキテクチャ関連](#アーキテクチャ関連)
    - [ツール関連](#ツール関連)
  - [Docker](#docker)
  - [Azure](#azure)
    - [Azure 概論](#azure-概論)
    - [Azure AI サービス](#azure-ai-サービス)
    - [Azure Functions](#azure-functions)
    - [Azure Queue Storage](#azure-queue-storage)
    - [Azure App Configuration](#azure-app-configuration)
    - [Azure Application Insights](#azure-application-insights)
  - [Python](#python)
    - [Python フレームワーク](#python-フレームワーク)
    - [Python セットアップ](#python-セットアップ)
    - [Python 認証](#python-認証)
  - [PHP](#php)
  - [LLM](#llm)
    - [OpenRouter](#openrouter)
    - [LangChain](#langchain)
  - [TypeScript](#typescript)
    - [TypeScript API サーバー](#typescript-api-サーバー)
    - [TypeScript Jest](#typescript-jest)
    - [TypeScript MongoDB](#typescript-mongodb)
    - [TypeScript Playwright](#typescript-playwright)

## 総合

### Git関連

- [Git Branch Basics](general/git/git-branch-basics.md)
- [Writing Commit Messages](general/git/writing-commit-message.md)

### Web関連

- [Webシステム開発：CORS（オリジン間リソース共有）を理解しよう](general/web/about-cors.md)
- [RESTful APIの基礎](general/web/basics-restful-api.md)
- [OpenAPI 基礎](general/web/openapi-basics.md)
- [JavaScript による Web API アクセスの基礎](general/web/javascript-webapi-basics.md)
- [フォームのGETメソッドとPOSTメソッドの基本](general/web/form-get-post.md)
- [SSRとSPAの基礎知識](general/web/ssr-spa-basics.md)
- [Content Security Policy (CSP) の基礎](general/web/content-security-policy.md)

### Windows関連

- [コマンドプロンプト基礎](general/windows/command-prompt-basics.md)

### アーキテクチャ関連

- [キューベースの非同期処理パターン](general/architecture/queue-base-pattern.md)

### ツール関連

- [Draw.ioの基本 1](general/tool/drawio-basics-1.md)
- [Draw.ioの基本 2](general/tool/drawio-basics-2.md)
- [API テスト：Thunder Client を使ってみよう](general/tool/api-testing-thunder-client.md)
- [Postman入門 Part 1](general/tool/postman-basics-01.md)

## Docker

- [Docker Compose を用いた Web システムの構築](docker/docker-compose-websystem.md)

## Azure

### Azure 概論

- [静的WebアプリケーションとAzure Functions 概論およびAWSとの比較](azure/overview/azure-staticapp-webapi.md)

### Azure AI サービス

- [演習：PythonによるAzure AI Languageサービスの活用：感情分析とキーフレーズ抽出](azure/ai-services/azure-ai-language-pyhton.md)
- [演習：PythonとAzure AI VisionによるAI画像分析](azure/ai-services/azure-ai-vision-python.md)
- [演習：PythonによるAzure OpenAI Serviceの利用](azure/ai-services/azure-openai-python-basics.md)

### Azure Functions

- [Azure Functions を用いたWeb API作成　基礎](azure/functions/azure-functions-http-basic-python.md)
- [Azure Functions HTTP CosmosDB Python](azure/functions/azure-functions-http-cosmosdb-python.md)
- [Azure Functions を用いたWeb API作成　CosmosDBとの連携(for MongoDB)](azure/functions/azure-functions-http-cosmosdb-mongodb-python.md)

### Azure Queue Storage

- [Azure Queue Storage の基礎](azure/queue-storage/azure-queue-storage-basics.md)
- [Azure Queue Storage のパターン 1](azure/queue-storage/queue-pattern-azure-storage-1.md)
- [Azure Queue Storage のパターン 2](azure/queue-storage/queue-pattern-azure-storage-2.md)

### Azure App Configuration

- [Azure App Configuration で学ぶ機能フラグ (Feature Flags)](azure/app-configuration/azure-app-configuration-basics.md)

### Azure Application Insights

- [Azure Application Insights による Webシステムの可観測性確保](azure/application-insights/azure-application-insights-basics.md)

## Python

- [MongoDB MyMongo Python 基礎](python/mongodb-mymongo-python-basics.md)

### Python フレームワーク

- [Flask SQLAlchemy MariaDB](python/framework/flask-sqlalchemy-mariadb.md)
- [LangChainとOllamaを使用したMarkdown情報に基づく質疑応答システムの構築](python/framework/langchain-ollama-rag.md)
- [Streamlit Web API Basics](python/framework/streamlit-webapi-basics.md)

### Python セットアップ

- [Windows に PyEnv をインストール](python/setup/install-pyenv-windows.md)
- [Windows ストアから Python をインストール](python/setup/install-python-windows-store.md)

### Python 認証

- [JWTの基礎(Python版)](python/auth/jwt-basics-python.md)
- [パスキー認証の概論と実装ハンズオン (Python版)](python/auth/passkey-basics-python.md)

## PHP

- [PHPにおけるCookieとセッションを利用したセッション管理](php/http-session-management.md)

## LLM

### OpenRouter

- [OpenRouter](llm/openrouter.md)

### LangChain

- [LangChain RAG 第1回 - Python, LangChain, OpenRouterによるPDF QAシステム構築](llm/langchain/langchain-rag-01.md)
- [LangChain RAG 第2回 - 対話機能とストリーミング出力](llm/langchain/langchain-rag-02.md)
- [LangChain RAG 第3回 - RAGの精度向上テクニック](llm/langchain/langchain-rag-03.md)
- [LangChain RAG 第4回 - RAGの精度向上テクニック2](llm/langchain/langchain-rag-04.md)

## TypeScript

### TypeScript API サーバー

- [API サーバー TypeScript パート1](typescript/apiserver-typescript/apiserver-typescript-1.md)

### TypeScript Jest

- [Jest と TypeScript の基礎 1](typescript/jest-typescript-basics-1.md)
- [Jest と TypeScript の基礎 2](typescript/jest-typescript-basics-2.md)
- [Jest と TypeScript の Mock](typescript/jest-typescript-mock.md)

### TypeScript MongoDB

- [TypeScriptとMongoDBの連携 第1回演習: TypeScriptとMongoDB Native DriverによるCRUD操作](typescript/mongodb-typescript-1-native.md)
- [MongoDB TypeScript パート2: Mongoose](typescript/mongodb-typescript-2-mongoose.md)

### TypeScript Playwright

- [Playwright と TypeScript の基礎](typescript/playwright-typescript-basics.md)
