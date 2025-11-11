# **Python並行処理ハンズオン：マルチスレッド、マルチプロセス、キュー**

## **1\. はじめに**

### **なぜ並行処理を学ぶのか？**

現代のアプリケーション、特にWebサーバーやデータ処理システムでは、多くのタスクを「同時に」処理する必要があります。例えば、Webサーバーは複数のユーザーからのリクエストを同時に捌かなければなりません。

Pythonでこれらの処理を実現する主要な方法が「マルチスレッド」と「マルチプロセス」です。

## **2\. 仮想環境の準備 (venv)**

### **なぜ仮想環境が必要か？（理論）**

プロジェクトごとにPythonのバージョンやライブラリ（パッケージ）のバージョンを固定するためです。これにより、「自分のPCでは動いたのに、他のPCやサーバーでは動かない」といった問題を（ある程度）防げます。

### **ハンズオン：venvの構築**
今回の演習については、追加モジュールは不要ですが将来の演習のためここで仮想環境を構築します。

1. プロジェクト用のディレクトリを作成します。  
   ```
   mkdir python_concurrency  
   cd python_concurrency
   ```
2. venv という名前の仮想環境を作成します。（Python 3.11を指定）  
   macOS / Linux
   ```  
   python3 -m venv venv
   ```
   
   Windows  
   ```
   python -m venv venv
   ```

3. 仮想環境を有効化（Activate）します。  
   macOS / Linux (bash/zsh)  
   ```
   source venv/bin/activate  
   ```

   Windows
   ```
   .\venv\Scripts\activate
   ```


4. 無効化（Deactivate）したい場合は、deactivate コマンドを実行します。

## **3\. 並行処理の基礎（理論）**

### **並行 (Concurrency) vs 並列 (Parallelism)**

* **並行 (Concurrency)**: 複数のタスクを切り替えながら実行すること。シングルコアCPUでも可能。「同時に実行しているように見える」。  
* **並列 (Parallelism)**: 複数のタスクを「物理的に」同時に実行すること。マルチコアCPUが必要。

### **プロセス vs スレッド**

* **プロセス (Process)**:  
  * 「実行中のプログラム」の単位。  
  * **独立したメモリ空間** を持ちます。  
  * メリット: 他のプロセスの影響を受けにくく、安定性が高い。  
  * デメリット: メモリ消費が大きい。プロセス間のデータ共有は「プロセス間通信(IPC)」が必要。  
* **スレッド (Thread)**:  
  * プロセス内で実行される「処理」の最小単位。  
  * **親プロセスのメモリ空間を共有** します。  
  * メリット: メモリ消費が小さい。データ共有が容易。  
  * デメリット: 一つのスレッドがクラッシュするとプロセス全体が停止する可能性。データ競合（複数のスレッドが同時に同じデータにアクセスする）に注意が必要。

### **PythonのGIL (Global Interpreter Lock)**

Python（CPython実装）には**GIL (Global Interpreter Lock)** という仕組みがあります。これは、「同時に実行されるPythonバイトコードは、常に1つのスレッドのみ」という制限をかける、Pythonインタープリタ全体にわたる大きなロックです。

* **影響:**  
  * マルチスレッドを使っても、CPUをフルに使う処理（CPUバウンド）は速くなりません。なぜなら、複数のスレッドがあっても、GILのせいで実質的に1つのCPUコアでしか計算が実行されないためです。  
  * I/O待ち（ファイルの読み書き、ネットワーク通信など）が発生する処理（I/Oバウンド）では、そのスレッドは待機状態に入り、GILを **解放** します。その間に他のスレッドがGILを取得して実行できるため、I/Oバウンドな処理はマルチスレッドで高速化できます。

## **4\. マルチスレッド (threading)**

### **ハンズオン：I/Oバウンド処理（スレッドなし）**

time.sleep() を使って、I/O待ち（例：APIからの応答待ち）をシミュレートします。

まずは、マルチスレッドを使わずにI/Oバウンド処理を逐次実行した場合のコードです。

io_bound_sync.py
```python
import time

def simulate_io_task(task_name):  
    print(f"Task {task_name} started...")  
    time.sleep(2) # 2秒間のI/O待ちをシミュレート  
    print(f"Task {task_name} finished.")

start_time = time.time()

simulate_io_task("A")  
simulate_io_task("B")  
simulate_io_task("C")

end_time = time.time()  
print(f"Total time (Sync): {end_time - start_time:.2f} seconds") # 約6秒かかる
```
実行結果の解釈:  
出力された合計時間（Total time）が約6秒になります。これは、2秒かかるタスクが3回、**順番に（逐次的に）** 実行されたこと（2秒 \+ 2秒 \+ 2秒 \= 6秒）を意味します。タスクAが完全に終わるまで、タスクBは開始されません。

### **ハンズオン：I/Oバウンド処理（スレッドあり）**

threading モジュールを使います。

次に、threading モジュールを使い、複数のスレッドでI/Oバウンド処理を並行実行するコードです。

io_bound_threading.py
```python
import time  
import threading

def simulate_io_task(task_name):  
    print(f"Task {task_name} started...")  
    time.sleep(2) # I/O待ちの間、GILは解放される  
    print(f"Task {task_name} finished.")

start_time = time.time()

# スレッドを作成  
threads = [  
    threading.Thread(target=simulate_io_task, args=("A",)),  
    threading.Thread(target=simulate_io_task, args=("B",)),  
    threading.Thread(target=simulate_io_task, args=("C",)),  
]

# スレッドを開始  
for t in threads:  
    t.start()

# 全てのスレッドが終了するのを待つ  
for t in threads:  
    t.join()

end_time = time.time()  
print(f"Total time (Threading): {end_time - start_time:.2f} seconds") # 約2秒で終わる！
```
実行結果の解釈:  
出力された合計時間が約2秒になります。これは、3つのタスクが3つのスレッドでほぼ同時に開始されたことを示します。  
time.sleep(2)（I/O待ち）の間、PythonのGILは解放されるため、CPUは他のスレッド（タスクBやC）の実行に切り替わることができます。  
結果として、3つのタスクが「並行」して実行され、全体の実行時間は最も時間のかかる1タスク分（2秒）とほぼ同じになります。

### **ハンズオン：データ競合とロック**

スレッド間でデータを共有すると問題が起きる例（カウンター）。

スレッド間でデータを共有した際に「データ競合」が発生し、期待通りの結果にならないコード例です。

data_race.py (問題が起きる例)
```python
import threading  
import time # timeモジュールをインポート

counter = 0

def increment():  
    global counter  
    for _ in range(1_000_000):  
        # counter += 1 を意図的に分離して競合を発生しやすくする  
        current_value = counter  
        # time.sleep(0) を挟むと、他のスレッドに実行が切り替わりやすくなる  
        time.sleep(0)   
        counter = current_value + 1

threads = [threading.Thread(target=increment) for _ in range(3)]  
for t in threads: t.start()  
for t in threads: t.join()

print(f"Counter: {counter}") # 3,000,000 にならないことが多い
```
実行結果の解釈:  
期待する結果（300万）と異なり、それよりも小さい数値（例: 1,834,567）が表示されます。  
これはデータ競合 (Data Race) が発生しているためです。counter \+= 1 は、実際には  
「1. counter の値を読み込む」  
「2. 値に1を加える」  
「3. counter に書き戻す」  
という複数のステップに分かれています。  
この例では time.sleep(0) によって、ステップ1（読み込み）とステップ3（書き込み）の間で他のスレッドに処理が切り替わる可能性を意図的に高めています。  
複数のスレッドがこの操作を同時に行うと、あるスレッドが古い値を読み込み、他のスレッドによる更新を上書きしてしまう現象が発生し、カウントが失われます。  

threading.Lock を使って排他制御を行い、データ競合を解決するコードです。

thread_lock.py (ロックで解決)
```python
import threading  
import time # timeモジュールをインポート

counter = 0  
lock = threading.Lock() # ロックを作成

def increment():  
    global counter  
    for _ in range(1_000_000):  
        with lock: # ロックを取得 (with文を抜けると自動で解放)  
            # data_race.py と同じ、競合が発生しうるロジック  
            current_value = counter  
            time.sleep(0) # ロックブロック内なので、ここでスレッドが切り替わっても安全  
            counter = current_value + 1

threads = [threading.Thread(target=increment) for _ in range(3)]  
for t in threads: t.start()  
for t in threads: t.join()

print(f"Counter: {counter}") # 3,000,000 になる
```
実行結果の解釈:  
期待通り 3000000 が表示されます。  
with lock: ブロック（排他制御）により、data\_race.py では問題を引き起こした「読み込み・スリープ・書き込み」の一連の操作全体が、一度に1つのスレッドしか実行できなくなりました。他のスレッドは、ロックが解放されるまで待機します。  
これによりデータ競合が防止され、すべての加算が正しく反映されます。ただし、ロックによる待機が発生するため、処理速度は（この例では）逐次実行とあまり変わらなくなります。

## **5. マルチプロセス (multiprocessing) と CPUバウンド処理**

マルチスレッドはI/Oバウンド処理に適していましたが、GILの影響でCPUバウンド処理は高速化できませんでした。  
CPUバウンドなタスク（例：重い計算、画像処理）の高速化には マルチプロセス が適しています。  
マルチプロセスは、プロセスごとに独立したPythonインタープリタとメモリ空間を持つため、**GILの影響を受けません**。これにより、複数のCPUコアを物理的に並列利用することが可能になります。

ここでは、重い計算処理（CPUバウンド）を「1. 逐次実行」「2. マルチスレッド実行（GILの影響）」「3. マルチプロセス実行」の順で比較してみましょう。

### **5.1 ハンズオン：CPUバウンド処理（逐次実行）**

まず、マルチスレッドやマルチプロセスを使わずにCPUバウンド処理を逐次実行した場合のコードです。これが比較の基準となります。

cpu_bound_sync.py
```python
import time

# 非常に単純だが重い計算（シミュレート）  
def heavy_computation(n):  
    sum_val = 0  
    for i in range(n):  
        sum_val += i  
    print(f"Finished computation for {n}")  
    return sum_val

start_time = time.time()

heavy_computation(50_000_000)  
heavy_computation(50_000_000)

end_time = time.time()  
print(f"Total time (Sync): {end_time - start_time:.2f} seconds")
```
実行結果の解釈:  
2回の重い計算が順番に（逐次的に）実行されます。1回の計算にかかる時間をT秒とすると、合計時間は約2T秒となります。

### **5.2 ハンズオン：GILの影響（スレッド実行）**

CPUバウンドな処理をマルチスレッドで実行しても、GILの影響により高速化されない（むしろ逐次実行と変わらない）ことを確認するコードです。

cpu_bound_threading.py
```python
import time  
import threading

# 非常に単純だが重い計算（シミュレート）  
def heavy_computation(n):  
    sum_val = 0  
    for i in range(n):  
        sum_val += i  
    print(f"Finished computation for {n}")  
    return sum_val

start_time = time.time()

tasks = [50_000_000, 50_000_000] # 2つの重いタスク

threads = [  
    threading.Thread(target=heavy_computation, args=(tasks[0],)),  
    threading.Thread(target=heavy_computation, args=(tasks[1],)),  
]

for t in threads:  
    t.start()

for t in threads:  
    t.join()

end_time = time.time()  
print(f"Total time (Threading for CPU Bound): {end_time - start_time:.2f} seconds") 
```
実行結果の解釈:  
逐次実行の cpu_bound_sync.py とほぼ同じ合計時間（あるいは少し遅い時間）が表示されます。I/Oバウンド処理の時のように実行時間は半分にはなりません。  
これが GIL の影響 です。  
2つのスレッドが作成されても、GILの制約により、一度に1つのスレッドしかPythonの計算処理を実行できません。  
CPUがマルチコアであっても、1つのコアしか効率的に使われないため、並列処理にならず、実質的に逐次実行と同じになってしまいます。スレッドの切り替え（コンテキストスイッチ）のオーバーヘッドがある分、逐次実行よりわずかに遅くなることさえあります。

### **5.3 ハンズオン：CPUバウンド処理（プロセス実行）**

multiprocessing.Process を使います。

multiprocessing.Process を使い、複数のプロセスでCPUバウンド処理を並列実行するコードです。

cpu_bound_multiprocess.py
```python
import time  
import multiprocessing

def heavy_computation(n):  
    sum_val = 0  
    for i in range(n):  
        sum_val += i  
    print(f"Finished computation for {n}")  
    return sum_val

# Windows/macOSでmultiprocessingを使う場合のおまじない  
if __name__ == "__main__":  
    start_time = time.time()

    processes = [  
        multiprocessing.Process(target=heavy_computation, args=(50_000_000,)),  
        multiprocessing.Process(target=heavy_computation, args=(50_000_000,)),  
    ]

    for p in processes:  
        p.start()

    for p in processes:  
        p.join()

    end_time = time.time()  
    print(f"Total time (Multiprocess): {end_time - start_time:.2f} seconds") # Syncより速くなる（CPUコア数による）
```
実行結果の解釈:  
（CPUがマルチコアの場合）逐次実行（Sync）やスレッド実行（Threading for CPU Bound）のコードよりも合計時間が短縮されます（理想的には約半分の時間）。  
これは、2つのプロセスがOSによって異なるCPUコアに割り当てられ、物理的に並列実行されたためです。マルチプロセスはGILの影響を受けないため、CPUバウンドな処理が効果的に高速化されます。

### **5.4 ハンズオン：プロセスプール (Pool)**

CPUコア数に応じて、タスクを効率よく割り当てる Pool が便利です。

multiprocessing.Pool を使い、タスクを効率的にCPUコアに割り当てて並列実行するコードです。

cpu_bound_pool.py
```python
import time  
import multiprocessing

def heavy_computation(n):  
    sum_val = 0  
    for i in range(n):  
        sum_val += i  
    # print(f"Finished computation for {n}") # (出力が混ざるのでコメントアウト)  
    return sum_val

if __name__ == "__main__":  
    start_time = time.time()

    tasks = [50_000_000, 50_000_000, 50_000_000, 50_000_000] # 4つのタスク

    # CPUコア数分のプロセスプールを作成 (Noneなら自動でCPUコア数)  
    with multiprocessing.Pool(processes=None) as pool:  
        # tasksリストの各要素を heavy_computation 関数に渡して実行  
        results = pool.map(heavy_computation, tasks)

    end_time = time.time()  
    print(f"Results: {results}")  
    print(f"Total time (Pool): {end_time - start_time:.2f} seconds")
```
実行結果の解釈:  
4つのタスクがありますが、合計時間は（例えば4コアCPUの場合）タスク1回分の実行時間とほぼ同じになります。  
multiprocessing.Pool が、利用可能なCPUコア数（通常は自動で検出）に基づいてワーカープロセスを作成し、4つのタスクを効率的に割り当てて並列処理したことを示します。手動で Process を管理するよりも効率的です。

## **6\. プロセス間通信 (Queue)**

マルチプロセスではメモリ空間が独立しているため、データの受け渡しには multiprocessing.Queue などのIPC（プロセス間通信）メカニズムが必要です。

### **ハンズオン：multiprocessing.Queue**

プロデューサー（データを生成するプロセス）とコンシューマー（データを消費するプロセス）のモデルを作成します。

multiprocessing.Queue を使い、プロセス間で安全にデータを送受信する（プロデューサー・コンシューマーモデル）コードです。

ipc_queue.py
```python
import time  
import multiprocessing  
import random

# プロデューサー（タスク生成）  
def producer(queue, task_count):  
    for i in range(task_count):  
        task = f"Task-{i}"  
        print(f"Producer: Generating {task}")  
        queue.put(task) # キューにタスクを入れる  
        time.sleep(random.uniform(0.1, 0.5))  
      
    # 終了シグナル (None) をコンシューマーの数だけ入れる  
    queue.put(None)   
    queue.put(None)  
    print("Producer: Finished.")

# コンシューマー（タスク処理）  
def consumer(queue, worker_id):  
    while True:  
        task = queue.get() # キューからタスクを取り出す (空なら待機)  
          
        if task is None: # 終了シグナルを受け取ったらループを抜ける  
            print(f"Consumer {worker_id}: Received exit signal.")  
            break  
              
        print(f"Consumer {worker_id}: Processing {task}")  
        time.sleep(random.uniform(0.5, 1.0)) # タスク処理をシミュレート

if __name__ == "__main__":  
    # プロセス間で共有するキューを作成  
    m = multiprocessing.Manager()  
    queue = m.Queue()

    # プロデューサープロセス (1つ)  
    producer_process = multiprocessing.Process(target=producer, args=(queue, 10))

    # コンシューマープロセス (2つ)  
    consumer_processes = [  
        multiprocessing.Process(target=consumer, args=(queue, 1)),  
        multiprocessing.Process(target=consumer, args=(queue, 2)),  
    ]

    producer_process.start()  
    for p in consumer_processes:  
        p.start()

    producer_process.join()  
    for p in consumer_processes:  
        p.join()

    print("All processes finished.")
```
実行結果の解釈:  
実行すると、プロデューサーによるタスク生成のログと、2つのコンシューマー（worker_id 1と2）によるタスク処理のログが **順不同（インターリーブ）** で表示されます。

* これは、プロデューサープロセスが queue.put(task) でキューにタスクを追加し、2つのコンシューマープロセスが queue.get() でキューからタスクを（早い者勝ちで）取り出していることを示します。  
* multiprocessing.Queue を介して、メモリ空間が異なるプロセス間で安全にデータ（タスク文字列）が受け渡されていることがわかります。  
* 最後にプロデューサーが None を送信し、それを受け取った両方のコンシューマーが終了し、プログラム全体が停止します。

## **7. まとめ**

* **I/Oバウンド** (ネットワーク待ち、ファイル待ち): **マルチスレッド (threading)** が有効。GILは解放される。  
* **CPUバウンド** (重い計算): **マルチプロセス (multiprocessing)** が有効。GILを回避できる。  
* データ共有:  
  * スレッド: メモリ共有。**Lock** を使った排他制御が必要。  
  * プロセス: メモリ独立。**Queue** などのIPCが必要。

## **8. 演習課題**

### **課題1 (マルチスレッド)**

urls.txt ファイルに書かれたWebサイトのURLリスト（1行1URL）を読み込み、それぞれのURLに requests ライブラリ（pip install requests が必要）を使ってGETリクエストを送信し、ステータスコードを並行して取得するスクリプト check\_urls.py を作成してください。

* ヒント: Webサイトへのリクエストは典型　的なI/Oバウンド処理です。

### **課題2 (マルチプロセス)**

1から100,000までの数値のうち、特定の条件（例：素数判定、または時間がかかるダミー計算）を満たすものを探す処理を考えます。multiprocessing.Pool を使い、この範囲の数値を複数のプロセスに分割して割り当て、条件を満たす数値のリスト（または個数）を効率的に計算するスクリプト find_primes_parallel.py を作成してください。

* ヒント: 重い計算はCPUバウンド処理です。pool.map や pool.starmap が使えます。

### **課題3 (プロセス間通信)**

課題2を改良します。計算結果（見つかった素数など）を multiprocessing.Queue を使ってワーカープロセスからメインプロセスに随時送信してください。メインプロセスは、キューから結果を受け取り次第、リアルタイムでコンソールに出力し続けるようにします。