import axios from 'axios';

// CoinGecko API base URL (free tier)
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface CryptoData {
  prices: number[][];
  market_caps: number[][];
  total_volumes: number[][];
}

export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

/**
 * Fetch historical price data for a cryptocurrency
 * @param coinId - The coin ID (e.g., 'bitcoin', 'ethereum')
 * @param days - Number of days of data (1, 7, 30, 90, 180, 365, max)
 * @param vsCurrency - The target currency (default: 'usd')
 */
export const fetchCryptoData = async (
  coinId: string = 'bitcoin',
  days: string = '1',
  vsCurrency: string = 'usd'
): Promise<CryptoData> => {
  try {
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: vsCurrency,
          days: days,
          interval: days === '1' ? 'hourly' : 'daily'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw new Error(`Failed to fetch data for ${coinId}`);
  }
};

/**
 * Fetch current market data for multiple cryptocurrencies
 * @param coinIds - Array of coin IDs
 * @param vsCurrency - The target currency (default: 'usd')
 */
export const fetchMultipleCryptoData = async (
  coinIds: string[] = ['bitcoin', 'ethereum', 'cardano', 'polkadot'],
  vsCurrency: string = 'usd'
): Promise<CoinInfo[]> => {
  try {
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/coins/markets`,
      {
        params: {
          vs_currency: vsCurrency,
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: coinIds.length,
          page: 1,
          sparkline: false
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching multiple crypto data:', error);
    throw new Error('Failed to fetch market data');
  }
};

/**
 * Fetch trending cryptocurrencies
 */
export const fetchTrendingCoins = async (): Promise<any> => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search/trending`);
    return response.data.coins;
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    throw new Error('Failed to fetch trending coins');
  }
};

/**
 * Search for cryptocurrencies by name or symbol
 * @param query - Search query
 */
export const searchCoins = async (query: string): Promise<any> => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
      params: { query }
    });
    return response.data.coins;
  } catch (error) {
    console.error('Error searching coins:', error);
    throw new Error('Failed to search coins');
  }
};
