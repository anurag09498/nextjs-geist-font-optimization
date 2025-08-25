'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Psychology,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { getTradeSignal, getRiskAssessment, TradingSignal } from '../services/aiBot';
import { useTradingData } from '../hooks/useTradingData';

interface TradeBotProps {
  coinId?: string;
  days?: string;
}

const TradeBot: React.FC<TradeBotProps> = ({
  coinId = 'bitcoin',
  days = '1'
}) => {
  const { data, loading, error, prices, volumes, getCurrentPrice } = useTradingData({
    coinId,
    days,
    refreshInterval: 60000,
    autoRefresh: true
  });

  const analysis = useMemo(() => {
    if (!data || !prices || prices.length < 50) {
      return null;
    }

    const signal = getTradeSignal(prices, volumes);
    const risk = getRiskAssessment(prices, signal);

    return { signal, risk };
  }, [data, prices, volumes]);

  const getSignalIcon = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp />;
      case 'SELL':
        return <TrendingDown />;
      default:
        return <TrendingFlat />;
    }
  };

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRiskIcon = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'LOW':
        return <CheckCircle />;
      case 'MEDIUM':
        return <Warning />;
      default:
        return <Error />;
    }
  };

  const getRiskColor = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'error';
    }
  };

  if (loading) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Psychology color="primary" />
            <Typography variant="h6">
              AI Trading Bot
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Analyzing market data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Psychology color="primary" />
            <Typography variant="h6">
              AI Trading Bot
            </Typography>
          </Box>
          <Alert severity="error">
            <Typography variant="body2">
              Unable to analyze market data: {error}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Psychology color="primary" />
            <Typography variant="h6">
              AI Trading Bot
            </Typography>
          </Box>
          <Alert severity="info">
            <Typography variant="body2">
              Insufficient data for analysis. Need at least 50 data points for accurate signals.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { signal, risk } = analysis;
  const currentPrice = getCurrentPrice();

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Psychology color="primary" />
            <Typography variant="h6">
              AI Trading Bot
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {signal.timestamp.toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Main Signal */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
            {getSignalIcon(signal.signal)}
            <Typography variant="h4" fontWeight="bold" color={`${getSignalColor(signal.signal)}.main`}>
              {signal.signal}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
            <Typography variant="body2" color="text.secondary">
              Confidence:
            </Typography>
            <Chip
              label={`${signal.confidence}%`}
              color={signal.confidence >= 70 ? 'success' : signal.confidence >= 50 ? 'warning' : 'error'}
              variant="filled"
            />
          </Box>

          <Box mb={2}>
            <LinearProgress
              variant="determinate"
              value={signal.confidence}
              color={signal.confidence >= 70 ? 'success' : signal.confidence >= 50 ? 'warning' : 'error'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {signal.reason}
          </Typography>
        </Paper>

        {/* Risk Assessment */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle2" fontWeight="bold">
              Risk Assessment
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {getRiskIcon(risk.riskLevel)}
              <Chip
                label={`${risk.riskLevel} RISK`}
                color={getRiskColor(risk.riskLevel) as any}
                size="small"
                variant="filled"
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={1}>
            Volatility: {risk.volatility}%
          </Typography>
          
          <Typography variant="body2">
            {risk.recommendation}
          </Typography>
        </Paper>

        {/* Technical Indicators Summary */}
        {signal.indicators.macd && signal.indicators.bollingerBands && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Key Indicators
            </Typography>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">
                RSI:
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {signal.indicators.rsi.toFixed(2)}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">
                MACD Signal:
              </Typography>
              <Typography 
                variant="caption" 
                fontWeight="bold"
                color={signal.indicators.macd.histogram >= 0 ? 'success.main' : 'error.main'}
              >
                {signal.indicators.macd.histogram >= 0 ? 'Bullish' : 'Bearish'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                BB Position:
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {currentPrice >= signal.indicators.bollingerBands.upper ? 'Upper' :
                 currentPrice <= signal.indicators.bollingerBands.lower ? 'Lower' : 'Middle'}
              </Typography>
            </Box>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Disclaimer */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="caption">
            <strong>Disclaimer:</strong> This is an AI-generated analysis based on technical indicators. 
            Always do your own research and consider your risk tolerance before making any trading decisions. 
            Past performance does not guarantee future results.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TradeBot;
