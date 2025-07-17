# **演習課題 - 解答例 (ファンアウトパターン)**

この資料は、「Azure Queue Storage ハンズオン資料 (基本演習編)」の「3. 演習課題」の解答例です。

### **課題の目的**

この演習課題の目的は、1つのイベントをきっかけに複数の異なる処理を並行して実行する **「ファンアウト（Fan-out）」** パターンを実装することです。これにより、関心の分離が促進され、より柔軟で堅牢なシステムを構築する方法を学びます。

### **解答の手順**

#### **ステップ1: 新しいキュー (email-queue) を作成する**

1. Azure Portalにサインインします。  
2. 基本演習で作成したストレージアカウントに移動します。  
3. 左側のメニューから「キュー」を選択します。  
4. 「+ キュー」ボタンをクリックし、キュー名に email-queue と入力して作成します。

これで、メッセージを格納するための2つのキュー (survey-queue と email-queue) が準備できました。

#### **ステップ2: Web APIを修正し、2つのキューにメッセージを送信する**

web-api/index.js の内容を以下のように修正します。Promise.all を使うことで、2つのキューへの送信処理を並行して効率的に実行できます。
```javascript
// web-api/index.js

const express = require('express');  
const { QueueClient } = require("@azure/storage-queue");

const app = express();  
app.use(express.json());

// 使用するAzure Storageの接続文字列に置換  
const CONNECTION_STRING = "ここにAzure Storageの接続文字列を貼り付け";  
const SURVEY_QUEUE_NAME = "survey-queue";  
const EMAIL_QUEUE_NAME = "email-queue"; // ★追加

app.post('/survey', async (req, res) => {  
    try {  
        console.log('アンケートリクエスト受信:', req.body);

        // ★★★ここからが修正ポイント★★★  
        // 1. 2つのキューに対するクライアントを作成  
        const surveyQueueClient = new QueueClient(CONNECTION_STRING, SURVEY_QUEUE_NAME);  
        const emailQueueClient = new QueueClient(CONNECTION_STRING, EMAIL_QUEUE_NAME);  
          
        // 2. キューが存在しない場合は作成  
        await Promise.all([  
            surveyQueueClient.createIfNotExists(),  
            emailQueueClient.createIfNotExists()  
        ]);

        // 3. 送信するメッセージを準備  
        const messageText = JSON.stringify(req.body);  
        const base64Message = Buffer.from(messageText).toString('base64');

        // 4. 両方のキューに同じメッセージを送信  
        console.log(`メッセージを2つのキューに追加します: ${messageText}`);  
        await Promise.all([  
            surveyQueueClient.sendMessage(base64Message),  
            emailQueueClient.sendMessage(base64Message)  
        ]);  
        // ★★★ここまでが修正ポイント★★★

        // 5. ユーザーに受付完了の応答を返す  
        res.status(202).send({ message: "アンケートの集計および通知処理を受け付けました。" });

    } catch (error) {  
        console.error(error);  
        res.status(500).send({ message: "サーバーエラーが発生しました。" });  
    }  
});

const port = 3000;  
app.listen(port, () => {  
    console.log(`Web APIサーバー起動 (ポート: ${port})`);  
});
```
#### **ステップ3: 新しい「メール送信ワーカー」を作成する**

1. azure-handson フォルダ内に、新しく email-worker フォルダを作成します。  
2. VS Codeで email-worker フォルダを開き、ターミナルで以下のコマンドを実行します。
   ```  
   npm init -y  
   npm install @azure/storage-queue
   ```
3. index.js ファイルを作成し、以下のコードを記述します。このワーカーは、新しく作成した **email-queue のみを**監視します。  
   ```javascript
   // email-worker/index.js  
   const { QueueClient } = require("@azure/storage-queue");

   // 接続文字列と、このワーカー専用のキュー名を設定  
   const CONNECTION_STRING = "ここにAzure Storageの接続文字列を貼り付け";  
   const QUEUE_NAME = "email-queue";

   async function main() {  
       console.log("★★ メール送信ワーカー起動。'email-queue'の監視を開始します。 ★★");  
       const queueClient = new QueueClient(CONNECTION_STRING, QUEUE_NAME);

       while (true) {  
           try {  
               const response = await queueClient.receiveMessages({  
                   numberOfMessages: 1,  
                   visibilityTimeout: 30   
               });

               if (response.receivedMessageItems.length > 0) {  
                   const message = response.receivedMessageItems[0];  
                   const messageText = Buffer.from(message.messageText, 'base64').toString();  
                   const messageData = JSON.parse(messageText);

                   if (messageData.email) {  
                       console.log(`[メール送信処理] ${messageData.email} 宛にサンキューメールを送信します...`);  
                   } else {  
                       console.log("[メール送信処理] メッセージにemailが含まれていません。スキップします。");  
                   }

                   await new Promise(resolve => setTimeout(resolve, 1000)); // ダミーの処理時間

                   await queueClient.deleteMessage(message.messageId, message.popReceipt);  
                   console.log(`[メール送信処理] 完了。メッセージを削除しました。`);  
               } else {  
                   await new Promise(resolve => setTimeout(resolve, 5000));  
               }  
           } catch (error) {  
               console.error("★★ メール送信ワーカーでエラー発生:", error);  
               await new Promise(resolve => setTimeout(resolve, 5000));  
           }  
       }  
   }

   main();
   ```
   **注意:** CONNECTION_STRING の値を、ご自身の接続文字列に書き換えてください。

#### **ステップ4: 動作確認**

1. **2つのターミナル**を準備します。  
2. **ターミナル1**で、元の**集計ワーカー**を起動します。  
   ```
   # azure-handson フォルダにいることを確認  
   cd worker   
   node index.js 
   ```
3. **ターミナル2**で、新しく作成した**メール送信ワーカー**を起動します。  
   ```
   # azure-handson フォルダにいることを確認  
   cd email-worker  
   node index.js
   ```
4. 修正した**Web API**を起動します。  
5. Postmanからリクエストを**1回**送信します。

#### **ステップ5: 結果の観察**

* **集計ワーカー**のターミナルに「[処理開始]...」というログが表示されます。  
* **メール送信ワーカー**のターミナルに「[メール送信処理]...」というログが表示されます。  
* Azure Portalで確認すると、survey-queue と email-queue の両方に一瞬メッセージが入り、それぞれのワーカーに処理された後、両方ともメッセージ数が0に戻ります。

この結果から、1つのAPIリクエストをきっかけに、2つの異なる処理がそれぞれ独立したキューとワーカーによって並行して実行されたことが確認できます。