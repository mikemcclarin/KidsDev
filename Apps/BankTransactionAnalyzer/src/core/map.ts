import { v4 as uuidv4 } from 'uuid';
import type { RawRow, ColumnMapping, Transaction, AccountType } from './types';

/**
 * Parse a date string into ISO YYYY-MM-DD format.
 * Handles MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD, and M/D/YY variants.
 */
export function parseDate(raw: string): string {
  const trimmed = raw.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdyFull = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdyFull) {
    const [, m, d, y] = mdyFull;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // MM/DD/YY
  const mdyShort = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (mdyShort) {
    const [, m, d, y] = mdyShort;
    const fullYear = parseInt(y) > 50 ? `19${y}` : `20${y}`;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: let JS parse it
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return trimmed; // return as-is if unparseable
}

/**
 * Parse an amount string to a number.
 * Handles: "$1,234.56", "(1234.56)" (parens = negative), "-1234.56", "1234.56"
 */
export function parseAmount(raw: string): number {
  let s = raw.trim();
  const isParensNeg = s.startsWith('(') && s.endsWith(')');
  if (isParensNeg) s = s.slice(1, -1);
  s = s.replace(/[$,\s]/g, '');
  let num = parseFloat(s);
  if (isNaN(num)) return 0;
  if (isParensNeg) num = -num;
  return num;
}

/**
 * Map raw CSV rows to Transaction objects using the provided column mapping.
 * Produces unsigned-amount Transactions; signing is based on debit/credit or
 * the sign of a single amount column (negative = outflow/purchase).
 */
export function mapRows(
  rows: RawRow[],
  mapping: ColumnMapping,
  accountType: AccountType = 'unknown'
): Transaction[] {
  return rows.map((row, index) => {
    const date = parseDate(row[mapping.date] ?? '');
    const rawDesc = (row[mapping.description] ?? '').trim();

    let amountSigned: number;
    if (mapping.amount) {
      amountSigned = parseAmount(row[mapping.amount] ?? '0');
    } else {
      const debit = parseAmount(row[mapping.debit!] ?? '0');
      const credit = parseAmount(row[mapping.credit!] ?? '0');
      // Debit = money out (negative), Credit = money in (positive)
      amountSigned = credit > 0 ? credit : -Math.abs(debit);
    }

    const csvCategory = mapping.category ? (row[mapping.category] ?? '').trim() : undefined;

    return {
      id: uuidv4(),
      date,
      amount_signed: amountSigned,
      raw_description: rawDesc,
      merchant_canonical: '', // filled by merchant module
      merchant_confidence: 0,
      category: '',           // filled by rules module
      csv_category: csvCategory || undefined,
      type: 'unknown' as const,
      account_type: accountType,
      tags: [],
      source_row: index,
    };
  });
}
