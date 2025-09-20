/**
 * EODHD Cryptocurrency Data Types
 * Types for crypto exchanges, pairs, and market data
 */

import { DateString, Currency } from './common.types';

/**
 * Crypto Exchange
 */
export interface CryptoExchange {
  Code: string;
  Name: string;
  Country?: string;
  URL?: string;
  Active: boolean;
  UpdatedAt?: DateString;
}

/**
 * Crypto Symbol
 */
export interface CryptoSymbol {
  Code: string;
  Name: string;
  Exchange: string;
  Type: 'Crypto';
  BaseCurrency: string;
  QuoteCurrency: string;
  Active: boolean;
}

/**
 * Crypto Quote
 */
export interface CryptoQuote {
  code: string;
  timestamp: number;
  gmtOffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volume_base?: number; // Volume in base currency
  volume_quote?: number; // Volume in quote currency
}

/**
 * Extended Crypto Quote
 */
export interface ExtendedCryptoQuote extends CryptoQuote {
  previousClose: number;
  change: number;
  change_p: number;
  bid: number;
  ask: number;
  spread: number;
  marketCap?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
}

/**
 * Crypto Fundamentals
 */
export interface CryptoFundamentals {
  General: {
    Code: string;
    Name: string;
    Description?: string;
    Features?: string;
    Technology?: string;
    Algorithm?: string;
    ProofType?: string;
    HashAlgorithm?: string;
    BlockTime?: number;
    MaxSupply?: number;
    CirculatingSupply?: number;
    TotalSupply?: number;
    WhitePaper?: string;
    WebSite?: string;
    StartDate?: DateString;
  };
  MarketData: {
    MarketCap?: number;
    MarketCapDominance?: number;
    Volume24h?: number;
    VolumeChange24h?: number;
    PriceChange24h?: number;
    PriceChangePercentage24h?: number;
    PriceChange7d?: number;
    PriceChangePercentage7d?: number;
    PriceChange30d?: number;
    PriceChangePercentage30d?: number;
    ATH?: number;
    ATHDate?: DateString;
    ATL?: number;
    ATLDate?: DateString;
  };
  Blockchain?: {
    BlockHeight?: number;
    Difficulty?: number;
    HashRate?: number;
    TransactionsPerSecond?: number;
    ActiveAddresses?: number;
    TransactionVolume?: number;
    MedianTransactionFee?: number;
    ConfirmationTime?: number;
  };
  Developer?: {
    Forks?: number;
    Stars?: number;
    Subscribers?: number;
    TotalIssues?: number;
    ClosedIssues?: number;
    PullRequestsMerged?: number;
    PullRequestContributors?: number;
    CommitCount4Weeks?: number;
    CodeAdditions4Weeks?: number;
    CodeDeletions4Weeks?: number;
  };
  Social?: {
    Twitter?: {
      followers?: number;
      statusesCount?: number;
    };
    Reddit?: {
      subscribers?: number;
      activeAccounts?: number;
      postsPerDay?: number;
      commentsPerDay?: number;
    };
    Telegram?: {
      channelUserCount?: number;
    };
    Facebook?: {
      likes?: number;
    };
  };
}

/**
 * Crypto Historical Data
 */
export interface CryptoHistoricalData {
  date: DateString;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap?: number;
}

/**
 * Crypto Tick Data
 */
export interface CryptoTickData {
  timestamp: number;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
  exchange?: string;
}

/**
 * Crypto Order Book
 */
export interface CryptoOrderBook {
  timestamp: number;
  bids: Array<{
    price: number;
    amount: number;
  }>;
  asks: Array<{
    price: number;
    amount: number;
  }>;
  spread: number;
  midPrice: number;
}

/**
 * Crypto Exchange Volume
 */
export interface CryptoExchangeVolume {
  exchange: string;
  volume24h: number;
  volumePercent: number;
  pairs: number;
  topPairs: Array<{
    pair: string;
    volume: number;
    volumePercent: number;
  }>;
}

/**
 * DeFi Protocol Data
 */
export interface DeFiProtocol {
  name: string;
  symbol?: string;
  tvl: number; // Total Value Locked
  tvlChange24h: number;
  tvlChange7d: number;
  chains: string[];
  category: string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
}

/**
 * NFT Collection Data
 */
export interface NFTCollection {
  name: string;
  symbol?: string;
  blockchain: string;
  contractAddress?: string;
  floorPrice: number;
  floorPriceCurrency: Currency;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  holders: number;
  totalSupply: number;
  totalSales: number;
}