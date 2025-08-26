# **Jestによるユニットテスト入門ハンズオン (後半)**

## **1. はじめに**

### **本日のゴール**

授業の後半では、Jestのより応用的な機能について学びます。**モック関数**を使った依存関係の分離や、**非同期処理**のテストなど、実際の開発現場で必要となるテクニックを習得することを目指します。

### **アジェンダ**

1. **セットアップと後処理 (beforeEach, afterEach など)**  
2. **モック関数 (jest.fn)**  
3. **非同期処理のテスト (async/await)**  
4. **演習** - 応用編

## **2. セットアップと後処理**

複数のテストケースで共通の事前準備や後片付けが必要になることがあります。例えば、テスト用のデータベースを初期化したり、テスト後に生成されたファイルを削除したりする場合です。Jestには、そのためのヘルパー関数が用意されています。

* beforeEach(fn): **各テストケースが実行される前**に毎回実行されます。  
* afterEach(fn): **各テストケースが実行された後**に毎回実行されます。  
* beforeAll(fn): **テストファイル内の全テストが実行される前**に一度だけ実行されます。  
* afterAll(fn): **テストファイル内の全テストが実行された後**に一度だけ実行されます。

#### **なぜセットアップと後処理が必要？**

**一言で言うと、「テストの独立性」を保つためです。** 良いユニットテストは、他のテストから一切影響を受けず、実行する順番を変えても必ず同じ結果にならなければなりません。

もし、この仕組みがないと…  
あるテストが、テスト用のデータベースにユーザー A を追加したとします。次のテストは、ユーザー数を数えるテストだった場合、ユーザー A が残っているせいで期待する数と合わずに失敗してしまうかもしれません。このように、テストが互いに影響を及ぼし合うと（これを副作用と呼びます）、テスト結果が不安定になり、失敗の原因を特定するのが非常に困難になります。  
解決策  
beforeEach を使えば、各テストの実行前に必ず決まった状態にリセットできます。「テスト前に必ずデータベースを空にする」といった処理を書いておけば、全てのテストは常にクリーンな状態で開始され、他のテストの影響を心配する必要がなくなります。

#### **使ってみよう**

ショッピングカートのクラスを例に、より実践的な使い方を見てみましょう。

**src/ShoppingCart.ts**
```TypeScript
interface Item {  
  name: string;  
  price: number;  
}

class ShoppingCart {  
  private items: Item[] = [];

  addItem(item: Item) {  
    this.items.push(item);  
  }

  getTotal() {  
    return this.items.reduce((total, item) => total + item.price, 0);  
  }

  clear() {  
    this.items = [];  
  }  
}

module.exports = { ShoppingCart };

**tests/ShoppingCart.test.ts**

const { ShoppingCart } = require('../src/ShoppingCart');

describe('ShoppingCart', () => {  
  let cart: InstanceType<typeof ShoppingCart>;

  // 各テストの実行前に、新しい空のカートインスタンスを作成する  
  beforeEach(() => {  
    cart = new ShoppingCart();  
  });

  it('初期状態では合計金額が0であること', () => {  
    expect(cart.getTotal()).toBe(0);  
  });

  it('商品を1つ追加すると、合計金額がその商品の価格になること', () => {  
    cart.addItem({ name: 'Apple', price: 150 });  
    expect(cart.getTotal()).toBe(150);  
  });

  it('複数の商品を追加すると、合計金額が正しく計算されること', () => {  
    cart.addItem({ name: 'Apple', price: 150 });  
    cart.addItem({ name: 'Orange', price: 120 });  
    expect(cart.getTotal()).toBe(270);  
  });  
});
```
このテストファイルだけを実行するには、ターミナルで以下のコマンドを入力します。

npm test tests/ShoppingCart.test.ts

この例では、beforeEach のおかげで、3つのテストケースはそれぞれ完全に独立しています。2つ目のテストで Apple を追加しても、3つ目のテストが始まる前には新しい空のカートが用意されるため、テストが互いに影響を及ぼすことはありません。これにより、信頼性の高いテストを書くことができます。

## **3. モック関数 (Mock Functions)**

ユニットテストの重要な原則は、**テスト対象を隔離する**ことです。しかし、テストしたい関数が他の関数や外部API、データベースなどに依存している場合、その依存先がテスト結果に影響を与えてしまいます。

そこで使われるのが **モック (Mock)** です。モックとは「偽物」や「模擬品」のことで、依存する対象の代わりに、テスト用に都合よく振る舞ってくれる偽物を用意する技術です。

#### **なぜモックが必要？**

**一言で言うと、「ユニットテスト」の"ユニット"（単体）に集中するためです。**

テストしたい A という関数が、外部の B（APIサーバーなど）に依存している状況を考えてみましょう。A のテストを実行したとき、もしネットワークの調子が悪かったり、B のサーバーが停止していたりしたら、テストは失敗します。しかし、この失敗は A のロジックが悪いせいでしょうか？それとも単に外部要因のせいでしょうか？これでは切り分けができません。これでは A の**単体**テストとは言えません。

モックは、この外部依存 B を、私たちがコントロールできる「偽物」に置き換える技術です。

* ✅ **テストの安定性**: 外部APIのサーバーダウンといった外部要因でテストが失敗するのを防ぎます。  
* ✅ **テストの高速化**: 時間のかかるDBアクセスなどをシミュレートし、テストを高速化します。  
* ✅ **振る舞いの検証**: 「ある関数が特定の引数で呼び出されたか？」といった、関数の副作用をテストできます。

#### **使ってみよう**

コールバック関数を引数に取る関数をテストする例を見てみましょう。

**src/callback.ts**
```TypeScript
function processData(data: string[], callback: (item: string) => void) {  
  data.forEach(item => {  
    callback(item.toUpperCase());  
  });  
}

module.exports = { processData };

**tests/callback.test.ts**

const { processData } = require('../src/callback');

describe('processData function', () => {  
  it('コールバック関数が正しい引数で、正しい回数だけ呼び出されること', () => {  
    // jest.fn() で空のモック関数を作成  
    const mockCallback = jest.fn();

    const data = ['a', 'b', 'c'];  
    processData(data, mockCallback);

    // モック関数が3回呼び出されたか検証  
    expect(mockCallback.mock.calls.length).toBe(3);  
    // expect(mockCallback).toHaveBeenCalledTimes(3); // こちらの書き方でもOK

    // 1回目の呼び出しの第一引数が 'A' であったか検証  
    expect(mockCallback.mock.calls[0][0]).toBe('A');

    // 2回目の呼び出しの第一引数が 'B' であったか検証  
    expect(mockCallback.mock.calls[1][0]).toBe('B');  
  });  
});
```
このテストファイルだけを実行するには、ターミナルで以下のコマンドを入力します。

npm test tests/callback.test.ts

このように、モック関数を使うことで、コールバックが「どのように使われたか」を正確にテストできます。

## **4. 非同期処理のテスト**

現代のアプリケーションでは、APIからデータを取得するなど、非同期処理が頻繁に使われます。Jestでは async/await を使うことで、Promiseを返す非同期関数を簡単にテストできます。

#### **なぜ非同期処理のテストに特別な書き方が必要？**

**一言で言うと、テストの実行が非同期処理の完了を待ってくれないからです。**

JavaScriptは非同期処理を見つけると、その処理の完了を待たずに次のコードへ進んでしまいます。テスト関数も例外ではありません。async/await を使うことで、Jestに対して「この処理が終わるまで、テストの完了を待ってください」と伝えることができます。

#### **テスト対象コード**

ユーザー情報を取得する非同期関数を考えます。

**src/userAPI.ts**

interface User {  
  id: number;  
  name: string;  
}

const fetchUser = (userId: number): Promise<User> => {  
  return new Promise((resolve, reject) => {  
    setTimeout(() => {  
      if (userId === 1) {  
        resolve({ id: 1, name: 'Taro Yamada' });  
      } else {  
        reject(new Error('User not found'));  
      }  
    }, 500); // 0.5秒後に結果を返す  
  });  
};

module.exports = { fetchUser };

#### **テストコード**

テストコード側で async/await を使って、非同期処理が終わるのを待ってから結果を検証します。

**tests/userAPI.test.ts**

const { fetchUser } = require('../src/userAPI');

describe('fetchUser function', () => {  
  // `async` を付けて非同期テストであることを示す  
  it('userId: 1 でユーザー情報が正しく取得できること', async () => {  
    // `await` で Promise が解決されるのを待つ  
    const user = await fetchUser(1);  
    expect(user).toEqual({ id: 1, name: 'Taro Yamada' });  
  });

  it('存在しないuserIdの場合、エラーがスローされること', async () => {  
    // Promiseがrejectされることを検証する .rejects マッチャーが便利  
    await expect(fetchUser(999)).rejects.toThrow('User not found');  
  });  
});

このテストファイルだけを実行するには、ターミナルで以下のコマンドを入力します。

npm test tests/userAPI.test.ts

#### **.rejectsマッチャーの詳細**

await expect(fetchUser(999)).rejects.toThrow('User not found'); の行は、非同期処理のエラーケースをテストするための重要な構文です。

1. **expect(fetchUser(999))**: fetchUser(999)を呼び出し、その返り値であるPromiseオブジェクトをexpectに渡します。この時点では、まだ処理は完了していません。  
2. **.rejects**: このマッチャーがJestに対して「このPromiseが**失敗（reject）**するまで待機せよ」と指示します。もしPromiseが成功（resolve）してしまった場合、テストはこの時点で失敗となります。  
3. **.toThrow('User not found')**: Promiseが無事にrejectされた後、その**失敗した理由（エラーオブジェクト）**を検証します。この例では、エラーメッセージが'User not found'であることを確認しています。  
4. **await**: expectから.toThrowまでの一連の検証処理も非同期的に行われるため、awaitを付けて全体の完了を待つ必要があります。

.rejectsを使わないと、Promiseがrejectされた時点でテストが単にクラッシュしてしまい、Jestのきれいな失敗レポートが得られません。.rejectsは、「この非同期処理は、こういう理由で失敗するはずだ」という意図を明確に表現するための、安全で読みやすい方法です。

**ポイント:**

* テスト関数の前に async を付ける。  
* 非同期関数の呼び出しの前に await を付ける。  
* Promiseが reject されることをテストするには、expect(非同期関数).rejects を使うと簡潔に書けます。

## **5. 演習（応用編）**

それでは、応用編の演習です。ここまでに学んだ**モック**と**非同期処理のテスト**を組み合わせて、外部APIに依存するクラスのテストを書いてみましょう。

### **課題**

天気情報を取得する WeatherService クラスの getWeatherComment メソッドをテストしてください。  
このサービスは、外部の天気を取得する ApiClient に依存しています。テストでは ApiClient をモック化し、WeatherService のロジックだけをテスト対象とします。

### **手順**

1. src ディレクトリに apiClient.ts と weatherService.ts を作成し、以下のコードを貼り付けます。  
2. tests ディレクトリに weatherService.test.ts を新規作成します。  
3. weatherService.test.ts の中に、getWeatherComment メソッドのテストを記述します。

#### **テスト対象コード**

**src/apiClient.ts**

// 本来は外部APIと通信するクライアントだが、今回はダミー  
class ApiClient {  
  async fetchWeather(city: string): Promise<{ weather: string; temp: number }> {  
    // この実装は実際には使われない（モックされるため）  
    console.log(`Fetching weather for ${city}...`);  
    // ダミーのレスポンス  
    return { weather: 'Sunny', temp: 25 };  
  }  
}

module.exports = { ApiClient };

**src/weatherService.ts**

const { ApiClient } = require('./apiClient');

class WeatherService {  
  private apiClient: InstanceType<typeof ApiClient>;

  constructor() {  
    this.apiClient = new ApiClient();  
  }

  async getWeatherComment(city: string): Promise<string> {  
    try {  
      const data = await this.apiClient.fetchWeather(city);  
      if (data.weather === 'Sunny' && data.temp >= 20) {  
        return `今日の${city}は晴れで、気温は${data.temp}度です。絶好のお出かけ日和です！`;  
      }  
      if (data.weather === 'Rainy') {  
        return `今日の${city}は雨です。傘を忘れずに。`;  
      }  
      return `今日の${city}の天気は${data.weather}、気温は${data.temp}度です。`;  
    } catch (error) {  
      return '天気情報の取得に失敗しました。';  
    }  
  }  
}

module.exports = { WeatherService };

### **テスト要件**

* **ApiClient を jest.mock() を使ってモック化してください。**  
* 以下の3つのシナリオについてテストケースを作成してください。  
  1. fetchWeather が { weather: 'Sunny', temp: 25 } を返した場合、「絶好のお出かけ日和です！」というコメントが生成されること。  
  2. fetchWeather が { weather: 'Rainy', temp: 15 } を返した場合、「傘を忘れずに。」というコメントが生成されること。  
  3. fetchWeather が例外をスローした場合、「天気情報の取得に失敗しました。」というコメントが返されること。

**ヒント:**

* jest.mock('../src/apiClient'); をテストファイルの先頭に記述します。  
* モック化した ApiClient の fetchWeather メソッドが特定の値を返すように設定するには、mockResolvedValue(value) や mockRejectedValue(error) を使います。