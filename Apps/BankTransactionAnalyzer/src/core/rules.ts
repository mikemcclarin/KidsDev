import type { Transaction, Rule, TransactionType, MerchantEntry, AccountType } from './types';
import { scoreDerivedCategory, scoreCsvCategory, resolveCategory } from './categoryScoring';

// ─── Transaction Type Detection ─────────────────────────────────────

const TRANSFER_KEYWORDS = [
  'zelle', 'venmo', 'paypal', 'cash app', 'square cash',
  'wire', 'transfer', 'xfer', 'ach',
];

const FEE_KEYWORDS = [
  'fee', 'service charge', 'overdraft', 'nsf', 'interest charge',
  'annual fee', 'late fee', 'maintenance fee',
];

const ATM_KEYWORDS = ['atm', 'cash withdrawal', 'cash deposit'];

const INCOME_KEYWORDS = [
  'payroll', 'direct dep', 'salary', 'wage', 'employer',
  'tax refund', 'irs', 'soc sec', 'social security',
  'pension', 'retirement',
];

const REWARD_KEYWORDS = [
  'reward', 'cashback', 'cash back', 'points', 'rebate',
  'dividend', 'statement credit',
];

/**
 * Detect the transaction type from description, amount, and account type.
 * Credit card accounts follow different rules: credits are never income,
 * and debits with transfer keywords are still purchases (not transfers).
 */
export function detectTransactionType(
  rawDescription: string,
  amountSigned: number,
  accountType: AccountType = 'unknown',
  merchantCategory?: string
): TransactionType {
  const upper = rawDescription.toUpperCase();
  const isCC = accountType === 'credit_card';

  // ATM and fee detection applies to both account types
  if (ATM_KEYWORDS.some((k) => upper.includes(k.toUpperCase()))) return 'atm';
  if (FEE_KEYWORDS.some((k) => upper.includes(k.toUpperCase()))) return 'fee';

  if (REWARD_KEYWORDS.some((k) => upper.includes(k.toUpperCase())) && amountSigned > 0) {
    return 'reward';
  }

  if (amountSigned > 0) {
    // Refund keywords apply to both account types
    if (/\b(REFUND|RETURN|REVERSAL|REBATE|ADJUSTMENT)\b/.test(upper)) {
      return 'refund';
    }

    if (isCC) {
      // On a CC, a positive amount is a payment made to the card or a statement credit.
      // It is never income. Use 'payment' when a payment keyword is present.
      if (/\b(PAYMENT|PYMT|PMT)\b/.test(upper)) return 'payment';
      // "CREDIT" alone on a CC (e.g. "MERCHANDISE CREDIT") is a refund
      if (/\bCREDIT\b/.test(upper)) return 'refund';
      return 'unknown';
    }

    // Bank: income keywords take priority over transfer
    // (e.g., "ACH DEPOSIT EMPLOYER PAYROLL" has ACH but is income, not transfer)
    if (INCOME_KEYWORDS.some((k) => upper.includes(k.toUpperCase()))) return 'income';

    if (TRANSFER_KEYWORDS.some((k) => upper.includes(k.toUpperCase()))) return 'transfer';
    if (merchantCategory === 'Transfer') return 'transfer';

    // Bank fallback: positive = income
    if (/\bCREDIT\b/.test(upper)) return 'refund';
    return 'income';
  }

  // Negative amount path
  if (isCC) {
    // CC debits are charges — never transfers out, regardless of keywords
    if (/\b(PAYMENT|PYMT|PMT)\b/.test(upper)) return 'payment';
    return 'purchase';
  }

  // Bank: transfer keywords on negative amounts = transfer out
  if (TRANSFER_KEYWORDS.some((k) => upper.includes(k.toUpperCase()))) return 'transfer';
  if (merchantCategory === 'Transfer') return 'transfer';

  if (/\b(PAYMENT|PYMT|PMT)\b/.test(upper)) return 'payment';

  return 'purchase';
}

// ─── Category Rule Engine ───────────────────────────────────────────

/**
 * Apply user-defined rules to a transaction (ordered by priority).
 * Returns the first matching rule's action, or null.
 */
export function applyRules(
  transaction: Transaction,
  rules: Rule[]
): { category?: string; type?: TransactionType } | null {
  const sorted = [...rules]
    .filter((r) => r.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    if (matchesRule(transaction, rule)) {
      return rule.action;
    }
  }
  return null;
}

function matchesRule(transaction: Transaction, rule: Rule): boolean {
  const { match } = rule;

  if (match.merchant) {
    if (transaction.merchant_canonical.toUpperCase() !== match.merchant.toUpperCase()) {
      return false;
    }
  }

  if (match.keyword) {
    const upper = transaction.raw_description.toUpperCase();
    if (!upper.includes(match.keyword.toUpperCase())) {
      return false;
    }
  }

  if (match.regex) {
    try {
      const re = new RegExp(match.regex, 'i');
      if (!re.test(transaction.raw_description)) {
        return false;
      }
    } catch {
      return false; // invalid regex, skip
    }
  }

  if (match.amount_min !== undefined) {
    if (Math.abs(transaction.amount_signed) < match.amount_min) return false;
  }
  if (match.amount_max !== undefined) {
    if (Math.abs(transaction.amount_signed) > match.amount_max) return false;
  }

  return true;
}

// ─── Full Categorization Pipeline ───────────────────────────────────

/**
 * Categorize all transactions using a dual-score system:
 * 1. User rules (highest priority, confidence 1.0)
 * 2. Structural types (transfer, fee, income, etc. — unambiguous, confidence 0.95)
 * 3. Dual-score: Derived Category Confidence (merchant + keywords)
 *    vs. CSV Category Confidence (from CSV's own category column)
 */
export function categorizeAll(
  transactions: Transaction[],
  rules: Rule[],
  merchantDictionary: MerchantEntry[],
  accountType: AccountType = 'unknown'
): Transaction[] {
  const merchantMap = new Map<string, MerchantEntry>();
  for (const m of merchantDictionary) {
    merchantMap.set(m.canonical_name.toUpperCase(), m);
  }

  return transactions.map((t) => {
    // 1. User rules ALWAYS take highest priority (no scoring needed)
    const ruleResult = applyRules(t, rules);
    if (ruleResult?.category) {
      return {
        ...t,
        category: ruleResult.category,
        category_confidence: 1.0,
        type: ruleResult.type ?? t.type,
      };
    }

    // 2. Detect transaction type (account_type-aware)
    const merchant = merchantMap.get(t.merchant_canonical.toUpperCase());
    const merchantCategory = merchant?.default_category;
    const type = detectTransactionType(t.raw_description, t.amount_signed, accountType, merchantCategory);

    // 3. For structural types, use type-based category without scoring
    //    (these are unambiguous signals regardless of CSV category)
    if (['transfer', 'fee', 'income', 'atm', 'reward', 'payment'].includes(type)) {
      let category: string;
      switch (type) {
        case 'transfer': category = 'Transfer'; break;
        case 'fee': category = 'Fees/Interest'; break;
        case 'income': category = 'Income'; break;
        case 'atm': category = 'ATM/Cash'; break;
        case 'reward': category = 'Income'; break;
        case 'payment':
          category = accountType === 'credit_card' ? 'CC Payment' : 'Other';
          break;
        default: category = 'Other';
      }
      return { ...t, category, category_confidence: 0.95, type };
    }

    // 4. For purchases/refunds/unknown: apply dual-score system
    const derivedScore = scoreDerivedCategory(t, merchantDictionary);
    const csvScore = scoreCsvCategory(t.csv_category, derivedScore);
    const resolved = resolveCategory(derivedScore, csvScore);

    return {
      ...t,
      category: resolved.category,
      category_confidence: resolved.confidence,
      type,
    };
  });
}
