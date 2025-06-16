# app/Dockerfile

# ベースイメージとしてNode.jsのLTS (Long Term Support) バージョンを使用
FROM node:20-alpine

# コンテナ内の作業ディレクトリを作成・指定
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonを先にコピー
# これにより、ソースコードの変更だけで `npm install` が再実行されるのを防ぎます
COPY package*.json ./

# 依存関係をインストールします
RUN npm install

# アプリケーションのソースコードをすべてコピーします
COPY . .

# package.json の "start" スクリプトを実行してアプリケーションを起動します
CMD ["npm", "run", "start"]
