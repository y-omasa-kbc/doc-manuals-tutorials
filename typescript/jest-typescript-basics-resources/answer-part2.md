```python
const { WeatherService } = require('../src/weatherService');
const { ApiClient } = require('../src/apiClient');

// この行は必須です。JestにApiClientクラスをモックで置き換えるよう指示します。
jest.mock('../src/apiClient');

// 型安全のために、モック化されたApiClientをキャストします。
const MockedApiClient = ApiClient as jest.Mock;

describe('WeatherService', () => {
  let weatherService: InstanceType<typeof WeatherService>;

  beforeEach(() => {
    // ★重要★: 各テストの前に、すべてのモックの履歴をクリアします。
    // これにより、あるテストの呼び出し情報が他のテストに影響を与えるのを防ぎます。
    MockedApiClient.mockClear();
    
    // 各テストが独立するように、新しいインスタンスを作成します。
    weatherService = new WeatherService();
  });

  it('天気が晴れで暖かい場合、「絶好のお出かけ日和です！」というコメントを返すこと', async () => {
    // WeatherServiceのコンストラクタで生成されたモックインスタンスを取得します。
    const mockApiClientInstance = MockedApiClient.mock.instances[0];
    // このテストケース用の戻り値を設定します。
    mockApiClientInstance.fetchWeather.mockResolvedValue({ weather: 'Sunny', temp: 25 });

    const comment = await weatherService.getWeatherComment('東京');

    expect(comment).toBe('今日の東京は晴れで、気温は25度です。絶好のお出かけ日和です！');
    expect(mockApiClientInstance.fetchWeather).toHaveBeenCalledWith('東京');
    expect(mockApiClientInstance.fetchWeather).toHaveBeenCalledTimes(1);
  });

  it('天気が雨の場合、「傘を忘れずに。」というコメントを返すこと', async () => {
    const mockApiClientInstance = MockedApiClient.mock.instances[0];
    // このテストケース用の戻り値を設定します。
    mockApiClientInstance.fetchWeather.mockResolvedValue({ weather: 'Rainy', temp: 15 });

    const comment = await weatherService.getWeatherComment('大阪');

    expect(comment).toBe('今日の大阪は雨です。傘を忘れずに。');
    expect(mockApiClientInstance.fetchWeather).toHaveBeenCalledWith('大阪');
    expect(mockApiClientInstance.fetchWeather).toHaveBeenCalledTimes(1);
  });

  it('APIからのデータ取得に失敗した場合、「天気情報の取得に失敗しました。」と返すこと', async () => {
    const mockApiClientInstance = MockedApiClient.mock.instances[0];
    // このテストケース用に、Promiseがrejectされるように設定します。
    mockApiClientInstance.fetchWeather.mockRejectedValue(new Error('API Error'));

    const comment = await weatherService.getWeatherComment('京都');

    expect(comment).toBe('天気情報の取得に失敗しました。');
    expect(mockApiClientInstance.fetchWeather).toHaveBeenCalledWith('京都');
    expect(mockApiClientInstance.fetchWeather).toHaveBeenCalledTimes(1);
  });
});
```
