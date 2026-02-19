import type { Transaction, MerchantEntry, CategoryScore } from './types';
import { DEFAULT_CATEGORIES } from './types';
import { matchMerchant, canonicalize } from './merchant';
import { keywordCategorize } from './keywords';

// ─── CSV Category Mapping ─────────────────────────────────────────
// Maps common CSV category strings (lowercase) to our internal categories.
export const CSV_CATEGORY_MAP: Record<string, string> = {
  'dining': 'Dining',
  'restaurants': 'Dining',
  'food & drink': 'Dining',
  'food and drink': 'Dining',
  'gas/automotive': 'Gas',
  'gas': 'Gas',
  'gasoline': 'Gas',
  'automotive': 'Gas',
  'fuel': 'Gas',
  'merchandise': 'Shopping',
  'shopping': 'Shopping',
  'retail': 'Shopping',
  'entertainment': 'Entertainment',
  'health care': 'Healthcare',
  'healthcare': 'Healthcare',
  'medical': 'Healthcare',
  'insurance': 'Insurance',
  'lodging': 'Travel',
  'travel': 'Travel',
  'other travel': 'Travel',
  'airlines': 'Travel',
  'hotel': 'Travel',
  'groceries': 'Groceries',
  'supermarkets': 'Groceries',
  'education': 'Education',
  'utilities': 'Utilities',
  'phone/cable': 'Utilities',
  'personal care': 'Personal Care',
  'home improvement': 'Home Improvement',
  'home': 'Home Improvement',
  'pets': 'Pets',
  'gifts': 'Gifts/Donations',
  'charitable giving': 'Gifts/Donations',
  'fees': 'Fees/Interest',
  'interest': 'Fees/Interest',
  'fees/interest': 'Fees/Interest',
  'other services': 'Other',
  'other': 'Other',
  'payment/credit': 'CC Payment',
  'payment': 'CC Payment',
  'professional services': 'Other',
  'government services': 'Other',
  'subscriptions': 'Subscriptions',
  'transportation': 'Transportation',
  'transfer': 'Transfer',
};

// ─── CSV Category Base Confidence ──────────────────────────────────
// Specific categories = high base confidence; vague ones = low
const CSV_CATEGORY_BASE_CONFIDENCE: Record<string, number> = {
  'Dining': 0.85,
  'Gas': 0.90,
  'Insurance': 0.90,
  'Healthcare': 0.85,
  'Travel': 0.80,
  'Groceries': 0.85,
  'Entertainment': 0.80,
  'Education': 0.85,
  'Utilities': 0.80,
  'Personal Care': 0.75,
  'Pets': 0.85,
  'Home Improvement': 0.75,
  'Subscriptions': 0.80,
  'Gifts/Donations': 0.70,
  'Transportation': 0.75,
  'CC Payment': 0.85,
  'Fees/Interest': 0.70,
  'Transfer': 0.70,
  // Vague categories
  'Shopping': 0.40,
  'Other': 0.25,
};

const DEFAULT_CSV_BASE_CONFIDENCE = 0.50;

// ─── Multi-Category Merchants ──────────────────────────────────────
// These merchants sell across many categories; their DCC is capped
// so the more-specific CSV category can win.
export const MULTI_CATEGORY_MERCHANTS = new Set([
  'Amazon', 'Walmart', 'Target', 'Costco', 'PayPal', "Sam's Club",
]);

const MULTI_CATEGORY_DCC_CAP = 0.45;

// ─── Score 1: Derived Category Confidence (DCC) ────────────────────

/**
 * Score a transaction's category using merchant dictionary + keyword analysis.
 * Returns the best-guess category and a confidence 0-1.
 */
export function scoreDerivedCategory(
  transaction: Transaction,
  merchantDictionary: MerchantEntry[]
): CategoryScore {
  const canonicalized = canonicalize(transaction.raw_description);
  const merchantMatch = matchMerchant(canonicalized, merchantDictionary);

  let category = '';
  let confidence = 0.0;

  if (merchantMatch) {
    category = merchantMatch.merchant.default_category;
    switch (merchantMatch.match_type) {
      case 'exact':
        confidence = 0.95;
        break;
      case 'pattern':
        confidence = 0.85;
        break;
      case 'fuzzy':
        confidence = 0.70;
        break;
    }

    // Cap multi-category merchants
    if (MULTI_CATEGORY_MERCHANTS.has(merchantMatch.merchant.canonical_name)) {
      confidence = Math.min(confidence, MULTI_CATEGORY_DCC_CAP);
    }
  }

  // Try keyword matching
  const keywordResult = keywordCategorize(transaction.raw_description);

  if (keywordResult) {
    if (!merchantMatch || keywordResult.confidence > confidence) {
      // Keyword beats merchant (or no merchant match)
      category = keywordResult.category;
      confidence = keywordResult.confidence;
    } else if (merchantMatch && keywordResult.category === category) {
      // Agreement: small boost
      confidence = Math.min(confidence + 0.05, 0.95);
    }
    // If keyword disagrees with a stronger merchant match, merchant wins
  }

  if (!category) {
    return { category: '', confidence: 0.0 };
  }

  return { category, confidence };
}

// ─── Score 2: CSV Category Confidence (CCC) ────────────────────────

/**
 * Score the CSV's own category column, adjusted by how much it
 * agrees or conflicts with the derived category.
 */
export function scoreCsvCategory(
  csvCategory: string | undefined,
  derivedResult: CategoryScore
): CategoryScore | null {
  if (!csvCategory || csvCategory.trim() === '') return null;

  const lowerCsv = csvCategory.toLowerCase().trim();

  // Try our mapping first
  let mapped = CSV_CATEGORY_MAP[lowerCsv];

  // If not in map, try direct match against DEFAULT_CATEGORIES (case-insensitive)
  if (!mapped) {
    const directMatch = DEFAULT_CATEGORIES.find(
      (c) => c.toLowerCase() === lowerCsv
    );
    if (directMatch) {
      mapped = directMatch;
    }
  }

  if (!mapped) return null;

  const baseConfidence = CSV_CATEGORY_BASE_CONFIDENCE[mapped] ?? DEFAULT_CSV_BASE_CONFIDENCE;

  let adjustedConfidence: number;

  if (derivedResult.confidence === 0 || !derivedResult.category) {
    // DCC has no signal — CCC stays as-is
    adjustedConfidence = baseConfidence;
  } else if (derivedResult.category === mapped) {
    // Agreement — boost CCC
    adjustedConfidence = Math.min(baseConfidence * 1.1, 0.95);
  } else if (derivedResult.confidence > 0.8) {
    // Strong DCC conflict — penalize CCC heavily
    adjustedConfidence = baseConfidence * 0.4;
  } else {
    // Mild DCC conflict — moderate penalty
    adjustedConfidence = baseConfidence * 0.6;
  }

  return { category: mapped, confidence: adjustedConfidence };
}

// ─── Final Resolution ──────────────────────────────────────────────

/**
 * Resolve the final category from derived and CSV scores.
 * Higher confidence wins; ties go to CSV.
 * If both are below 0.30, result is "Other".
 */
export function resolveCategory(
  derivedScore: CategoryScore,
  csvScore: CategoryScore | null
): CategoryScore {
  const dcc = derivedScore;
  const ccc = csvScore;

  // If no CSV score, use derived
  if (!ccc) {
    if (dcc.confidence < 0.30 || !dcc.category) {
      return { category: 'Other', confidence: dcc.confidence || 0 };
    }
    return dcc;
  }

  // If no derived score, use CSV
  if (dcc.confidence === 0 || !dcc.category) {
    if (ccc.confidence < 0.30) {
      return { category: 'Other', confidence: ccc.confidence };
    }
    return ccc;
  }

  // Both have signals — higher confidence wins, tie goes to CSV
  if (ccc.confidence >= dcc.confidence) {
    return ccc;
  }

  return dcc;
}
