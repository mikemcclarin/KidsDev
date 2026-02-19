import { describe, it, expect } from 'vitest';
import {
  canonicalize,
  extractTokens,
  textSimilarity,
  matchMerchant,
  resolveMerchant,
  SEED_MERCHANTS,
} from '../merchant';

describe('canonicalize', () => {
  it('strips POS DEBIT VISA prefixes', () => {
    expect(canonicalize('POS DEBIT VISA AMAZON.COM AMZN.COM/BILL WA')).toBe('AMAZON.COM AMZN.COM/BILL WA');
  });

  it('strips CHECKCARD prefix and trailing store numbers', () => {
    expect(canonicalize('CHECKCARD 0116 WALMART SUPERCENTER #3456 DALLAS TX')).toBe('WALMART SUPERCENTER DALLAS TX');
  });

  it('strips RECURRING ACH prefix', () => {
    expect(canonicalize('RECURRING ACH NETFLIX.COM 800-123-4567 CA')).toBe('NETFLIX.COM 800-123-4567 CA');
  });

  it('strips SQ* prefix', () => {
    expect(canonicalize('SQ *BOBS PIZZA PLANO TX')).toBe('BOBS PIZZA PLANO TX');
  });

  it('strips PP* prefix (PayPal)', () => {
    expect(canonicalize('PP*SPOTIFY USA')).toBe('SPOTIFY USA');
  });

  it('handles plain text with no noise', () => {
    expect(canonicalize('STARBUCKS STORE 12345')).toBe('STARBUCKS STORE');
  });
});

describe('extractTokens', () => {
  it('extracts store number', () => {
    const tokens = extractTokens('WALMART SUPERCENTER #3456 DALLAS TX');
    expect(tokens.store_number).toBe('3456');
  });

  it('detects online channel', () => {
    expect(extractTokens('AMAZON ONLINE PURCHASE').channel).toBe('online');
  });

  it('detects POS channel', () => {
    expect(extractTokens('POS DEBIT TARGET').channel).toBe('in-store');
  });
});

describe('textSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(textSimilarity('AMAZON', 'AMAZON')).toBe(1);
  });

  it('returns high score for similar strings', () => {
    expect(textSimilarity('WALMART SUPERCENTER', 'WALMART')).toBeGreaterThan(0.5);
  });

  it('returns low score for dissimilar strings', () => {
    expect(textSimilarity('AMAZON', 'STARBUCKS')).toBeLessThan(0.3);
  });
});

describe('matchMerchant', () => {
  it('exact alias match for AMAZON', () => {
    const result = matchMerchant('AMAZON.COM', SEED_MERCHANTS);
    expect(result).not.toBeNull();
    expect(result!.merchant.canonical_name).toBe('Amazon');
    expect(result!.match_type).toBe('exact');
    expect(result!.confidence).toBe(1.0);
  });

  it('pattern match for WALMART SUPERCENTER', () => {
    const result = matchMerchant('WALMART SUPERCENTER DALLAS TX', SEED_MERCHANTS);
    expect(result).not.toBeNull();
    expect(result!.merchant.canonical_name).toBe('Walmart');
    expect(result!.match_type).toBe('pattern');
  });

  it('pattern match for NETFLIX.COM', () => {
    const result = matchMerchant('NETFLIX.COM 800-123-4567 CA', SEED_MERCHANTS);
    expect(result).not.toBeNull();
    expect(result!.merchant.canonical_name).toBe('Netflix');
  });

  it('pattern match for SHELL OIL', () => {
    const result = matchMerchant('SHELL OIL 57421123 DALLAS TX', SEED_MERCHANTS);
    expect(result).not.toBeNull();
    expect(result!.merchant.canonical_name).toBe('Shell');
  });

  it('pattern match for CHICK-FIL-A', () => {
    const result = matchMerchant('CHICK-FIL-A PLANO TX', SEED_MERCHANTS);
    expect(result).not.toBeNull();
    expect(result!.merchant.canonical_name).toBe('Chick-fil-A');
  });

  it('returns null for unknown merchant', () => {
    const result = matchMerchant('JOES CRAB SHACK DALLAS TX', SEED_MERCHANTS);
    // Should either be null or low confidence fuzzy
    if (result) {
      expect(result.confidence).toBeLessThan(0.5);
    }
  });
});

describe('resolveMerchant', () => {
  it('uses user override when available', () => {
    const overrides = new Map([['POS DEBIT WEIRD MERCHANT', 'My Custom Name']]);
    const result = resolveMerchant('POS DEBIT WEIRD MERCHANT', SEED_MERCHANTS, overrides);
    expect(result.canonical).toBe('My Custom Name');
    expect(result.confidence).toBe(1.0);
  });

  it('falls back to canonicalized form when no match', () => {
    const result = resolveMerchant('RANDOM STORE NOBODY HEARD OF', SEED_MERCHANTS, new Map());
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.canonical.length).toBeGreaterThan(0);
  });

  it('resolves Spotify through PP* prefix', () => {
    const result = resolveMerchant('PP*SPOTIFY USA', SEED_MERCHANTS, new Map());
    expect(result.canonical).toBe('Spotify');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
