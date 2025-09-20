/**
 * EODHD Fundamental Data Types
 * Types for company financials, ETFs, mutual funds, and indices
 */

import { DateString, Currency } from './common.types';

/**
 * Company Overview
 */
export interface CompanyOverview {
  Code: string;
  Type: string;
  Name: string;
  Exchange: string;
  CurrencyCode: Currency;
  CurrencyName: string;
  CurrencySymbol: string;
  CountryName: string;
  CountryISO: string;
  ISIN: string;
  CUSIP?: string;
  CIK?: string;
  EmployerIdNumber?: string;
  FiscalYearEnd?: string;
  IPODate?: DateString;
  InternationalDomestic?: string;
  Sector?: string;
  Industry?: string;
  GicSector?: string;
  GicGroup?: string;
  GicIndustry?: string;
  GicSubIndustry?: string;
  Description?: string;
  Address?: string;
  Phone?: string;
  WebURL?: string;
  LogoURL?: string;
  FullTimeEmployees?: number;
  UpdatedAt?: DateString;
}

/**
 * Financial Statement Item
 */
export interface FinancialItem {
  date: DateString;
  filing_date?: DateString;
  currency_symbol?: Currency;
  [key: string]: number | string | undefined;
}

/**
 * Income Statement
 */
export interface IncomeStatement extends FinancialItem {
  totalRevenue: number;
  costOfRevenue: number;
  grossProfit: number;
  researchDevelopment: number;
  sellingGeneralAdministrative: number;
  totalOperatingExpenses: number;
  operatingIncome: number;
  totalOtherIncomeExpenseNet: number;
  ebit: number;
  interestExpense: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeBasic: number;
}

/**
 * Balance Sheet
 */
export interface BalanceSheet extends FinancialItem {
  totalAssets: number;
  totalCurrentAssets: number;
  cashAndEquivalents: number;
  cashAndShortTermInvestments: number;
  inventory: number;
  currentNetReceivables: number;
  totalNonCurrentAssets: number;
  propertyPlantEquipment: number;
  accumulatedDepreciation: number;
  intangibleAssets: number;
  intangibleAssetsExcludingGoodwill: number;
  goodwill: number;
  longTermInvestments: number;
  shortTermInvestments: number;
  otherCurrentAssets: number;
  otherNonCurrrentAssets: number;
  totalLiabilities: number;
  totalCurrentLiabilities: number;
  currentAccountsPayable: number;
  deferredRevenue: number;
  currentDebt: number;
  shortTermDebt: number;
  totalNonCurrentLiabilities: number;
  capitalLeaseObligations: number;
  longTermDebt: number;
  currentLongTermDebt: number;
  longTermDebtNoncurrent: number;
  shortLongTermDebtTotal: number;
  otherCurrentLiabilities: number;
  otherNonCurrentLiabilities: number;
  totalShareholderEquity: number;
  treasuryStock: number;
  retainedEarnings: number;
  commonStock: number;
  commonStockSharesOutstanding: number;
}

/**
 * Cash Flow Statement
 */
export interface CashFlowStatement extends FinancialItem {
  netIncome: number;
  depreciation: number;
  changesInReceivables: number;
  changesInInventories: number;
  cashFlowFromOperations: number;
  capitalExpenditures: number;
  investments: number;
  cashFlowFromInvesting: number;
  dividendsPaid: number;
  netBorrowings: number;
  cashFlowFromFinancing: number;
  cashFlowForFreeCashFlow: number;
}

/**
 * Financial Ratios
 */
export interface FinancialRatios {
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  daysOfSalesOutstanding: number;
  daysOfInventoryOutstanding: number;
  operatingCycle: number;
  daysOfPayablesOutstanding: number;
  cashConversionCycle: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  pretaxProfitMargin: number;
  netProfitMargin: number;
  effectiveTaxRate: number;
  returnOnAssets: number;
  returnOnEquity: number;
  returnOnCapitalEmployed: number;
  debtEquityRatio: number;
  debtRatio: number;
  longTermDebtToCapitalization: number;
  totalDebtToCapitalization: number;
  interestCoverage: number;
  cashFlowToDebtRatio: number;
  companyEquityMultiplier: number;
}

/**
 * Earnings
 */
export interface Earnings {
  date: DateString;
  epsActual?: number;
  epsEstimate?: number;
  epsDifference?: number;
  surprisePercent?: number;
}

/**
 * ETF Data
 */
export interface ETFData {
  Code: string;
  Exchange: string;
  Name: string;
  Type: 'ETF';
  CurrencyCode: Currency;
  ISIN: string;
  Asset_Class?: string;
  Inception_Date?: DateString;
  DataSource?: string;
  Total_Assets?: string;
  Average_Daily_Volume?: string;
  Market_Capitalisation?: string;
  Holdings?: {
    Code: string;
    Exchange?: string;
    Name: string;
    Sector?: string;
    Industry?: string;
    Country?: string;
    Region?: string;
    Assets_Percent: number;
  }[];
}

/**
 * Mutual Fund Data
 */
export interface MutualFundData {
  Code: string;
  Type: 'FUND';
  Name: string;
  Fund_Family?: string;
  Fund_Category?: string;
  Currency?: Currency;
  Total_Assets?: string;
  Min_Investment?: number;
  Market_Cap?: string;
  Expense_Ratio?: number;
  Holdings?: {
    Code: string;
    Name: string;
    Assets_Percent: number;
  }[];
}

/**
 * Index Constituents
 */
export interface IndexConstituents {
  Code: string;
  Exchange: string;
  Name: string;
  Sector: string;
  Industry: string;
}

/**
 * Analyst Ratings
 */
export interface AnalystRatings {
  date: DateString;
  firm: string;
  analyst?: string;
  rating: string;
  ratingChange?: string;
  priceTarget?: number;
  priceTargetChange?: number;
}

/**
 * Fundamental Insider Transaction
 */
export interface FundamentalInsiderTransaction {
  date: DateString;
  ownerCik?: string;
  ownerName: string;
  transactionDate: DateString;
  transactionCode: string;
  transactionAmount: number;
  transactionPrice?: number;
  transactionAcquiredDisposed: 'A' | 'D';
  postTransactionAmount?: number;
  secLink?: string;
}

/**
 * ESG Scores
 */
export interface ESGScores {
  date: DateString;
  TotalESG: number;
  TotalESGPercentile: number;
  EnvironmentScore: number;
  EnvironmentScorePercentile: number;
  SocialScore: number;
  SocialScorePercentile: number;
  GovernanceScore: number;
  GovernanceScorePercentile: number;
  ControversyLevel: number;
  ControversyScore: number;
}

/**
 * Outstanding Shares
 */
export interface OutstandingShares {
  date: DateString;
  shares: number;
}

/**
 * Complete Fundamental Data Response
 */
export interface FundamentalData {
  General?: CompanyOverview;
  Highlights?: {
    MarketCapitalization?: number;
    MarketCapitalizationMln?: string;
    EBITDA?: number;
    PERatio?: number;
    PEGRatio?: number;
    DividendShare?: number;
    DividendYield?: number;
    EarningsShare?: number;
    BookValue?: number;
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    '50DayMA'?: number;
    '200DayMA'?: number;
    SharesOutstanding?: number;
    SharesFloat?: number;
    SharesShort?: number;
    SharesShortPriorMonth?: number;
    ShortRatio?: number;
    ShortPercent?: number;
    ForwardPE?: number;
    ProfitMargin?: number;
    OperatingMarginTTM?: number;
    ReturnOnAssetsTTM?: number;
    ReturnOnEquityTTM?: number;
    RevenueTTM?: number;
    RevenuePerShareTTM?: number;
    QuarterlyRevenueGrowthYOY?: number;
    GrossProfitTTM?: number;
    DilutedEpsTTM?: number;
    QuarterlyEarningsGrowthYOY?: number;
  };
  Financials?: {
    Income_Statement?: {
      yearly?: { [year: string]: IncomeStatement };
      quarterly?: { [quarter: string]: IncomeStatement };
    };
    Balance_Sheet?: {
      yearly?: { [year: string]: BalanceSheet };
      quarterly?: { [quarter: string]: BalanceSheet };
    };
    Cash_Flow?: {
      yearly?: { [year: string]: CashFlowStatement };
      quarterly?: { [quarter: string]: CashFlowStatement };
    };
  };
  Earnings?: {
    History?: Earnings[];
    Trend?: Earnings[];
    Annual?: Earnings[];
  };
  ETF?: ETFData;
  MutualFund?: MutualFundData;
  outstandingShares?: {
    annual?: OutstandingShares[];
    quarterly?: OutstandingShares[];
  };
  InsiderTransactions?: FundamentalInsiderTransaction[];
  AnalystRatings?: AnalystRatings[];
  ESGScores?: ESGScores;
}

/**
 * Fundamental Data Parameters
 */
export interface FundamentalParams {
  filter?: string; // Comma-separated list of sections to return
}