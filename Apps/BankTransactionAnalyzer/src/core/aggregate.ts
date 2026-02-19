import type { Transaction, CategorySummary, MerchantSummary, MonthlyTrend } from './types';

/**
 * Group transactions by category and compute totals.
 * Only includes purchases/fees (negative amounts) by default.
 */
export function summarizeByCategory(
  transactions: Transaction[],
  includeRefunds = false
): CategorySummary[] {
  const map = new Map<string, { total: number; count: number; txns: Transaction[] }>();

  for (const t of transactions) {
    if (!includeRefunds && t.type === 'refund') continue;
    if (t.type === 'transfer' || t.type === 'income') continue;

    const cat = t.category || 'Other';
    const entry = map.get(cat) ?? { total: 0, count: 0, txns: [] };
    entry.total += t.amount_signed;
    entry.count += 1;
    entry.txns.push(t);
    map.set(cat, entry);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      transactions: data.txns,
    }))
    .sort((a, b) => a.total - b.total); // most spent first (most negative)
}

/**
 * Group transactions by merchant and compute totals.
 */
export function summarizeByMerchant(
  transactions: Transaction[]
): MerchantSummary[] {
  const map = new Map<string, { total: number; count: number; category: string }>();

  for (const t of transactions) {
    if (t.type === 'transfer' || t.type === 'income') continue;
    const merchant = t.merchant_canonical || 'Unknown';
    const entry = map.get(merchant) ?? { total: 0, count: 0, category: t.category };
    entry.total += t.amount_signed;
    entry.count += 1;
    map.set(merchant, entry);
  }

  return Array.from(map.entries())
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      category: data.category,
    }))
    .sort((a, b) => a.total - b.total);
}

/**
 * Monthly spending trend grouped by category.
 */
export function monthlyTrends(transactions: Transaction[]): MonthlyTrend[] {
  const map = new Map<string, Record<string, number>>();

  for (const t of transactions) {
    if (t.type === 'transfer' || t.type === 'income') continue;
    const month = t.date.slice(0, 7); // YYYY-MM
    const cat = t.category || 'Other';
    if (!map.has(month)) map.set(month, {});
    const totals = map.get(month)!;
    totals[cat] = (totals[cat] ?? 0) + t.amount_signed;
  }

  return Array.from(map.entries())
    .map(([month, totals]) => {
      // Round values
      const rounded: Record<string, number> = {};
      for (const [k, v] of Object.entries(totals)) {
        rounded[k] = Math.round(v * 100) / 100;
      }
      return { month, totals: rounded };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Net cash flow by month (income - spending).
 */
export function monthlyCashFlow(
  transactions: Transaction[]
): { month: string; income: number; spending: number; net: number }[] {
  const map = new Map<string, { income: number; spending: number }>();

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const month = t.date.slice(0, 7);
    const entry = map.get(month) ?? { income: 0, spending: 0 };
    if (t.amount_signed > 0) {
      entry.income += t.amount_signed;
    } else {
      entry.spending += Math.abs(t.amount_signed);
    }
    map.set(month, entry);
  }

  return Array.from(map.entries())
    .map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      spending: Math.round(data.spending * 100) / 100,
      net: Math.round((data.income - data.spending) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
