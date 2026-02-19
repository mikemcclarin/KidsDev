import type { Transaction, RefundSettings } from './types';
import { textSimilarity } from './merchant';

/**
 * Detect refunds/returns and link them to original purchases.
 *
 * Strategy:
 * 1. Identify credit transactions that look like refunds (positive amount,
 *    refund/return keywords OR merchant overlap with a debit).
 * 2. For each candidate refund, find the best matching purchase within the
 *    time window using amount proximity + merchant text similarity.
 * 3. Handle partial refunds (refund amount <= purchase amount).
 * 4. Exclude rewards/cashback/transfers from refund classification.
 */

interface RefundCandidate {
  transaction: Transaction;
  index: number;
}

interface PurchaseCandidate {
  transaction: Transaction;
  index: number;
  remaining_amount: number; // tracks how much of purchase is "un-refunded"
}

/**
 * Check if a positive-amount transaction is likely a refund (not income/reward/transfer).
 */
export function isLikelyRefund(t: Transaction): boolean {
  if (t.amount_signed <= 0) return false;

  // Already classified as non-refund types
  if (['income', 'transfer', 'reward', 'fee'].includes(t.type)) return false;

  const upper = t.raw_description.toUpperCase();

  // Explicit refund keywords
  if (/\b(REFUND|RETURN|REVERSAL|CREDIT ADJ|MERCHANDISE CREDIT|PRICE ADJ)\b/.test(upper)) {
    return true;
  }

  // If type was detected as 'refund' by rules module
  if (t.type === 'refund') return true;

  return false;
}

/**
 * Check if a positive-amount transaction COULD be a refund based on
 * merchant similarity to known purchases (used for non-keyword matches).
 */
export function couldBeRefund(
  credit: Transaction,
  purchases: Transaction[],
  settings: RefundSettings
): boolean {
  if (credit.amount_signed <= 0) return false;
  if (['income', 'transfer', 'reward', 'fee', 'atm'].includes(credit.type)) return false;

  // Check if there's a purchase with similar merchant within time window
  for (const p of purchases) {
    if (p.amount_signed >= 0) continue;
    const daysDiff = dateDiffDays(p.date, credit.date);
    if (daysDiff < 0 || daysDiff > settings.days_window) continue;

    const sim = textSimilarity(credit.merchant_canonical, p.merchant_canonical);
    if (sim >= settings.match_threshold) {
      const amtDiff = Math.abs(credit.amount_signed - Math.abs(p.amount_signed));
      const tolerance = Math.abs(p.amount_signed) * settings.amount_tolerance;
      if (amtDiff <= tolerance || credit.amount_signed <= Math.abs(p.amount_signed)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate the difference in days between two ISO date strings.
 * Returns positive if date2 is after date1.
 */
export function dateDiffDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Score how well a refund candidate matches a purchase.
 * Higher score = better match. Returns 0 if not a viable match.
 */
export function scoreRefundMatch(
  refund: Transaction,
  purchase: Transaction,
  settings: RefundSettings
): number {
  // Must be credit vs debit
  if (refund.amount_signed <= 0 || purchase.amount_signed >= 0) return 0;

  // Time window check
  const daysDiff = dateDiffDays(purchase.date, refund.date);
  if (daysDiff < 0 || daysDiff > settings.days_window) return 0;

  // Amount check: refund should be <= purchase amount (allow tolerance for full refunds)
  const purchaseAmt = Math.abs(purchase.amount_signed);
  const refundAmt = refund.amount_signed;
  if (refundAmt > purchaseAmt * (1 + settings.amount_tolerance)) return 0;

  // Merchant similarity
  const merchantSim = textSimilarity(
    refund.merchant_canonical,
    purchase.merchant_canonical
  );
  if (merchantSim < settings.match_threshold) return 0;

  // Score components (weighted)
  const amountScore = 1 - Math.abs(refundAmt - purchaseAmt) / Math.max(purchaseAmt, 1);
  const timeScore = 1 - daysDiff / settings.days_window;
  const merchantScore = merchantSim;

  return amountScore * 0.4 + timeScore * 0.2 + merchantScore * 0.4;
}

/**
 * Main refund detection and linking.
 * Mutates transaction types and linked_transaction_ids.
 */
export function linkRefunds(
  transactions: Transaction[],
  settings: RefundSettings
): Transaction[] {
  const result = transactions.map((t) => ({ ...t }));

  // Separate purchases and potential refunds
  const purchases: PurchaseCandidate[] = [];
  const refundCandidates: RefundCandidate[] = [];

  for (let i = 0; i < result.length; i++) {
    const t = result[i];
    if (t.amount_signed < 0 && t.type === 'purchase') {
      purchases.push({ transaction: t, index: i, remaining_amount: Math.abs(t.amount_signed) });
    }
    if (t.amount_signed > 0 && (isLikelyRefund(t) || couldBeRefund(t, result, settings))) {
      refundCandidates.push({ transaction: t, index: i });
    }
  }

  // Sort refund candidates by date (process earliest first)
  refundCandidates.sort((a, b) => a.transaction.date.localeCompare(b.transaction.date));

  // For each refund candidate, find best matching purchase
  for (const rc of refundCandidates) {
    let bestScore = 0;
    let bestPurchaseIdx = -1;

    for (let pi = 0; pi < purchases.length; pi++) {
      const pc = purchases[pi];
      if (pc.remaining_amount <= 0) continue; // fully refunded already

      const score = scoreRefundMatch(rc.transaction, pc.transaction, settings);
      if (score > bestScore) {
        bestScore = score;
        bestPurchaseIdx = pi;
      }
    }

    if (bestPurchaseIdx >= 0 && bestScore > 0) {
      const pc = purchases[bestPurchaseIdx];

      // Link the refund to the purchase
      result[rc.index] = {
        ...result[rc.index],
        type: 'refund',
        linked_transaction_id: pc.transaction.id,
        category: result[pc.index].category, // inherit purchase category
      };

      // Track partial refund
      pc.remaining_amount -= rc.transaction.amount_signed;
    } else if (isLikelyRefund(rc.transaction)) {
      // Has refund keywords but no match — still mark as refund
      result[rc.index] = { ...result[rc.index], type: 'refund' };
    }
  }

  return result;
}
