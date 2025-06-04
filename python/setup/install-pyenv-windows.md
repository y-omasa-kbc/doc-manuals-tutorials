# Windows 11でコマンドプロンプトを使ってpyenvをインストールし、Python 3.12を導入・デフォルト設定する手順

注意: Windows Store からPythonをインストールした場合、この手順ではバージョンが切り替わらない可能性があります。その場合は[こちらの手順(./install-python-windows-store.md)](./install-python-windows-store.md)を参照してください。


## 1. pyenvのインストール

1. PowerShellを開き、以下のコマンドで`pyenv-win`をインストールします。

    ```powershell
    pip install pyenv-win --target $env:USERPROFILE\.pyenv
    ```

2. 環境変数の設定  
   以下のコマンドをPowerShellで実行し、ユーザー環境変数`PATH`に必要なパスを追加します。

    ```powershell
    $pyenvBin = "$env:USERPROFILE\.pyenv\pyenv-win\bin"
    $pyenvShims = "$env:USERPROFILE\.pyenv\pyenv-win\shims"
    [Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$pyenvBin;$pyenvShims", "User")
    ```

   ※ 反映のためPowerShellやコマンドプロンプトを再起動してください。

## 2. pyenvでPython 3.12をインストール

1. PowerShellで以下を実行し、インストール可能なバージョンの一覧を更新します。
   ```
   pyenv update
   ```
    コマンド実行時に以下のエラーが発生する場合があります。
    **pyenv : このシステムではスクリプトの実行が無効になっているため、.....**
    その場合、PowerShellで以下のコマンドを実行してください。
    ```
    Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser
    ```

2. PowerShellで以下を実行し、インストール可能なバージョンを確認します。

    ```powershell
    pyenv install --list
    ```


3. Python 3.12.x（例: 3.12.10）をインストールします。

    ```powershell
    pyenv install 3.12.10
    ```
    先ほど確認したバージョンの一覧にあるバージョンを指定してください。

## 3. Python 3.12をシステムのデフォルトに設定

1. 以下のコマンドでグローバル（全体）デフォルトを設定します。

    ```powershell
    pyenv global 3.12.10
    ```

2. 設定を確認します。

    ```powershell
    python --version
    ```

    `Python 3.12.10` などと表示されれば成功です。

---

**参考:**  
- [pyenv-win公式ドキュメント](https://github.com/pyenv-win/pyenv-win)
- [Git公式サイト](https://git-scm.com/)

