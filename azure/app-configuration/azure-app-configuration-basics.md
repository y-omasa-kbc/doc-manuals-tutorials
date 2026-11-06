# **Azure App Configuration で学ぶ機能フラグ (Feature Flags)**

## **1. はじめに：その新機能、いつ公開する？**

Webシステムの新機能をリリースする際、皆さんはどうしていますか？

* 「金曜日の夜中にサーバーを止めてデプロイ？」 → 😰 失敗したら徹夜で切り戻しです。  
* 「コードに if (today == '2026-04-01'): と書く？」 → ❌ 日付が変わるまでテストできません。

現代の開発現場では、**「デプロイ（コードをサーバーに置くこと）」**と**「リリース（ユーザーに見せること）」**を分けます。

コードはいつでもデプロイしておき、クラウド上の**「スイッチ」**をパチっと切り替えるだけで、新機能が有効になる。何かあればスイッチを切れば一瞬で元通り。

これを実現する技術が **「機能フラグ (Feature Flags)」** です。

今日の授業では、Azureの管理サービスを使って、**「アプリを再起動することなく、Webサイトの挙動を遠隔操作」**してみます。

## **2. 登場人物の紹介**

1. **Azure App Configuration:**  
   * アプリケーションの設定（設定値や機能フラグ）を一元管理するサービスです。Key Vaultが「金庫」なら、こちらは「司令塔」です。  
2. **機能フラグ (Feature Flag):**  
   * コード内の分岐（if文）を制御するための、ON/OFFのスイッチです。  
3. **RBAC (復習):**  
   * Key Vaultの時と同様、このサービスも「作成者＝閲覧可能」ではありません。適切なロール設定が必要です。

## **3. 準備：司令塔「App Configuration」を作る**

まずは設定を管理するリソースを作成します。

1. **Azure Portal** (https://portal.azure.com) にログインします。  
2. 「リソースの作成」から App Configuration を検索して選択します。  
3. **作成** をクリックし、以下の通り設定します。  
   * **サブスクリプション:** Azure for Students  
   * **リソースグループ:** 新規作成（例: rg-lesson-flags）  
   * **リソース名:** **世界で一意の名前**（例: appconfig-yourname-2026）  
   * **地域:** Japan East (東日本)  
   * **価格層 (重要):** **「Free (無料)」** を選択してください。  
     * ※Standardは課金が発生します。必ずFreeを選んでください。  
4. 「確認と作成」→「作成」をクリックします。

## **4. 権限設定：司令塔にアクセスする**

**【重要】ここがポイントです。**

Key Vaultと同様、App Configurationも「ゼロトラスト」モデルです。作成者（所有者）であっても、データ（機能フラグ）を読み書きする権限を明示的に持っていなければ、ポータル上での操作も拒否されます。

1. 作成したリソースの左メニューから **「アクセス制御 (IAM)」** をクリックします。  
2. **「追加」** → **「ロールの割り当ての追加」** をクリックします。  
3. **ロールの選択:**  
   * 検索バーに App Configuration Data Owner （または App Configuration データ所有者）と入力して選択し、「次へ」を押します。  
   * **※重要:** 今回はフラグを「作成（書き込み）」する必要があるため、閲覧者（Reader）ではなく、必ず **所有者（Owner）** を選んでください。  
4. **メンバーの選択:**  
   * 「メンバーを選択する」をクリックし、**自分自身の大学メールアドレス**（Azureにログインしているアカウント）を選択します。  
5. 「レビューと割り当て」を2回クリックして完了します。

**⚠️ 注意: 権限の反映待ちについて**

ロールの割り当てが完了しても、実際に権限が有効になるまで **5分〜10分程度** かかる場合があります。

次の手順で「権限がありません」等のエラーが出た場合は、焦らずに少し待ってからブラウザをリロードして再試行してください。

## **5. 機能フラグを作る**

権限が付与されたので、実際にスイッチを作成しましょう。今回は「新機能（NewFeature）」を制御するスイッチを作ります。

1. App Configuration リソースの左メニュー、「操作」セクションにある **「機能マネージャー (Feature manager)」** を選択します。  
   * ※「構成エクスプローラー」ではないので注意してください。  
2. **「作成」** をクリックします。  
   * もし作成の種類を聞かれた場合は、**「切り替え (Toggle)」** を選択してください。  
3. 以下の通り設定し、「適用」をクリックします。  
   * **機能フラグ名:** NewFeature  
   * **ラベル:** 空欄のまま  
   * **有効な機能:** **オフ**（チェックを外す）のままにします。

これで、クラウド上に「OFF」状態のスイッチができました。デフォルトでは「従来機能」が動く状態です。

## **6. 実装：スイッチで動くコード**

Python (FastAPI) で、スイッチの状態によって「実行される処理ロジック」が完全に切り替わるAPIを作ります。

### **6.1 環境セットアップ**

新しい作業フォルダを作成し、仮想環境を用意してライブラリをインストールします。
```
# Windows  
python -m venv venv  
venvScriptsactivate

# Mac / Linux  
python3 -m venv venv  
source venv/bin/activate
```
必要なライブラリをインストールします。
```
pip install fastapi uvicorn azure-identity azure-appconfiguration
```
### **6.2 コード作成**

main.py を作成します。

**<YOUR_ENDPOINT>** の部分を、自分のApp Configurationのエンドポイントに書き換えてください。

※エンドポイントは、リソースの「概要」ページに https://... という形式で表示されています。
```python
import json  
from fastapi import FastAPI  
from azure.identity import DefaultAzureCredential  
from azure.appconfiguration import AzureAppConfigurationClient

app = FastAPI()

# 1. App Configurationへの接続設定  
# 概要ページにある「エンドポイント」をコピーして貼り付けます  
ENDPOINT = "<YOUR_ENDPOINT>"

def check_feature_flag(flag_name: str) -> bool:  
    """  
    Azure App Configuration から機能フラグの状態を取得する関数  
    """  
    try:  
        # 第2回で学んだ DefaultAzureCredential (環境自動判別) を使用  
        credential = DefaultAzureCredential()  
          
        # クライアントの作成  
        client = AzureAppConfigurationClient(base_url=ENDPOINT, credential=credential)  
          
        # 機能フラグの値を取得  
        # App Config内では ".appconfig.featureflag/フラグ名" というキーで保存されています  
        fetched_item = client.get_configuration_setting(  
            key=f".appconfig.featureflag/{flag_name}"  
        )  
          
        # JSONをパースして 'enabled' の値 (True/False) を返す  
        data = json.loads(fetched_item.value)  
        return data.get("enabled", False)

    except Exception as e:  
        print(f"Error fetching flag: {e}")  
        # エラー時は安全側に倒す（新機能をOFFにする）のが鉄則  
        return False

@app.get("/")  
def root():  
    return {"message": "Feature Flag System API"}

@app.get("/process")  
def process_data():  
    # 2. リクエストが来るたびに、クラウド上のスイッチを確認しに行く  
    is_new_feature_enabled = check_feature_flag("NewFeature")

    if is_new_feature_enabled:  
        # スイッチが ON の場合：新機能ロジック (v2)  
        return {  
            "status": "success",  
            "version": "v2.0 (Modern Logic)",  
            "method": "New Processing Engine",  
            "description": "新機能で処理されました。"  
        }  
    else:  
        # スイッチが OFF の場合：従来機能ロジック (v1)  
        return {  
            "status": "success",  
            "version": "v1.0 (Legacy Logic)",  
            "method": "Standard Processing Engine",  
            "description": "従来機能で処理されました。"  
        }
```
## **7. 実験：魔法のスイッチ**

準備ができたら、アプリを起動して「システム挙動の遠隔操作」を体験しましょう。

1. **ログイン確認**  
   （まだしていなければ）Azure CLIでログインします。  
   az login

2. **アプリ起動**  
   uvicorn main:app --reload

3. **ブラウザで確認 (OFFの状態)**  
   * http://127.0.0.1:8000/process にアクセスします。  
   * **結果:** version: "v1.0 (Legacy Logic)" が表示されます。従来の安定したロジックが動いています。  
4. **スイッチを入れる (ONにする)**  
   * Azure Portalに戻り、「機能マネージャー」を開きます。  
   * NewFeature の「有効な機能」のチェックボックスを **ON** にします。  
   * **重要:** 画面下や上に出るような保存ボタンはありません。チェックを入れた瞬間に有効化されます（反映に数秒かかる場合があります）。  
5. **ブラウザを更新 (アプリは再起動しない！)**  
   * もう一度ブラウザをリロード（F5）します。  
   * **結果:** version: "v2.0 (Modern Logic)" に変わりましたか？

**★ ここがポイント**  
アプリケーションを停止することなく、処理エンジンを v1 から v2 へ完全に切り替えることができました。  
もし v2 にバグが見つかれば、ポータルでOFFにするだけで、即座に v1 に戻すことができます（切り戻しの高速化）。

## **8. 解説：実務での活用シーン**

今回体験した「機能フラグ」は、プロの現場で以下のように使われています。

1. **カナリアリリース:**  
   * 最初は「全ユーザーの1%」だけONにして様子を見る。エラーが出なければ10%、50%...と広げていく。  
2. **キルスイッチ (Kill Switch):**  
   * 新機能にバグが見つかった時、コードを修正してデプロイし直す（数十分かかる）のではなく、フラグをOFFにする（数秒）だけで障害を回避する。  
3. **トランクベース開発:**  
   * 完成していない機能も含めてコードをメインブランチにマージし、本番環境にデプロイする。ただしフラグで隠しておく（Dark Launch）。これにより、大規模なマージ競合を防ぐ。

「コードを書き換える」ことと「設定を変える」ことを分離するのが、モダンな開発の基本です。

## **9. 発展課題：ターゲット設定**

Azure App Configuration の機能マネージャーで、フラグの右側にある「・・・」メニューから「編集」を選んでみてください。

「機能フィルター」という設定が見つかるはずです。

* **課題:** 「特定のブラウザ（User-Agent）の場合だけONにする」や「50%の確率でONにする（ターゲットロールアウト）」設定を行い、コード側でそれが反映されるか試してみましょう。  
  * ※注: これを正しく動かすには、コード側で client.get_configuration_setting ではなく、より高度な FeatureManager ライブラリを使用する必要がありますが、ドキュメントを読んで挑戦してみてください。

### **【重要】後片付け**

1. **リソースグループの削除:** rg-lesson-flags を削除します。  
2. App Configuration の Freeプランは1サブスクリプションにつき1つまでしか作れません。残しておくと将来の邪魔になるので、必ず削除してください。