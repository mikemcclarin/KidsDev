/** Core data models for the Bank Transaction Analyzer */

export type AccountType = 'bank' | 'credit_card' | 'unknown';

export type TransactionType =
  | 'purchase'
  | 'refund'
  | 'transfer'
  | 'fee'
  | 'income'
  | 'reward'
  | 'payment'
  | 'atm'
  | 'unknown';

export interface Transaction {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount_signed: number; // negative = outflow, positive = inflow
  raw_description: string;
  merchant_canonical: string;
  merchant_confidence: number; // 0-1
  category: string;
  category_confidence?: number; // 0-1, confidence of final category assignment
  csv_category?: string; // raw category from CSV, if present
  type: TransactionType;
  account_type: AccountType;
  linked_transaction_id?: string; // for refund->purchase linking
  tags: string[];
  /** Original row index from CSV for stable reference */
  source_row: number;
}

export interface RawRow {
  [key: string]: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount?: string; // single signed amount column
  debit?: string; // separate debit column (positive = outflow)
  credit?: string; // separate credit column (positive = inflow)
  category?: string; // optional CSV category column
}

export interface CategoryScore {
  category: string;
  confidence: number; // 0-1
}

export interface BankFormatSignature {
  id: string;
  name: string;
  columns: string[]; // header names from CSV
  mapping: ColumnMapping;
  account_type?: AccountType;
}

export interface MerchantEntry {
  canonical_name: string;
  aliases: string[]; // exact match after normalization
  patterns: RegExp[]; // regex patterns serialized as strings for storage
  pattern_strings: string[]; // string form of patterns for persistence
  default_category: string;
  metadata?: {
    website?: string;
    logo_url?: string;
  };
}

export type RuleMatchType = 'merchant' | 'keyword' | 'regex' | 'amount_range';

export interface RuleMatch {
  merchant?: string;
  keyword?: string;
  regex?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface RuleAction {
  category?: string;
  type?: TransactionType;
}

export interface Rule {
  id: string;
  enabled: boolean;
  priority: number; // lower = higher priority
  name: string;
  match: RuleMatch;
  action: RuleAction;
}

export interface RefundSettings {
  /** Max days between purchase and refund to consider linking */
  days_window: number;
  /** Fractional tolerance for amount matching (0.05 = 5%) */
  amount_tolerance: number;
  /** Minimum text similarity score (0-1) to consider merchant match */
  match_threshold: number;
}

export const DEFAULT_REFUND_SETTINGS: RefundSettings = {
  days_window: 90,
  amount_tolerance: 0.05,
  match_threshold: 0.4,
};

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export interface MerchantSummary {
  merchant: string;
  total: number;
  count: number;
  category: string;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  totals: Record<string, number>; // category -> total
}

export const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining',
  'Transportation',
  'Gas',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Insurance',
  'Rent/Mortgage',
  'Subscriptions',
  'Travel',
  'Education',
  'Personal Care',
  'Pets',
  'Home Improvement',
  'Gifts/Donations',
  'Fees/Interest',
  'Income',
  'Transfer',
  'Refund',
  'ATM/Cash',
  'CC Payment',
  'Other',
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];
