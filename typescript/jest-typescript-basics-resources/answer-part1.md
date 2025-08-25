```python
// `require` を使用して、`src` ディレクトリのモジュールをインポートします。
const {
  validateEmail,
  calculateCartTotal,
  createUserProfile,
} = require('../src/utils');

// `utils.ts` が存在しないというエラーが出る場合は、
// 演習の指示通りにファイルを作成してください。

describe('validateEmail function', () => {
  it('有効なメールアドレスの場合 true を返すこと', () => {
    expect(validateEmail('test@example.com')).toBeTruthy();
    expect(validateEmail('user.name+tag@domain.co.jp')).toBeTruthy();
  });

  it('無効なメールアドレスの場合 false を返すこと', () => {
    expect(validateEmail('invalid-email')).toBeFalsy();
    expect(validateEmail('test@.com')).toBeFalsy();
    expect(validateEmail('@example.com')).toBeFalsy();
    expect(validateEmail('test@example')).toBeFalsy();
  });

  it('空文字列、null、undefined の場合に false を返すこと', () => {
    expect(validateEmail('')).toBeFalsy();
    expect(validateEmail(null)).toBeFalsy();
    expect(validateEmail(undefined)).toBeFalsy();
  });
});

describe('calculateCartTotal function', () => {
  it('カート内の商品の合計金額を正しく計算すること', () => {
    const items = [
      { price: 100, quantity: 2 }, // 200
      { price: 50, quantity: 3 },  // 150
      { price: 200, quantity: 1 }, // 200
    ];
    expect(calculateCartTotal(items)).toBe(550);
  });

  it('空のカートの場合、合計金額が 0 になること', () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it('商品の price が負の数の場合にエラーをスローすること', () => {
    const items = [{ price: -100, quantity: 2 }];
    expect(() => calculateCartTotal(items)).toThrow(
      'Price and quantity must be non-negative.'
    );
  });

  it('商品の quantity が負の数の場合にエラーをスローすること', () => {
    const items = [{ price: 100, quantity: -2 }];
    expect(() => calculateCartTotal(items)).toThrow(
      'Price and quantity must be non-negative.'
    );
  });
});

describe('createUserProfile function', () => {
  it('tags なしでプロファイルが正しく作成されること', () => {
    const name = 'Hanako';
    const age = 25;
    const profile = createUserProfile(name, age);

    expect(profile.name).toBe(name);
    expect(profile.age).toBe(age);
    // tags プロパティが存在しないことを確認
    expect(profile).not.toHaveProperty('tags');
  });

  it('tags ありでプロファイルが正しく作成されること', () => {
    const name = 'Taro';
    const age = 30;
    const tags = ['developer', 'music'];
    const profile = createUserProfile(name, age, tags);

    expect(profile.name).toBe(name);
    expect(profile.age).toBe(age);
    // toEqual で配列の中身を比較
    expect(profile.tags).toEqual(tags);
  });

  it('作成されたプロファイルは、文字列のidとDateオブジェクトのcreatedAtを持つこと', () => {
    const profile = createUserProfile('Jiro', 30);

    expect(profile).toHaveProperty('id');
    expect(typeof profile.id).toBe('string');
    expect(profile).toHaveProperty('createdAt');
    expect(profile.createdAt).toBeInstanceOf(Date);
  });

  it('名前が空文字列の場合、「Name cannot be empty.」というエラーをスローすること', () => {
    expect(() => {
      createUserProfile('', 30);
    }).toThrow('Name cannot be empty.');
  });

  it('年齢が負の数の場合、「Age must be a non-negative number.」というエラーをスローすること', () => {
    expect(() => {
      createUserProfile('Saburo', -1);
    }).toThrow('Age must be a non-negative number.');
  });
});


```