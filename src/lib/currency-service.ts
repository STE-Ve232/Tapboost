/**
 * @fileOverview Real-time currency conversion service.
 */

const API_URL = 'https://open.er-api.com/v6/latest/USD';

export interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: { rates: ExchangeRates; timestamp: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getExchangeRates(): Promise<ExchangeRates> {
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.rates;
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    
    cachedRates = {
      rates: data.rates,
      timestamp: Date.now(),
    };
    
    return data.rates;
  } catch (error) {
    console.error('Currency API Error:', error);
    // Fallback to stable rates if API fails
    return {
      USD: 1,
      KES: 130,
      UGX: 3700,
      TZS: 2600,
      RWF: 1250,
    };
  }
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'KES', symbol: 'KSh' },
  { code: 'UGX', symbol: 'USh' },
  { code: 'TZS', symbol: 'TSh' },
  { code: 'RWF', symbol: 'RF' },
];
