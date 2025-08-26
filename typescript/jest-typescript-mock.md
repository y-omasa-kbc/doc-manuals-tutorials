# **JestとTypeScriptによるモックテストガイド**

ユニットテストを作成する際、テスト対象のコードが他のモジュールや外部サービス（API、データベースなど）に依存していることはよくあります。このような依存関係を切り離し、テスト対象のコードだけを独立して検証するために「モック」というテクニックが使われます。

このガイドでは、Jest を使って TypeScript のコードをテストする際のモックの活用方法を学びます。

## **1. モックとは？**

**モック (Mock)** とは、テスト中に本物のオブジェクトの代わりとして振る舞う「偽物のオブジェクト」です。モックは、本物そっくりのインターフェースを持ちながら、我々が指定した通りに動作します。

例えば、外部APIからユーザー情報を取得する関数をテストしたい場合、テストの度に実際のAPIを呼び出すのは非効率で不安定です。そこで、API通信を行う部分をモックに置き換えます。このモックは、「特定のユーザーIDが渡されたら、あらかじめ用意しておいた偽のユーザー情報を返す」といった具体的な振る舞いをします。

## **2. なぜモックが必要か？**

モックを利用する主なメリットは以下の通りです。

* **テストの分離 (Isolation)**  
  * テスト対象のユニットを、その依存関係から完全に切り離せます。これにより、テストの失敗が依存関係の問題なのか、テスト対象自身の問題なのかを明確に切り分けられます。  
* **振る舞いの制御 (Control)**  
  * 依存関係の振る舞いを自由にコントロールできます。例えば、「APIが成功した場合」「APIがエラーを返した場合」「APIがタイムアウトした場合」など、本物では再現が難しい様々なシナリオを簡単に作り出せます。  
* **高速で安定したテスト (Speed & Stability)**  
  * ネットワーク通信やデータベースアクセスといった時間のかかる処理を排除できるため、テストが非常に高速になります。また、外部要因でテストが失敗することがなくなり、安定性が向上します。

## **3. Jestでのモック作成方法**

Jest には、モックを作成するための強力な機能がいくつか用意されています。

### **a. jest.fn(): シンプルなモック関数**

最も基本的なモック機能です。引数なしで呼び出すと、空のモック関数を作成します。

このモック関数は、**「何回呼び出されたか」「どんな引数で呼び出されたか」**などを記録する特殊な能力を持っています。

**例: コールバック関数をテストする**

// a.ts  
export function processCallback(items: number[], callback: (item: number) => void) {  
  items.forEach(item => {  
    callback(item * 2);  
  });  
}  
```typescript  
// a.test.ts  
import { processCallback } from './a';

test('コールバック関数が各要素に対して呼び出されること', () => {  
  const mockCallback = jest.fn(); // モック関数を作成

  processCallback([1, 2, 3], mockCallback);

  // モックが3回呼び出されたことを確認  
  expect(mockCallback.mock.calls.length).toBe(3);

  // 1回目の呼び出しの引数が2であることを確認  
  expect(mockCallback.mock.calls[0][0]).toBe(2);

  // より便利なマッチャー  
  expect(mockCallback).toHaveBeenCalledTimes(3);  
  expect(mockCallback).toHaveBeenCalledWith(2);  
  expect(mockCallback).toHaveBeenCalledWith(4);  
  expect(mockCallback).toHaveBeenCalledWith(6);  
});

test('モックに関数の実装を与える', () => {  
    const mockFn = jest.fn((x: number) => x + 10);

    expect(mockFn(5)).toBe(15);  
    expect(mockFn).toHaveBeenCalledWith(5);  
});
```
### **b. jest.mock(): モジュール全体のモック**

外部ライブラリや自作の別モジュールなど、モジュール全体をまとめてモック化します。これが最も一般的に使われる方法です。

**例: APIクライアントをモック化する**

axios のようなライブラリや、自作のAPIクライアントをモック化して、UserService をテストします。
```typescript  

// apiClient.ts (モック化される対象)  
import axios from 'axios';

export const fetchUser = async (userId: string): Promise<{ name: string }> => {  
  const response = await axios.get(`https://api.example.com/users/${userId}`);  
  return response.data;  
};  
```
```typescript  
// userService.ts (テスト対象)  
import { fetchUser } from './apiClient';

export class UserService {  
  async getUserName(userId: string): Promise<string> {  
    try {  
      const user = await fetchUser(userId);  
      return user.name;  
    } catch (error) {  
      return 'User not found';  
    }  
  }  
}  
```
```typescript  
// userService.test.ts (テストコード)  
import { UserService } from './userService';  
import { fetchUser } from './apiClient';

// 'apiClient'モジュールをモック化する  
jest.mock('./apiClient');

// 型安全のためにモックをキャストする  
const mockedFetchUser = fetchUser as jest.Mock;

describe('UserService', () => {  
  afterEach(() => {  
    // 各テストの後にモックの状態をリセット  
    mockedFetchUser.mockClear();  
  });

  test('ユーザー名が正しく取得できること', async () => {  
    const userService = new UserService();  
    const mockUser = { name: 'Taro Yamada' };

    // fetchUserが解決する値を設定  
    mockedFetchUser.mockResolvedValue(mockUser);

    const userName = await userService.getUserName('123');

    expect(userName).toBe('Taro Yamada');  
    expect(mockedFetchUser).toHaveBeenCalledWith('123');  
    expect(mockedFetchUser).toHaveBeenCalledTimes(1);  
  });

  test('ユーザーが見つからない場合にエラーメッセージを返すこと', async () => {  
    const userService = new UserService();

    // fetchUserが拒否する値を設定  
    mockedFetchUser.mockRejectedValue(new Error('User not found'));

    const userName = await userService.getUserName('999');

    expect(userName).toBe('User not found');  
    expect(mockedFetchUser).toHaveBeenCalledWith('999');  
  });  
});
```
### **c. jest.spyOn(): 既存のメソッドを監視する**

jest.mock() がモジュール全体を偽物に置き換えるのに対し、jest.spyOn() はオブジェクトの**特定のメソッドだけ**を監視・上書きします。元の実装を活かしつつ、呼び出しを追跡したい場合に便利です。

**例: console.log が呼び出されたかを確認する**
```typescript  
// logger.ts  
export class Logger {  
  log(message: string) {  
    console.log(`[LOG] ${message}`);  
  }

  error(message: string) {  
    console.error(`[ERROR] ${message}`);  
  }  
}  
```
```typescript  
// logger.test.ts  
import { Logger } from './logger';

describe('Logger', () => {  
  // テスト後にスパイを元の状態に戻す  
  afterEach(() => {  
    jest.restoreAllMocks();  
  });

  test('logメソッドがconsole.logを呼び出すこと', () => {  
    const logger = new Logger();  
    // consoleオブジェクトのlogメソッドをスパイする  
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    logger.log('Hello');

    expect(consoleLogSpy).toHaveBeenCalledWith('[LOG] Hello');  
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);  
  });

  test('errorメソッドがconsole.errorを呼び出すこと', () => {  
    const logger = new Logger();  
    // consoleオブジェクトのerrorメソッドをスパイする  
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Something went wrong');

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Something went wrong');  
  });  
});
```
**mockImplementation(() => {})** は、スパイ対象のメソッドの元の実装を空の関数で上書きしています。これにより、テスト実行時にコンソールに実際に出力されるのを防いでいます。

## **4. モックのベストプラクティス**

1. **モックは最小限に**  
   * 本当に必要なものだけをモックしましょう。何でもかんでもモックすると、テストが実装の詳細に依存しすぎてしまい、リファクタリングに弱くなります。  
2. **実装の詳細ではなく、振る舞いをテストする**  
   * 「内部でどの関数が呼ばれたか」よりも、「最終的に期待される結果が返ってくるか」をテストの主眼に置きましょう。  
3. **テストごとにモックをクリアする**  
   * あるテストでのモックの設定（mockReturnValueなど）が、他のテストに影響を与えないように、beforeEach や afterEach で jest.clearAllMocks() などを呼び出すのが定石です。  
4. **型を有効活用する**  
   * jest.Mock や jest.SpyInstance などの型を使い、モックされた関数やメソッドに型安全なアクセスを心がけましょう。

## **まとめ**

Jest のモック機能は、TypeScript で堅牢なユニットテストを書くための強力なツールです。jest.fn(), jest.mock(), jest.spyOn() を適切に使い分けることで、どんなに複雑な依存関係を持つコードでも、自信を持ってテストできるようになります。

まずは簡単な関数からモックを試してみて、徐々にクラスやモジュール全体のモックへとステップアップしていくことをお勧めします。