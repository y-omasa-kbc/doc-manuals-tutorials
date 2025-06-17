## **演習：PythonとAzure AI VisionによるAI画像分析**

本演習では、Microsoft Azureが提供するAIサービス「Azure AI Vision」を利用し、画像分析アプリケーションをPythonで作成します。これにより、実用的なAIの機能をローカル環境から利用する手順を学習します。

### **本演習の目標**

* Azure AI Visionの基本的な仕組みを理解する。  
* PythonからAzureのAIサービスを呼び出す方法を習得する。  
* 画像から情報を抽出するAI機能（キャプション生成、物体検出など）を体験する。

### **1. 準備**

演習に必要な環境・アカウントは以下の通りです。

* **Azureアカウント**: 未取得の場合は、[Azure無料アカウント](https://azure.microsoft.com/ja-jp/free/)または学生向けの[Azure for Students](https://azure.microsoft.com/ja-jp/free/students/)を参考に作成してください。  
* **Python環境**: ローカルPCにPythonがインストールされている必要があります。  
* **コードエディタ**: コーディング効率化のため、Visual Studio Code (VS Code)などの利用を推奨します。

### **2. Azure環境の準備**

はじめに、Azure上で画像分析AIのサービスリソースを作成します。

#### **ステップ1：Azureポータルへのサインイン**

[Azureポータル](https://portal.azure.com/)にアクセスし、自身のアカウントでサインインします。

#### **ステップ2：AI Visionリソースの作成**

1. ポータル上部の検索バーで「**AI Services**」と検索し、選択します。  
2. 「**作成**」をクリックします。  
3. 利用可能なサービス一覧から「**Computer Vision**」（AI Visionのサービス名）を選択し、「**作成**」をクリックします。  
4. 以下の設定項目を入力します。  
   * **サブスクリプション**: 自身のサブスクリプションを選択します。  
   * **リソースグループ**: 「**新規作成**」をクリックし、ai-vision-rgなど任意の名前を設定します。  
   * **リージョン**: **「米国東部 (East US)」** を選択します。（**注意:** キャプション機能など、一部の最新機能は米国リージョンで先行して提供されるため、本演習では米国東部を推奨します。）  
   * **名前**: my-ai-vision-service-uniqueなど、一意のサービス名を付けます。  
   * **価格レベル**: 「**Free F0**」（無料プラン）を選択します。（**重要:** 1つのサブスクリプションで利用できるF0プランの数には限りがあります。もしF0が表示されない場合は、既に他のAIサービスでF0プランを利用している可能性があります。その場合は、一時的に「Standard S0」を選択し、**演習終了後に必ずリソースを削除してください。** 詳細は後述の「料金について」の項を参照してください。）  
5. 入力内容を確認後、「**確認と作成**」をクリックし、続いて「**作成**」をクリックします。リソースのデプロイが完了するまで待機します。

#### **ステップ3：キーとエンドポイントの取得**

AIサービスと通信するために必要なキーとエンドポイントを取得します。

1. デプロイ完了後、「**リソースに移動**」をクリックします。これにより、作成したAI Visionサービス（例: my-ai-vision-service-unique）の管理ページが開きます。  
2. 左側のメニューにある「リソース管理」セクションから、「**キーとエンドポイント**」を選択します。  
3. 表示された「**キー1**」と「**エンドポイント**」の値をコピーし、安全な場所に保管します。これらの情報は機密情報であり、**第三者に絶対に開示しないでください。** 次のコーディングのセクションで、これらの情報の安全な取り扱いに関する重要な注意点も確認してください。

以上でAzure側の準備は完了です。

### **3. ローカル開発環境の準備**

次に、ローカルPCでPythonコードを実行する準備を行います。

#### **ステップ1：プロジェクトフォルダの作成**

任意の場所にpython-ai-visionなどの名前でプロジェクトフォルダを作成し、VS Codeで開きます。

#### **ステップ2：必要ライブラリのインストール**

Azure AI VisionをPythonから利用するためのSDKライブラリをインストールします。VS Codeのターミナル、または任意のターミナルで以下のコマンドを実行します。

pip install azure-ai-vision-imageanalysis

### **4. 画像分析のコーディング**

#### **⚠️ セキュリティに関する重要な注意：APIキーの取り扱い**

以下のコードでは、演習の分かりやすさを優先し、取得したキーとエンドポイントをソースコード内に直接書き込む（ハードコーディングする）方法を採用しています。

**この方法は、セキュリティ上非常に危険です。**

もし、キーが書き込まれたソースコードを誤って**GitHubなどのパブリックリポジトリに公開してしまうと、悪意のある第三者にキーを不正利用され、高額な料金を請求される**可能性があります。

実際の開発では、環境変数やAzure Key Vaultなどの仕組みを使い、キーをコードから分離することが強く推奨されます。本演習では、このリスクを十分に理解した上で、手順通りに進めてください。**作成したコードは、絶対にGitHub等で公開しないでください。**

新規ファイル analyze_image.py を作成し、以下のコードを記述します。
```python
import os  
from azure.ai.vision.imageanalysis import ImageAnalysisClient  
from azure.core.credentials import AzureKeyCredential

# Azureから取得したキーとエンドポイントを設定  
# ★★★ 自分のキーとエンドポイントに書き換えてください ★★★  
# 警告：これらの値を直接コードに書き込むことは、セキュリティリスクを伴います。  
# 本番環境では環境変数など、より安全な方法で管理してください。  
try:  
    endpoint = "YOUR_VISION_ENDPOINT"  
    key = "YOUR_VISION_KEY"  
except KeyError:  
    print("環境変数 'VISION_ENDPOINT' と 'VISION_KEY' を設定してください。")  
    exit()

# 画像分析クライアントのインスタンスを生成  
client = ImageAnalysisClient(  
    endpoint=endpoint,  
    credential=AzureKeyCredential(key)  
)

# 分析対象の画像URLを指定  
image_url = "https://learn.microsoft.com/azure/ai-services/computer-vision/media/quickstarts/presentation.png"

print(f"画像分析を開始します。対象URL: {image_url}")

# 画像分析を実行（キャプションとタグ生成を要求）  
result = client.analyze_from_url(  
    image_url=image_url,  
    visual_features=["Caption", "Tags"],  
    gender_neutral_caption=True,  # 性別を特定しないキャプションを生成  
)

print("分析が完了しました。")  
print("="*30)

# 結果を出力  
if result.caption is not None:  
    print("画像のキャプション:")  
    print(f"   '{result.caption.text}' (信頼度: {result.caption.confidence:.4f})")

if result.tags is not None:  
    print("画像のタグ:")  
    for tag in result.tags.list:  
        print(f"   '{tag.name}' (信頼度: {tag.confidence:.4f})")
```

### **5. 実行と結果の確認**

作成したコードを実行し、AIによる分析結果を確認します。

1. analyze_image.py内の endpoint と key の値を、ステップ3で取得したものに書き換えます。  
2. ターミナルで以下のコマンドを実行します。

python analyze_image.py

#### **実行結果の例**

次のような形式で結果が出力されれば成功です。
```
画像分析を開始します。対象URL: https://learn.microsoft.com/azure/ai-services/computer-vision/media/quickstarts/presentation.png  
分析が完了しました。  
==============================  
画像のキャプション:  
   'a person holding a pen and pointing to a screen with charts' (信頼度: 0.5966)  
画像のタグ:  
   'person' (信頼度: 0.9896)  
   'chart' (信頼度: 0.9855)  
   'indoor' (信頼度: 0.9754)  
   'office' (信頼度: 0.9235)  
   'text' (信頼度: 0.8927)  
   ...
```
AIが画像を分析し、内容を説明するキャプションや関連するタグが自動で生成されます。confidenceは、AIによる分析結果の信頼度スコアを示します。

### **6. 発展課題**

基本演習が完了したら、以下の課題に挑戦してください。

#### **課題1：任意のオンライン画像の分析**

image_urlの値を、任意のオンライン画像のURLに変更して実行し、結果の変化を確認してください。

#### **課題2：ローカル画像の分析**

ローカルPC上の画像ファイルを分析するには、analyze_from_url の代わりに analyze メソッドを使用します。コードを修正し、ローカル画像をアップロードして分析を実行してください。
```python
# (前略)

# ローカルの画像ファイルを指定  
image_path = "my_picture.jpg" # 分析したいファイル名に変更

print(f"'{image_path}' の画像を分析中...")

# ファイルをバイナリモードで読み込む  
with open(image_path, "rb") as f:  
    image_data = f.read()

# 画像分析の実行  
result = client.analyze(  
    image_data=image_data,  
    visual_features=["Caption", "Tags"]  
)

# (後略)
```
#### **課題3：他の分析機能の試用**

Azure AI Visionは多様な分析機能を提供します。visual_featuresのリストに以下の文字列を追加し、どのような結果が得られるか確認してください。

* "Objects": 画像内の物体を矩形で検出します。  
* "Read": 画像内の文字を読み取ります（OCR機能）。  
* "SmartCrops": 画像の主要な領域を抽出する候補を提案します。

### **7. 料金について：無料枠での実施**

本演習はAzureの無料枠の範囲で実施可能です。

* **無料プラン（Free F0）の利用**: 演習手順の通り、価格レベルとして「Free F0」を選択しているため、無料利用枠が適用されます。  
* **無料トランザクション数**: 「Free F0」プランでは、**1ヶ月あたり5,000トランザクション**が無料で提供されます。本演習で消費するトランザクション数はこの上限を大幅に下回るため、料金は発生しません。  
* **F0プランが選択できない場合**: やむを得ず「Standard S0」でリソースを作成した場合、演習で利用する数回のAPI呼び出しの料金はごくわずか（数円程度）です。ただし、**意図しない課金を防ぐため、演習が完了したら必ずリソースグループごと削除してください。**  
* **注意点**: 演習終了後、リソースが不要な場合は、Azureポータルから作成したリソースグループごと削除することを推奨します。これにより、意図しない課金を確実に防止できます。

### **8. まとめ**

本演習を通して、以下の内容を学習しました。

* **クラウドAIのセットアップ**: Azureポータル上で、AI Visionサービスを迅速に準備する手順。  
* **Pythonによるサービス利用**: 少量のPythonコードで、クラウド上のAIサービスをAPI経由で呼び出す方法。  
* **AIの画像分析能力**: 画像からの説明文（キャプション）生成やタグ付けといった、AIの具体的な機能を体験。

本演習はクラウドとAI技術への入門です。重要な点は、複雑なAI技術が、APIを通じて容易に利用可能なサービスとして提供されていることを理解することです。

発展課題で試したように様々な画像や機能を利用し、この技術の応用可能性について考察してください。