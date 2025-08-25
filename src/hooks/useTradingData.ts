'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchCryptoData, CryptoData } from '../utils/api';

export interface TradingDataState {
  data: CryptoData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseTradingDataOptions {
  coinId?: string;
  days?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

/**
 * Custom hook for fetching and managing cryptocurrency trading data
 * @param options - Configuration options for the hook
 */
export const useTradingData = (options: UseTradingDataOptions = {}) => {
  const {
    coinId = 'bitcoin',
    days = '1',
    refreshInterval = 60000, // 1 minute default
    autoRefresh = true
  } = options;

  const [state, setState] = useState<TradingDataState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await fetchCryptoData(coinId, days);
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch trading data'
      }));
    }
  }, [coinId, days]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, autoRefresh]);

  // Extract prices for easier access
  const prices = state.data?.prices?.map(([, price]) => price) || [];
  const timestamps = state.data?.prices?.map(([timestamp]) => timestamp) || [];
  const volumes = state.data?.total_volumes?.map(([, volume]) => volume) || [];

  return {
    ...state,
    prices,
    timestamps,
    volumes,
    refresh,
    // Helper functions
    getCurrentPrice: () => prices[prices.length - 1] || 0,
    getPriceChange: () => {
      if (prices.length < 2) return 0;
      const current = prices[prices.length - 1];
      const previous = prices[prices.length - 2];
      return ((current - previous) / previous) * 100;
    },
    getPriceChangeFromStart: () => {
      if (prices.length < 2) return 0;
      const current = prices[prices.length - 1];
      const start = prices[0];
      return ((current - start) / start) * 100;
    }
  };
};

/**
 * Hook for managing multiple cryptocurrency data
 * @param coinIds - Array of coin IDs to track
 */
export const useMultipleTradingData = (coinIds: string[] = ['bitcoin', 'ethereum']) => {
  const [dataMap, setDataMap] = useState<Record<string, TradingDataState>>({});
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setGlobalLoading(true);
      const newDataMap: Record<string, TradingDataState> = {};

      for (const coinId of coinIds) {
        try {
          const data = await fetchCryptoData(coinId, '1');
          newDataMap[coinId] = {
            data,
            loading: false,
            error: null,
            lastUpdated: new Date()
          };
        } catch (err: any) {
          newDataMap[coinId] = {
            data: null,
            loading: false,
            error: err.message || `Failed to fetch data for ${coinId}`,
            lastUpdated: null
          };
        }
      }

      setDataMap(newDataMap);
      setGlobalLoading(false);
    };

    fetchAllData();

    // Auto-refresh every 2 minutes for multiple coins
    const interval = setInterval(fetchAllData, 120000);
    return () => clearInterval(interval);
  }, [coinIds]);

  return {
    dataMap,
    globalLoading,
    getCoinData: (coinId: string) => dataMap[coinId] || null,
    getAllPrices: () => {
      const prices: Record<string, number> = {};
      Object.entries(dataMap).forEach(([coinId, state]) => {
        if (state.data?.prices?.length) {
          prices[coinId] = state.data.prices[state.data.prices.length - 1][1];
        }
      });
      return prices;
    }
  };
};
