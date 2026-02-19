import type { MerchantEntry, Transaction } from './types';

// ─── Noise tokens to strip ───────────────────────────────────────────
const NOISE_TOKENS = new Set([
  'pos', 'visa', 'debit', 'credit', 'purchase', 'checkcard', 'check card',
  'ach', 'recurring', 'autopay', 'auto-pay', 'pin', 'non-pin',
  'pre-auth', 'preauth', 'pending', 'xxxx', 'sq', 'tst',
  'pymt', 'pmt', 'payment', 'online', 'web', 'mobile',
  'card', 'chk', 'dbt', 'crd', 'pos debit', 'pos purchase',
  'external', 'withdrawal', 'deposit',
]);

// Pattern for trailing reference numbers, dates, and location fragments
const TRAILING_PATTERNS = [
  /\b\d{4,}$/,                    // trailing long numbers
  /\b\d{2}\/\d{2}\b/,            // embedded dates MM/DD
  /\b[A-Z]{2}\s*\d{5}(-\d{4})?$/, // state+zip
  /\s+#\d+/,                      // store numbers like #1234
  /\s+\d+\s*$/,                   // trailing bare numbers
];

/**
 * Step 1: Canonicalize raw description — uppercase, strip noise, trim.
 */
export function canonicalize(raw: string): string {
  let s = raw.toUpperCase().trim();

  // Remove common prefixes (may need multiple passes)
  s = s.replace(/^(POS|VISA|DEBIT|CHECKCARD|CHECK CARD|ACH|RECURRING)\s+/gi, '');
  s = s.replace(/^(SQ\s*\*|TST\s*\*|PP\s*\*|PAYPAL\s*\*)/i, '');
  // Strip leading short numeric refs (e.g. "0116" date stamps after CHECKCARD)
  s = s.replace(/^\d{3,6}\s+/, '');

  // Strip noise tokens that appear as whole words
  const words = s.split(/\s+/);
  const filtered = words.filter((w) => !NOISE_TOKENS.has(w.toLowerCase()));
  s = filtered.join(' ');

  // Strip trailing patterns
  for (const pat of TRAILING_PATTERNS) {
    s = s.replace(pat, '');
  }

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // Remove trailing asterisks, hashes, dashes
  s = s.replace(/[\*#\-]+$/, '').trim();

  return s;
}

/**
 * Step 2: Extract useful tokens (store number, location, channel).
 */
export interface ExtractedTokens {
  store_number?: string;
  city?: string;
  state?: string;
  channel?: string; // 'online', 'in-store', 'app', etc.
}

export function extractTokens(raw: string): ExtractedTokens {
  const tokens: ExtractedTokens = {};

  const storeMatch = raw.match(/#(\d{2,6})/);
  if (storeMatch) tokens.store_number = storeMatch[1];

  // Look for state abbreviation near end
  const stateMatch = raw.match(/\b([A-Z]{2})\s*\d{5}/);
  if (stateMatch) tokens.state = stateMatch[1];

  // Channel detection
  const upper = raw.toUpperCase();
  if (/\bONLINE\b/.test(upper) || /\bWEB\b/.test(upper)) tokens.channel = 'online';
  else if (/\bAPP\b/.test(upper) || /\bMOBILE\b/.test(upper)) tokens.channel = 'app';
  else if (/\bPOS\b/.test(upper) || /\bIN.?STORE\b/.test(upper)) tokens.channel = 'in-store';

  return tokens;
}

/**
 * Simple bigram-based text similarity (Dice coefficient).
 */
export function textSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    const lower = s.toLowerCase();
    for (let i = 0; i < lower.length - 1; i++) {
      set.add(lower.slice(i, i + 2));
    }
    return set;
  };

  const setA = bigrams(a);
  const setB = bigrams(b);
  let intersection = 0;
  for (const bg of setA) {
    if (setB.has(bg)) intersection++;
  }
  return (2 * intersection) / (setA.size + setB.size);
}

/**
 * Step 3: Match canonicalized description against merchant dictionary.
 * Pipeline: (1) exact alias match, (2) pattern/regex match, (3) fuzzy match.
 */
export interface MerchantMatch {
  merchant: MerchantEntry;
  confidence: number; // 0-1
  match_type: 'exact' | 'pattern' | 'fuzzy';
}

export function matchMerchant(
  canonicalized: string,
  dictionary: MerchantEntry[]
): MerchantMatch | null {
  const canon = canonicalized.toUpperCase();

  // (1) Exact alias match
  for (const entry of dictionary) {
    for (const alias of entry.aliases) {
      if (canon === alias.toUpperCase()) {
        return { merchant: entry, confidence: 1.0, match_type: 'exact' };
      }
    }
  }

  // (2) Pattern / regex match
  for (const entry of dictionary) {
    for (const pattern of entry.patterns) {
      if (pattern.test(canon)) {
        return { merchant: entry, confidence: 0.9, match_type: 'pattern' };
      }
    }
  }

  // (3) Fuzzy match using text similarity
  let bestMatch: MerchantMatch | null = null;
  let bestScore = 0;

  for (const entry of dictionary) {
    // Compare against canonical name and all aliases
    const candidates = [entry.canonical_name, ...entry.aliases];
    for (const candidate of candidates) {
      const score = textSimilarity(canon, candidate.toUpperCase());
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { merchant: entry, confidence: score, match_type: 'fuzzy' };
      }
    }
  }

  // Only return fuzzy matches above threshold
  if (bestMatch && bestScore >= 0.5) {
    return bestMatch;
  }

  return null;
}

/**
 * Full merchant resolution pipeline for a single transaction.
 * Returns the canonical merchant name and confidence.
 */
export function resolveMerchant(
  rawDescription: string,
  dictionary: MerchantEntry[],
  userOverrides: Map<string, string> // raw_description -> canonical_name
): { canonical: string; confidence: number } {
  // Check user overrides first (highest priority)
  const override = userOverrides.get(rawDescription);
  if (override) {
    return { canonical: override, confidence: 1.0 };
  }

  const canonicalized = canonicalize(rawDescription);
  const match = matchMerchant(canonicalized, dictionary);

  if (match) {
    return {
      canonical: match.merchant.canonical_name,
      confidence: match.confidence,
    };
  }

  // No match — use canonicalized form as the merchant name
  return { canonical: canonicalized || rawDescription, confidence: 0.2 };
}

/**
 * Process all transactions through the merchant pipeline.
 */
export function resolveAllMerchants(
  transactions: Transaction[],
  dictionary: MerchantEntry[],
  userOverrides: Map<string, string>
): Transaction[] {
  return transactions.map((t) => {
    const { canonical, confidence } = resolveMerchant(
      t.raw_description,
      dictionary,
      userOverrides
    );
    return {
      ...t,
      merchant_canonical: canonical,
      merchant_confidence: confidence,
    };
  });
}

// ─── Built-in merchant dictionary seed ──────────────────────────────
export function createMerchantEntry(
  canonical_name: string,
  aliases: string[],
  pattern_strings: string[],
  default_category: string
): MerchantEntry {
  return {
    canonical_name,
    aliases,
    patterns: pattern_strings.map((p) => new RegExp(p, 'i')),
    pattern_strings,
    default_category,
  };
}

export const SEED_MERCHANTS: MerchantEntry[] = [
  createMerchantEntry('Amazon', ['AMAZON', 'AMZN', 'AMAZON.COM', 'AMAZON PRIME', 'AMAZON MKTPLACE', 'AMZN MKTP'], ['AMZN', 'AMAZON'], 'Shopping'),
  createMerchantEntry('Walmart', ['WALMART', 'WAL-MART', 'WM SUPERCENTER'], ['WAL.?MART', 'WM\\s+SUPERCENTER'], 'Groceries'),
  createMerchantEntry('Target', ['TARGET'], ['TARGET\\s'], 'Shopping'),
  createMerchantEntry('Costco', ['COSTCO', 'COSTCO WHSE', 'COSTCO WHOLESALE'], ['COSTCO'], 'Groceries'),
  createMerchantEntry('Kroger', ['KROGER'], ['KROGER'], 'Groceries'),
  createMerchantEntry('Whole Foods', ['WHOLE FOODS', 'WHOLEFDS'], ['WHOLE\\s*FOODS', 'WHOLEFDS'], 'Groceries'),
  createMerchantEntry('Trader Joe\'s', ['TRADER JOE', 'TRADER JOES'], ['TRADER\\s*JOE'], 'Groceries'),
  createMerchantEntry('Aldi', ['ALDI'], ['ALDI'], 'Groceries'),
  createMerchantEntry('Starbucks', ['STARBUCKS'], ['STARBUCKS'], 'Dining'),
  createMerchantEntry('McDonald\'s', ['MCDONALDS', 'MCDONALD\'S'], ['MCDONALD'], 'Dining'),
  createMerchantEntry('Chipotle', ['CHIPOTLE'], ['CHIPOTLE'], 'Dining'),
  createMerchantEntry('Chick-fil-A', ['CHICK-FIL-A', 'CHICKFILA'], ['CHICK.?FIL'], 'Dining'),
  createMerchantEntry('Subway', ['SUBWAY'], ['SUBWAY'], 'Dining'),
  createMerchantEntry('DoorDash', ['DOORDASH'], ['DOORDASH'], 'Dining'),
  createMerchantEntry('Uber Eats', ['UBER EATS', 'UBEREATS'], ['UBER\\s*EATS'], 'Dining'),
  createMerchantEntry('Grubhub', ['GRUBHUB'], ['GRUBHUB'], 'Dining'),
  createMerchantEntry('Shell', ['SHELL', 'SHELL OIL'], ['SHELL\\s*(OIL)?'], 'Gas'),
  createMerchantEntry('Chevron', ['CHEVRON'], ['CHEVRON'], 'Gas'),
  createMerchantEntry('ExxonMobil', ['EXXON', 'EXXONMOBIL', 'MOBIL'], ['EXXON', 'MOBIL'], 'Gas'),
  createMerchantEntry('BP', ['BP'], ['^BP\\s'], 'Gas'),
  createMerchantEntry('Netflix', ['NETFLIX'], ['NETFLIX'], 'Subscriptions'),
  createMerchantEntry('Spotify', ['SPOTIFY'], ['SPOTIFY'], 'Subscriptions'),
  createMerchantEntry('Apple', ['APPLE', 'APPLE.COM', 'APPLE.COM/BILL'], ['APPLE\\.COM', '^APPLE\\s'], 'Subscriptions'),
  createMerchantEntry('Google', ['GOOGLE', 'GOOGLE *'], ['GOOGLE\\s*\\*?'], 'Subscriptions'),
  createMerchantEntry('Disney+', ['DISNEY+', 'DISNEY PLUS', 'DISNEYPLUS'], ['DISNEY\\s*\\+?\\s*PLUS|DISNEYPLUS'], 'Subscriptions'),
  createMerchantEntry('Hulu', ['HULU'], ['HULU'], 'Subscriptions'),
  createMerchantEntry('HBO Max', ['HBO', 'HBO MAX'], ['HBO'], 'Subscriptions'),
  createMerchantEntry('YouTube Premium', ['YOUTUBE', 'YOUTUBE PREMIUM'], ['YOUTUBE\\s*PREMIUM'], 'Subscriptions'),
  createMerchantEntry('Uber', ['UBER', 'UBER TRIP'], ['UBER\\s*(TRIP)?$', '^UBER\\s+(?!EATS)'], 'Transportation'),
  createMerchantEntry('Lyft', ['LYFT'], ['LYFT'], 'Transportation'),
  createMerchantEntry('CVS', ['CVS', 'CVS PHARMACY'], ['CVS'], 'Healthcare'),
  createMerchantEntry('Walgreens', ['WALGREENS'], ['WALGREENS'], 'Healthcare'),
  createMerchantEntry('Home Depot', ['HOME DEPOT', 'THE HOME DEPOT'], ['HOME\\s*DEPOT'], 'Home Improvement'),
  createMerchantEntry('Lowe\'s', ['LOWES', 'LOWE\'S'], ['LOWE.?S'], 'Home Improvement'),
  createMerchantEntry('Venmo', ['VENMO'], ['VENMO'], 'Transfer'),
  createMerchantEntry('Zelle', ['ZELLE'], ['ZELLE'], 'Transfer'),
  createMerchantEntry('PayPal', ['PAYPAL'], ['PAYPAL'], 'Transfer'),
  createMerchantEntry('Cash App', ['CASH APP', 'SQUARE CASH'], ['CASH\\s*APP', 'SQUARE\\s*CASH'], 'Transfer'),
  createMerchantEntry('AT&T', ['AT&T', 'ATT'], ['AT.?T'], 'Utilities'),
  createMerchantEntry('Verizon', ['VERIZON'], ['VERIZON'], 'Utilities'),
  createMerchantEntry('T-Mobile', ['T-MOBILE', 'TMOBILE'], ['T.?MOBILE'], 'Utilities'),
  createMerchantEntry('Comcast', ['COMCAST', 'XFINITY'], ['COMCAST', 'XFINITY'], 'Utilities'),
  createMerchantEntry('PG&E', ['PG&E', 'PACIFIC GAS'], ['PG.?E', 'PACIFIC\\s*GAS'], 'Utilities'),
];
