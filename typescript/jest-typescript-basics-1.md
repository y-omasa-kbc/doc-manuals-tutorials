# **Jestによるユニットテスト入門 Part 1**

## **1\. はじめに**

### **本日のゴール**

この授業では、JavaScript/TypeScriptのテストフレームワークである **Jest** を使って、 **ユニットテスト（単体テスト）** の基本的な考え方と書き方を学びます。最終的には、簡単な関数のテストを自分自身で書けるようになることを目指します。

### **アジェンダ**

1. **ユニットテストとは？** - なぜテストを書く必要があるのか  
2. **Jest入門** - 環境構築と最初のテスト実行  
3. **テストの基本構造と様々なマッチャー** - テストコードの書き方  
4. **演習** - 実際にテストを書いてみよう

## **2\. ユニットテスト（単体テスト）とは？**

ソフトウェアの品質を保証するために、開発プロセスには様々なテストが存在します。**ユニットテスト** は、その中でも最も基本的なテストの一つです。

* **何をテストする？**  
  * 関数、メソッド、コンポーネントなど、プログラムを構成する **最小単位（ユニット）** が対象です。  
* **目的は？**  
  * 各ユニットが **個別に** 期待通りに動作することを保証します。

### **なぜユニットテストが必要なのか？**

テストコードを書くことは、一見すると開発の手間を増やすように感じるかもしれません。しかし、長期的には多くのメリットがあります。

* ✅ **品質の向上とバグの早期発見**  
  * 開発の早い段階でバグを発見し、修正コストを低く抑えることができます。機能が複雑に絡み合う前の、単純な段階で問題を解決できます。  
* ✅ **安心してリファクタリングできる**  
  * コードの内部構造を改善（リファクタリング）した際に、既存の機能が壊れていないか（デグレードしていないか）を即座に確認できます。テストが「安全網」の役割を果たします。  
  * 例えば、パフォーマンス改善のためにソート処理のアルゴリズムを変更したとします。テストがあれば、変更後もソート結果が正しく保たれていることを一瞬で検証でき、自信を持ってコードを改善できます。  
* ✅ **仕様が明確になる**  
  * テストコードは、そのユニットが「どのように振るべきか」を示す**生きたドキュメント**になります。  
  * 新しくプロジェクトに参加した開発者が、ある関数の使い方を知りたいとき、その関数のテストコードを読めば、どのような引数を渡せばどのような結果が返ってくるのか、エラーになるのはどのような場合か、といった具体的な仕様を正確に理解できます。

## **3\. Jest入門（ハンズオン）**

**Jest**は、Meta社（旧Facebook）によって開発された、JavaScript/TypeScript向けのテストフレームワークです。難しい設定なしで始められ、テストに必要な機能がオールインワンで揃っているのが特徴です。

### **Step 1: 環境構築**

まずは、Jestを動かすためのプロジェクトを準備しましょう。

1. **プロジェクト用ディレクトリを作成し、初期化します。**  
```
   mkdir jest-handson  
   cd jest-handson  
   npm init -y  
   mkdir src tests  
```
   npm init -y は、プロジェクト管理ファイル package.json をすべてデフォルト設定で自動生成するコマンドです。  
   mkdir src tests で、ソースコード用の src ディレクトリと、テストコード用の tests ディレクトリをあらかじめ作成しておきます。  
2. **TypeScriptとJest関連のパッケージをインストールします。**  
```
   # TypeScriptをインストール  
   npm install --save-dev typescript

   # Jest関連のパッケージをインストール  
   npm install --save-dev jest ts-jest @types/jest
```
   * jest: Jestフレームワーク本体  
   * ts-jest: JestがTypeScriptのコードを解釈できるようにするためのツール  
   * @types/jest: Jestの関数やオブジェクトに対するTypeScriptの型定義  
3. Node.jsの型定義をインストールします。（エラー対応）  
   JestはNode.js環境で動作します。module や require といったNode.js特有の記述をTypeScriptが正しく解釈できるように、型定義ファイルをインストールします。 
```
   npm i --save-dev @types/node
```
4. TypeScriptの設定ファイル (tsconfig.json) を作成し、編集します。  
   まず、以下のコマンドで設定ファイルを作成します。 
```
   npx tsc --init
```
   次に、作成された tsconfig.json を開き、compilerOptions の中に "types": ["node", "jest"] を追加します。これにより、TypeScriptコンパイラがNode.jsとJestの型を認識するようになります。 
```
   {  
     "compilerOptions": {  
       // ... 他の設定 ...  
       "types": ["node", "jest"],  
       // ... 他の設定 ...  
     }  
   }
```
5. **Jestの設定ファイル (jest.config.js) を作成します。**  
```
   npx ts-jest config:init
```
   これにより、TypeScriptでテストを書くための基本的な設定が自動的に行われます。  
6. package.jsonにテスト実行コマンドを追加します。  
   package.jsonファイルを開き、"scripts" の部分を以下のように編集してください。
```
   "scripts": {  
     "test": "jest"  
   },
```
   これで npm test というコマンドでJestを実行できるようになりました。

### **Step 2: はじめてのテスト**

環境が整ったので、実際にテストを書いて実行してみましょう。

1. テスト対象のコードを作成します。  
   プロジェクトの src ディレクトリの中に sum.ts というファイルを作成して、以下のコードを記述します。  
   **src/sum.ts** 
```
   function sum(a: number, b: number): number {  
     return a + b;  
   }

   // CommonJS形式で関数をエクスポートします  
   module.exports = { sum };
```
2. テストコードを作成します。  
   次に、tests ディレクトリの中に sum.test.ts というファイル名でテストファイルを作成します。  
   テストコードは、主に3つの要素で構成されます。  
   * describe(name, fn): 関連するテストをグループ化するためのブロックです。「sum関数のテスト」のように、大きな単位でテストをまとめます。  
   * test(name, fn) または it(name, fn): 個々のテストケースを定義します。「1 + 2 は 3 になること」のように、一つの具体的な振る舞いを検証します。テストケース名は、何を検証しているのかが明確にわかるように記述するのがベストプラクティスです。  
     * **test と it の使い分けについて**: この2つの関数は**機能的に全く同じもの**であり、どちらを使っても構いません。it は、振る舞い駆動開発（BDD）というスタイルに由来し、英語の "It should..."（それは〜であるべきだ）という文章のようにテストを記述できることから来ています。例えば it('should return 3 when summing 1 and 2') のように書くと、自然な英文のように読めます。一方、test はより直接的な名前です。この資料では、どちらのスタイルも有効であることを示すために両方を使用しています。好みに合わせて使い分けてください。  
   * expect(value).matcher(expectedValue): テストの核となる検証部分です。expectに関数の実行結果などを渡し、その値が期待通りであるかを**マッチャー**（.toBe()など）を使って表明します。例えば expect(sum(1, 2)).toBe(3) は、「sum(1, 2) の結果が 3 であることを期待する」という意味になります。

**tests/sum.test.ts**
```
const { sum } = require('../src/sum');

describe('sum function', () => {  
  test('1 + 2 は 3 になること', () => {  
    expect(sum(1, 2)).toBe(3);  
  });

  it('負の数の足し算が正しく行われること', () => {  
    expect(sum(-1, -5)).toBe(-6);  
  });  
});
```
3. テストを実行します。  
   ターミナルで以下のコマンドを実行してください。  
```
   npm test
```
   次のような結果が表示されれば、テストは成功です！  
```
    PASS  tests/sum.test.ts  
     sum function  
       ✓ 1 + 2 は 3 になること (2ms)  
       ✓ 負の数の足し算が正しく行われること

   Test Suites: 1 passed, 1 total  
   Tests:       2 passed, 2 total
```
### **Step 3: テストをわざと失敗させてみる**

テストが失敗したときにJestがどのように教えてくれるのかも見てみましょう。tests/sum.test.ts の1つ目のテストを以下のように書き換えてください。
```
test('1 + 2 は 3 になること', () => {  
  // 期待する結果をわざと間違えてみる  
  expect(sum(1, 2)).toBe(4);   
});
```
再度 npm test を実行すると、今度はテストが失敗し、期待した値（Expected）と実際の値（Received）がどのように違ったのかを詳細に表示してくれます。
```
 FAIL  tests/sum.test.ts  
  ● sum function › 1 + 2 は 3 になること

    expect(received).toBe(expected) // Object.is equality

    Expected: 4  
    Received: 3
```
このように、どこで何が問題なのかが一目でわかるのがテストフレームワークの強力な点です。テストが失敗した際は、まずこの Expected と Received の差分を確認することがデバッグの第一歩となります。

## **4\. マッチャーを使いこなす（ハンズオン）**

Jestには、toBe 以外にも様々な値を検証するための **マッチャー** が用意されています。ここでは、実際にテスト対象のソースコードを書き、それをテストする形で、より実践的にマッチャーを学んでいきましょう。

### **Step 1: テスト対象のユーティリティ関数を作成**

まず、src ディレクトリに matcher-utils.ts というファイルを作成し、以下のコードを貼り付けてください。これから、このファイル内の関数をテストしていきます。

**src/matcher-utils.ts**
```
// ユーザーオブジェクトを生成する  
function createUser(name: string, age: number) {  
  return { name, age };  
}

// ユーザーの有効状態を返す（この例では常にtrue）  
function isUserActive() {  
  return true;  
}

// nullを返す関数  
function getNull() {  
  return null;  
}

// ショッピングリストの配列を返す  
function getShoppingList() {  
  return ['milk', 'bread', 'eggs'];  
}

// ユーザー登録関数（バリデーション付き）  
function registerUser(username: string) {  
  if (!username || username.length < 3) {  
    throw new Error('Username must be at least 3 characters long.');  
  }  
  return { username, registered: true };  
}

// CommonJS形式でエクスポート  
module.exports = {  
  createUser,  
  isUserActive,  
  getNull,  
  getShoppingList,  
  registerUser,  
};
```
### **Step 2: テストファイルを作成し、マッチャーを試す**

次に、tests ディレクトリに matcher-utils.test.ts というファイルを作成し、以下のテストコードを順に記述していきましょう。

テストコードが増えてくると、describe を使って適切にグループ化することが重要になります。describe は、関連性の高いテストケースをまとめるための入れ物です。一般的には、以下のような単位でグループ化すると、テストの意図が明確になり、管理しやすくなります。

* **関数ごと**: describe('createUser function', ...) のように、テスト対象の関数名を付けます。これが最も基本的なグループ化の方法です。  
* **機能やコンセプトごと**: describe('State Matchers', ...) のように、特定の機能（状態の検証など）や概念に関連するテストをまとめます。  
* **特定の条件下ごと**: describe は入れ子にすることもできます。例えば、describe('registerUser function', ...) の中に、describe('when username is valid', ...) と describe('when username is invalid', ...) のように、条件別のグループを作ることも可能です。

このハンズオンでは、これらのグループ化を実践しながら、各種マッチャーの使い方を学んでいきます。

#### **4.1. toBe vs toEqual - オブジェクトのテスト**

toEqual はオブジェクトや配列の「中身」が等しいかを検証するのに使います。

**tests/matcher-utils.test.ts**
```
const {  
  createUser,  
  isUserActive,  
  getNull,  
  getShoppingList,  
  registerUser,  
} = require('../src/matcher-utils');

describe('createUser function', () => {  
  it('正しいnameとageを持つユーザーオブジェクトを生成すること', () => {  
    // 期待するオブジェクト  
    const expectedUser = { name: 'Taro', age: 20 };  
    // 実際のオブジェクト  
    const actualUser = createUser('Taro', 20);

    // 中身が同じなので toEqual は成功する  
    expect(actualUser).toEqual(expectedUser);  
      
    // メモリ上の場所は違うので toBe は失敗する  
    // expect(actualUser).toBe(expectedUser); // この行のコメントを外すと失敗する  
  });  
});
```
**まとめ:**

* **toBe**: 「これが **まさしく同一人物（モノ）** であるか？」を検証する。プリミティブ値に使う。  
* **toEqual**: 「これが **見た目や中身が全く同じ** であるか？」を検証する。オブジェクトや配列に使う。

#### **4.2. toBeTruthy / toBeFalsy / toBeNull - 状態のテスト**

if文の条件のように、値が true や false として扱われるかを検証します。

**tests/matcher-utils.test.ts (追記)**
```
describe('State Matchers', () => {  
  it('isUserActiveはTruthyな値を返すこと', () => {  
    // isUserActive() の返り値 (true) は truthy  
    expect(isUserActive()).toBeTruthy();  
  });

  it('getNullはnullを返すこと', () => {  
    // getNull() の返り値は null  
    expect(getNull()).toBeNull();  
    // null は falsy  
    expect(getNull()).toBeFalsy();  
  });  
});
```
#### **4.3. toContain - 配列のテスト**

配列に特定の要素が含まれているかを検証します。

**tests/matcher-utils.test.ts (追記)**
```
describe('getShoppingList function', () => {  
  it('ショッピングリストに "milk" が含まれていること', () => {  
    const list = getShoppingList();  
    expect(list).toContain('milk');  
  });

  it('ショッピングリストに "butter" が含まれていないこと', () => {  
    const list = getShoppingList();  
    // .not でマッチャーを否定  
    expect(list).not.toContain('butter');  
  });  
});
```
#### **4.4. toThrow - 例外のテスト**

特定の条件下で関数が正しくエラーを投げるかを検証します。

**tests/matcher-utils.test.ts (追記)**
```
describe('registerUser function', () => {  
  it('ユーザー名が短すぎる場合にエラーをスローすること', () => {  
    // expectの中は関数を呼び出す無名関数にするのがポイント  
    expect(() => {  
      registerUser('ab');  
    }).toThrow('Username must be at least 3 characters long.');  
  });

  it('有効なユーザー名の場合はエラーをスローしないこと', () => {  
    expect(() => {  
      registerUser('valid-user');  
    }).not.toThrow();  
  });  
});
```
### **4.5. テストの実行を制御する**

開発が進むとテストの数が増え、すべてのテストを実行すると時間がかかるようになります。Jestには、特定のテストだけを実行したり、一時的に無効化したりする便利な機能があります。

* 特定のテストファイルだけを実行する  
  npm test の後ろにファイルパスを指定することで、そのファイルだけをテストできます。  
```
  npm test tests/matcher-utils.test.ts
```
* 特定のテストケースだけを実行する (.only)  
  デバッグ中など、特定のテストケースに集中したい場合は、test や it の後ろに .only を付けます。  
  // このテストファイルでは、このテストケースだけが実行される  
```
  it.only('ショッピングリストに "milk" が含まれていること', () => {  
    const list = getShoppingList();  
    expect(list).toContain('milk');  
  });

  it('ショッピングリストに "butter" が含まれていないこと', () => {  
    // ...  
  });  
```
  `.only` は `describe` にも付けることができ、その場合はその `describe` ブロック内のテストだけが実行されます。

* 特定のテストを一時的に無効化する (.skip)  
  まだ実装が完了していない、あるいは何らかの理由で一時的に失敗させておきたくないテストがある場合は、.skip を付けます。  
  // このテストは実行されず、「skipped」として報告される  
```
  it.skip('未実装の機能に関するテスト', () => {  
    // ...  
  });
```
  これにより、テストをコメントアウトすることなく、意図的に無効化していることを明確に示せます。

これらの機能を使いこなすことで、開発サイクルを効率的に回すことができます。

### **マッチャー早見表**

| マッチャー | 説明 |
| :---- | :---- |
| .toBe(value) | === を使った厳密な値の比較。プリミティブ値に使う。 |
| .toEqual(value) | オブジェクトや配列のプロパティを再帰的に比較する。 |
| .not | マッチャーの条件を否定する。expect(v).not.toBe(0)のように使う。 |
| .toBeTruthy() / toBeFalsy() | 値がtrue / falseとして扱われるかを検証する。 |
| .toBeNull() / .toBeUndefined() | 値がnull / undefinedであるかを検証する。 |
| .toContain(item) | 配列や文字列に特定の要素が含まれているかを検証する。 |
| .toMatch(regexp) | 文字列が正規表現にマッチするかを検証する。 |
| .toThrow(error?) | 関数が例外をスローするかを検証する。 |

### **4.6. テストカバレッジの計測**

テストを書いていくと、「自分の書いたテストが、ソースコードのどれくらいの範囲をカバーできているのか？」が気になります。その指標となるのが**テストカバレッジ**です。

#### **テストカバレッジとは？**

テストカバレッジとは、**テストコードを実行した際に、テスト対象のソースコードがどれだけの割合で実行されたか**を示す指標です。一般的に、行単位（Statements）、関数単位（Functions）、分岐単位（Branches）などで計測されます。

* **目的**: テストが通っていないコード、つまり**テストされていないロジックを可視化する**ことが主な目的です。  
* **注意点**: カバレッジ100%が必ずしも高品質を意味するわけではありません。しかし、カバレッジが極端に低い場合は、テストが不足している明確なサインです。

#### **カバレッジレポートの出力方法**

Jestには、テストカバレッジを計測する機能が組み込まれています。

1. package.json を修正する  
   カバレッジ計測用のコマンドを scripts に追加しましょう。jest コマンドに --coverage オプションを付けるだけです。  
```
   "scripts": {  
     "test": "jest",  
     "test:coverage": "jest --coverage"  
   },
```
2. カバレッジ計測を実行する  
   ターミナルで、新しく追加したコマンドを実行します。  
```
   npm run test:coverage
```
   実行すると、テスト結果とともに、ターミナルにカバレッジのサマリーが表示されます。  
```
   ----------|---------|----------|---------|---------|---------  
   File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line \#s  
   ----------|---------|----------|---------|-------------------  
   All files |     100 |      100 |     100 |     100 |  
    sum.ts   |     100 |      100 |     100 |     100 |  
   ----------|---------|----------|---------|---------|---------
```
3. HTMLレポートを確認する  
   コマンドを実行すると、プロジェクトのルートに coverage というディレクトリが生成されます。この中の lcov-report/index.html をブラウザで開いてみましょう。  
   より詳細なカバレッジレポートを視覚的に確認できます。ファイル名をクリックすると、ソースコードのどの行がテストで実行され（緑色）、どの行が実行されなかったか（赤色）が一目でわかります。これにより、テストが漏れている箇所を簡単に特定できます。

## **5. 演習**

それでは、ここまでの内容を踏まえて、実際に自分でテストを書いてみましょう。

### **課題**

いくつかのユーティリティ関数に対して、ユニットテストを作成してください。

### **手順**

1. src ディレクトリに utils.ts というファイルを作成し、以下のコードを貼り付けます。  
2. tests ディレクトリに utils.test.ts というテストファイルを新規作成します。  
3. utils.test.ts の中に、validateEmail, calculateCartTotal, createUserProfile 関数のテストを記述します。

#### **テスト対象コード (src/utils.ts)**
```
// CommonJS形式でエクスポートするために、関数を定義します。  
function validateEmail(email: string | null | undefined): boolean {  
  if (!email) return false;  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);  
}

function calculateCartTotal(  
  items: { price: number; quantity: number }[]  
): number {  
  let total = 0;  
  for (const item of items) {  
    if (item.price < 0 || item.quantity < 0) {  
      throw new Error('Price and quantity must be non-negative.');  
    }  
    total += item.price * item.quantity;  
  }  
  return total;  
}

function createUserProfile(  
  name: string,  
  age: number,  
  tags?: string[]  
): {  
  id: string;  
  name: string;  
  age: number;  
  createdAt: Date;  
  tags?: string[];  
} {  
  if (!name || name.trim().length === 0) {  
    throw new Error('Name cannot be empty.');  
  }  
  if (age < 0) {  
    throw new Error('Age must be a non-negative number.');  
  }  
  const profile: any = {  
    id: `user-${Date.now()}`, // 簡単なユニークID  
    name,  
    age,  
    createdAt: new Date(),  
  };  
  if (tags) {  
    profile.tags = tags;  
  }  
  return profile;  
}

// すべての関数をまとめてエクスポートします。  
module.exports = {  
  validateEmail,  
  calculateCartTotal,  
  createUserProfile,  
};
```
### **テスト要件**

以下の観点でテストケースを作成してみてください。

* **validateEmail 関数**  
  * test@example.com のような有効なメールアドレスで true が返ること。  
  * invalid-email のような無効なメールアドレスで false が返ること。  
  * @ がない、ドメインがないなど、複数の無効なパターンで false が返ること。  
  * 空文字列 ''、null、undefined を渡した場合に false が返ること。  
* **calculateCartTotal 関数**  
  * 複数の商品が入ったカートの合計金額が正しく計算されること。（例: { price: 100, quantity: 2 }, { price: 50, quantity: 3 } -> 350）  
  * 空の配列 [] を渡した場合、合計金額が 0 になること。  
  * 商品の price が負の数の場合、「Price and quantity must be non-negative.」というエラーがスローされること。  
  * 商品の quantity が負の数の場合も、同様のエラーがスローされること。  
* **createUserProfile 関数**  
  * name と age だけを渡した場合、tags プロパティを含まないオブジェクトが作成されること。  
  * name, age, tags の全てを渡した場合、渡した tags を正しく含むオブジェクトが作成されること。  
  * 正常に作成された場合、返されるオブジェクトが id（文字列）と createdAt（Dateオブジェクト）を正しく持つこと。  
  * 名前が空文字列 '' の場合、「Name cannot be empty.」というエラーメッセージで例外がスローされること。  
  * 年齢が負の数（例: -1）の場合、「Age must be a non-negative number.」というエラーメッセージで例外がスローされること。

**ヒント:**

* describe で関数ごとにテストをグループ化し、it や test で各テストケースを記述しましょう。  
* validateEmail のテストでは、toBeTruthy() と toBeFalsy() が役立ちます。  
* calculateCartTotal や createUserProfile のエラーテストでは toThrow() を使います。  
* createUserProfile が返すオブジェクトの検証には toEqual() や toHaveProperty() を使い分けましょう。