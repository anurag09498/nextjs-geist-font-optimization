import { RSI, MACD, BollingerBands, SMA, EMA } from 'technicalindicators';

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reason: string;
  indicators: {
    rsi: number;
    macd: {
      MACD: number;
      signal: number;
      histogram: number;
    } | null;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    } | null;
    sma20: number;
    ema12: number;
  };
  timestamp: Date;
}

/**
 * Calculate technical indicators and generate trading signal
 * @param prices - Array of closing prices (most recent last)
 * @param volumes - Array of trading volumes (optional)
 */
export const getTradeSignal = (prices: number[], volumes?: number[]): TradingSignal => {
  try {
    if (prices.length < 50) {
      return {
        signal: 'HOLD',
        confidence: 0,
        reason: 'Insufficient data for analysis (minimum 50 data points required)',
        indicators: {
          rsi: 0,
          macd: null,
          bollingerBands: null,
          sma20: 0,
          ema12: 0
        },
        timestamp: new Date()
      };
    }

    // Calculate technical indicators
    const rsiValues = RSI.calculate({ values: prices, period: 14 });
    const macdValues = MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const bbValues = BollingerBands.calculate({
      values: prices,
      period: 20,
      stdDev: 2
    });
    const sma20Values = SMA.calculate({ values: prices, period: 20 });
    const ema12Values = EMA.calculate({ values: prices, period: 12 });

    // Get latest values
    const latestRSI = rsiValues[rsiValues.length - 1];
    const latestMACD = macdValues[macdValues.length - 1];
    const latestBB = bbValues[bbValues.length - 1];
    const latestSMA20 = sma20Values[sma20Values.length - 1];
    const latestEMA12 = ema12Values[ema12Values.length - 1];
    const currentPrice = prices[prices.length - 1];

    // Initialize signal analysis
    let buySignals = 0;
    let sellSignals = 0;
    let reasons: string[] = [];

    // RSI Analysis
    if (latestRSI && latestRSI < 30) {
      buySignals += 2;
      reasons.push(`RSI oversold at ${latestRSI.toFixed(2)}`);
    } else if (latestRSI && latestRSI > 70) {
      sellSignals += 2;
      reasons.push(`RSI overbought at ${latestRSI.toFixed(2)}`);
    }

    // MACD Analysis
    if (latestMACD && latestMACD.MACD !== undefined && latestMACD.signal !== undefined && latestMACD.histogram !== undefined) {
      if (latestMACD.MACD > latestMACD.signal && latestMACD.histogram > 0) {
        buySignals += 1;
        reasons.push('MACD bullish crossover');
      } else if (latestMACD.MACD < latestMACD.signal && latestMACD.histogram < 0) {
        sellSignals += 1;
        reasons.push('MACD bearish crossover');
      }
    }

    // Bollinger Bands Analysis
    if (latestBB && currentPrice <= latestBB.lower) {
      buySignals += 1;
      reasons.push('Price touching lower Bollinger Band');
    } else if (latestBB && currentPrice >= latestBB.upper) {
      sellSignals += 1;
      reasons.push('Price touching upper Bollinger Band');
    }

    // Moving Average Analysis
    if (currentPrice > latestSMA20 && latestEMA12 > latestSMA20) {
      buySignals += 1;
      reasons.push('Price above SMA20 with EMA12 bullish');
    } else if (currentPrice < latestSMA20 && latestEMA12 < latestSMA20) {
      sellSignals += 1;
      reasons.push('Price below SMA20 with EMA12 bearish');
    }

    // Volume Analysis (if available)
    if (volumes && volumes.length >= 20) {
      const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const currentVolume = volumes[volumes.length - 1];
      
      if (currentVolume > avgVolume * 1.5) {
        if (buySignals > sellSignals) {
          buySignals += 1;
          reasons.push('High volume supporting bullish trend');
        } else if (sellSignals > buySignals) {
          sellSignals += 1;
          reasons.push('High volume supporting bearish trend');
        }
      }
    }

    // Determine final signal
    let signal: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let finalReason: string;

    const totalSignals = buySignals + sellSignals;
    
    if (buySignals > sellSignals && buySignals >= 2) {
      signal = 'BUY';
      confidence = Math.min(90, (buySignals / Math.max(totalSignals, 1)) * 100);
      finalReason = `Strong buy signal: ${reasons.filter(r => r.includes('RSI oversold') || r.includes('MACD bullish') || r.includes('lower Bollinger')).join(', ')}`;
    } else if (sellSignals > buySignals && sellSignals >= 2) {
      signal = 'SELL';
      confidence = Math.min(90, (sellSignals / Math.max(totalSignals, 1)) * 100);
      finalReason = `Strong sell signal: ${reasons.filter(r => r.includes('RSI overbought') || r.includes('MACD bearish') || r.includes('upper Bollinger')).join(', ')}`;
    } else {
      signal = 'HOLD';
      confidence = 50;
      finalReason = 'Mixed signals or insufficient conviction. Consider waiting for clearer trend.';
    }

    return {
      signal,
      confidence: Math.round(confidence),
      reason: finalReason,
      indicators: {
        rsi: latestRSI || 0,
        macd: latestMACD && latestMACD.MACD !== undefined && latestMACD.signal !== undefined && latestMACD.histogram !== undefined 
          ? {
              MACD: latestMACD.MACD,
              signal: latestMACD.signal,
              histogram: latestMACD.histogram
            }
          : null,
        bollingerBands: latestBB || null,
        sma20: latestSMA20 || 0,
        ema12: latestEMA12 || 0
      },
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error in computing trade signal:', error);
    return {
      signal: 'HOLD',
      confidence: 0,
      reason: 'Error computing signal. Please try again.',
      indicators: {
        rsi: 0,
        macd: null,
        bollingerBands: null,
        sma20: 0,
        ema12: 0
      },
      timestamp: new Date()
    };
  }
};

/**
 * Get risk assessment based on current market conditions
 * @param prices - Array of closing prices
 * @param signal - Current trading signal
 */
export const getRiskAssessment = (prices: number[], signal: TradingSignal): {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  volatility: number;
  recommendation: string;
} => {
  try {
    // Calculate volatility (standard deviation of returns)
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let recommendation: string;

    if (volatility < 2) {
      riskLevel = 'LOW';
      recommendation = 'Market showing low volatility. Good for conservative strategies.';
    } else if (volatility < 5) {
      riskLevel = 'MEDIUM';
      recommendation = 'Moderate volatility detected. Use appropriate position sizing.';
    } else {
      riskLevel = 'HIGH';
      recommendation = 'High volatility warning! Consider reducing position size or waiting for stability.';
    }

    // Adjust recommendation based on signal confidence
    if (signal.confidence < 60) {
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
      recommendation += ' Low signal confidence suggests increased caution.';
    }

    return {
      riskLevel,
      volatility: Math.round(volatility * 100) / 100,
      recommendation
    };

  } catch (error) {
    console.error('Error calculating risk assessment:', error);
    return {
      riskLevel: 'HIGH',
      volatility: 0,
      recommendation: 'Unable to assess risk. Exercise maximum caution.'
    };
  }
};
