import Papa from 'papaparse';
import type { RawRow, AccountType } from './types';

export interface ParseResult {
  headers: string[];
  rows: RawRow[];
  errors: string[];
}

/**
 * Parse a CSV file (or string) into raw rows using PapaParse.
 * Returns headers, rows, and any parse errors.
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as RawRow[];
        const errors = results.errors.map(
          (e) => `Row ${e.row}: ${e.message}`
        );
        resolve({ headers, rows, errors });
      },
      error(err: Error) {
        resolve({ headers: [], rows: [], errors: [err.message] });
      },
    });
  });
}

export function parseCSVString(csv: string): ParseResult {
  const results = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  return {
    headers: results.meta.fields ?? [],
    rows: results.data as RawRow[],
    errors: results.errors.map((e) => `Row ${e.row}: ${e.message}`),
  };
}

/**
 * Auto-detect column mapping based on common header names.
 * Returns a best-guess mapping or null if too ambiguous.
 */
export function detectColumnMapping(
  headers: string[]
): { date: string; description: string; amount?: string; debit?: string; credit?: string } | null {
  const lower = headers.map((h) => h.toLowerCase().trim());

  const datePatterns = ['date', 'transaction date', 'posting date', 'trans date', 'posted date'];
  const descPatterns = ['description', 'memo', 'transaction description', 'details', 'narrative', 'payee'];
  const amountPatterns = ['amount', 'transaction amount'];
  const debitPatterns = ['debit', 'withdrawals', 'withdrawal', 'debit amount'];
  const creditPatterns = ['credit', 'deposits', 'deposit', 'credit amount'];
  const categoryPatterns = ['category', 'transaction category', 'merchant category', 'category description'];

  const find = (patterns: string[]) => {
    for (const p of patterns) {
      const idx = lower.indexOf(p);
      if (idx !== -1) return headers[idx];
    }
    return undefined;
  };

  const date = find(datePatterns);
  const description = find(descPatterns);
  if (!date || !description) return null;

  const amount = find(amountPatterns);
  const debit = find(debitPatterns);
  const credit = find(creditPatterns);
  const category = find(categoryPatterns);

  if (!amount && !debit && !credit) return null;

  return { date, description, amount, debit, credit, ...(category ? { category } : {}) };
}

// ─── Account Type Detection ──────────────────────────────────────────

export interface AccountTypeDetection {
  type: AccountType;
  confidence: 'high' | 'low';
  reasons: string[];
}

// Header names that strongly indicate a credit card export
const CC_HEADER_SIGNALS = [
  'credit limit', 'available credit', 'card number',
  'minimum payment', 'minimum payment due', 'statement balance',
];

// Header names that strongly indicate a bank/checking/savings export
const BANK_HEADER_SIGNALS = [
  'check number', 'running balance', 'available balance',
  'routing', 'account balance',
];

// Description patterns found in credit card transaction exports
const CC_DESC_SIGNALS: { pattern: RegExp; label: string }[] = [
  { pattern: /PAYMENT\s*-?\s*THANK\s*YOU/i, label: 'payment confirmation text' },
  { pattern: /AUTOPAY/i, label: 'autopay reference' },
  { pattern: /PURCHASE\s*INTEREST|INTEREST\s*CHARGE/i, label: 'interest charge' },
  { pattern: /ANNUAL\s*FEE/i, label: 'annual fee' },
  { pattern: /CASH\s*ADVANCE\s*FEE/i, label: 'cash advance fee' },
  { pattern: /FOREIGN\s*TRANSACTION\s*FEE/i, label: 'foreign transaction fee' },
  { pattern: /MINIMUM\s*PAYMENT\s*DUE/i, label: 'minimum payment due' },
  { pattern: /LATE\s*FEE/i, label: 'late fee' },
];

// Description patterns found in bank/checking/savings transaction exports
const BANK_DESC_SIGNALS: { pattern: RegExp; label: string }[] = [
  { pattern: /DIRECT\s*DEPOSIT/i, label: 'direct deposit' },
  { pattern: /PAYROLL/i, label: 'payroll deposit' },
  { pattern: /CHECK\s+\d+/i, label: 'check number reference' },
  { pattern: /ACH\s*CREDIT/i, label: 'ACH credit' },
  { pattern: /WIRE\s*(TRANSFER|CREDIT|DEPOSIT)/i, label: 'wire transfer' },
  { pattern: /ATM\s*WITHDRAWAL/i, label: 'ATM withdrawal' },
  { pattern: /OVERDRAFT/i, label: 'overdraft' },
];

/**
 * Detect whether a CSV is from a credit card or bank account.
 * Scans headers first (strong signal), then transaction descriptions (fallback).
 * Confidence is 'high' when one side leads by ≥2 points, 'low' otherwise.
 */
export function detectAccountType(
  headers: string[],
  sampleRows: RawRow[]
): AccountTypeDetection {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const reasons: string[] = [];
  let ccScore = 0;
  let bankScore = 0;

  // Phase 1: Header scan
  for (const signal of CC_HEADER_SIGNALS) {
    if (lowerHeaders.some((h) => h.includes(signal))) {
      ccScore++;
      reasons.push(`Header column "${signal}" found`);
    }
  }
  for (const signal of BANK_HEADER_SIGNALS) {
    if (lowerHeaders.some((h) => h.includes(signal))) {
      bankScore++;
      reasons.push(`Header column "${signal}" found`);
    }
  }

  // Phase 2: Description content scan (all string values from sample rows)
  const allValues = sampleRows
    .slice(0, 100)
    .flatMap((row) => Object.values(row))
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 5);

  const ccMatches: string[] = [];
  const bankMatches: string[] = [];

  for (const { pattern, label } of CC_DESC_SIGNALS) {
    if (allValues.some((v) => pattern.test(v))) {
      ccScore++;
      ccMatches.push(label);
    }
  }
  for (const { pattern, label } of BANK_DESC_SIGNALS) {
    if (allValues.some((v) => pattern.test(v))) {
      bankScore++;
      bankMatches.push(label);
    }
  }

  if (ccMatches.length > 0) {
    reasons.push(`Credit card patterns in transactions: ${ccMatches.join(', ')}`);
  }
  if (bankMatches.length > 0) {
    reasons.push(`Bank patterns in transactions: ${bankMatches.join(', ')}`);
  }

  const margin = Math.abs(ccScore - bankScore);
  const confidence: 'high' | 'low' = margin >= 2 ? 'high' : 'low';

  if (ccScore > bankScore) {
    return { type: 'credit_card', confidence, reasons };
  }
  if (bankScore > ccScore) {
    return { type: 'bank', confidence, reasons };
  }
  return { type: 'unknown', confidence: 'low', reasons };
}

/**
 * Generate a "format signature" from headers to identify bank CSV formats.
 */
export function formatSignature(headers: string[]): string {
  return headers
    .map((h) => h.toLowerCase().trim())
    .sort()
    .join('|');
}
