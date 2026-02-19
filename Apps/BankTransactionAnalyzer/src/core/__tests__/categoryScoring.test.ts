import { describe, it, expect } from 'vitest';
import {
  scoreDerivedCategory,
  scoreCsvCategory,
  resolveCategory,
} from '../categoryScoring';
import { SEED_MERCHANTS } from '../merchant';
import type { Transaction, CategoryScore } from '../types';

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'test',
    date: '2025-01-15',
    amount_signed: -10,
    raw_description: 'TEST',
    merchant_canonical: 'Test',
    merchant_confidence: 1,
    category: '',
    type: 'unknown',
    account_type: 'unknown',
    tags: [],
    source_row: 0,
    ...overrides,
  };
}

describe('scoreDerivedCategory', () => {
  it('exact seed merchant gets high confidence', () => {
    const txn = makeTxn({ raw_description: 'STARBUCKS STORE 12345' });
    const result = scoreDerivedCategory(txn, SEED_MERCHANTS);
    expect(result.category).toBe('Dining');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('multi-category merchant (Amazon) gets capped at 0.50', () => {
    const txn = makeTxn({ raw_description: 'AMAZON.COM' });
    const result = scoreDerivedCategory(txn, SEED_MERCHANTS);
    expect(result.category).toBe('Shopping');
    expect(result.confidence).toBeLessThanOrEqual(0.45);
  });

  it('keyword fills gap when no merchant matches', () => {
    const txn = makeTxn({ raw_description: 'HECTORS MEXICAN FOOD' });
    const result = scoreDerivedCategory(txn, SEED_MERCHANTS);
    expect(result.category).toBe('Dining');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('returns zero confidence for unknown description', () => {
    const txn = makeTxn({ raw_description: 'XYZABC 99999' });
    const result = scoreDerivedCategory(txn, SEED_MERCHANTS);
    expect(result.confidence).toBe(0);
    expect(result.category).toBe('');
  });

  it('keyword + merchant agreement boosts confidence', () => {
    const txn = makeTxn({ raw_description: 'CHEVRON 0092920' });
    const result = scoreDerivedCategory(txn, SEED_MERCHANTS);
    expect(result.category).toBe('Gas');
    // Chevron pattern match (0.85) + keyword agreement (+0.05) = 0.90
    expect(result.confidence).toBeGreaterThan(0.85);
  });
});

describe('scoreCsvCategory', () => {
  it('specific CSV category (Dining) gets high base confidence', () => {
    const result = scoreCsvCategory('Dining', { category: '', confidence: 0 });
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBe(0.85);
  });

  it('vague CSV category (Merchandise) gets low base confidence', () => {
    const result = scoreCsvCategory('Merchandise', { category: '', confidence: 0 });
    expect(result?.category).toBe('Shopping');
    expect(result?.confidence).toBe(0.40);
  });

  it('agreement with DCC boosts confidence', () => {
    const derived: CategoryScore = { category: 'Dining', confidence: 0.65 };
    const result = scoreCsvCategory('Dining', derived);
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBeCloseTo(0.85 * 1.1, 1); // 0.935
  });

  it('mild DCC conflict penalizes CSV', () => {
    const derived: CategoryScore = { category: 'Groceries', confidence: 0.45 };
    const result = scoreCsvCategory('Merchandise', derived);
    expect(result?.category).toBe('Shopping');
    expect(result?.confidence).toBeCloseTo(0.40 * 0.6, 1); // 0.24
  });

  it('strong DCC conflict heavily penalizes CSV', () => {
    const derived: CategoryScore = { category: 'Gas', confidence: 0.90 };
    const result = scoreCsvCategory('Dining', derived);
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBeCloseTo(0.85 * 0.4, 1); // 0.34
  });

  it('returns null for empty CSV category', () => {
    expect(scoreCsvCategory('', { category: 'Dining', confidence: 0.5 })).toBeNull();
    expect(scoreCsvCategory(undefined, { category: 'Dining', confidence: 0.5 })).toBeNull();
  });

  it('returns null for unmapped CSV category', () => {
    expect(scoreCsvCategory('SomeBankSpecificCategory', { category: '', confidence: 0 })).toBeNull();
  });

  it('maps Gas/Automotive to Gas', () => {
    const result = scoreCsvCategory('Gas/Automotive', { category: '', confidence: 0 });
    expect(result?.category).toBe('Gas');
    expect(result?.confidence).toBe(0.90);
  });

  it('maps Health Care to Healthcare', () => {
    const result = scoreCsvCategory('Health Care', { category: '', confidence: 0 });
    expect(result?.category).toBe('Healthcare');
  });

  it('is case insensitive', () => {
    const result = scoreCsvCategory('DINING', { category: '', confidence: 0 });
    expect(result?.category).toBe('Dining');
  });
});

describe('resolveCategory', () => {
  it('CSV wins on tie', () => {
    const derived: CategoryScore = { category: 'Shopping', confidence: 0.50 };
    const csv: CategoryScore = { category: 'Dining', confidence: 0.50 };
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Dining');
  });

  it('derived wins when higher confidence', () => {
    const derived: CategoryScore = { category: 'Gas', confidence: 0.90 };
    const csv: CategoryScore = { category: 'Shopping', confidence: 0.24 };
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Gas');
  });

  it('falls back to Other when derived is below threshold and no CSV', () => {
    const derived: CategoryScore = { category: 'Shopping', confidence: 0.20 };
    const result = resolveCategory(derived, null);
    expect(result.category).toBe('Other');
  });

  it('uses CSV when no derived signal', () => {
    const derived: CategoryScore = { category: '', confidence: 0 };
    const csv: CategoryScore = { category: 'Dining', confidence: 0.85 };
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Dining');
  });

  it('uses derived when no CSV', () => {
    const derived: CategoryScore = { category: 'Gas', confidence: 0.65 };
    const result = resolveCategory(derived, null);
    expect(result.category).toBe('Gas');
  });

  it('Other when both scores are very low', () => {
    const derived: CategoryScore = { category: '', confidence: 0 };
    const csv: CategoryScore = { category: 'Other', confidence: 0.25 };
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Other');
  });
});

describe('integration: real CC transaction scenarios', () => {
  it('HECTORS MEXICAN FOOD + CSV Dining → Dining', () => {
    const txn = makeTxn({ raw_description: 'HECTORS MEXICAN FOOD', csv_category: 'Dining' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Dining');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('SPROUTS FARMERS MAR + CSV Merchandise → Groceries', () => {
    const txn = makeTxn({ raw_description: 'SPROUTS FARMERS MAR', csv_category: 'Merchandise' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Groceries');
  });

  it('CHEVRON + CSV Gas/Automotive → Gas', () => {
    const txn = makeTxn({ raw_description: 'CHEVRON 0092920', csv_category: 'Gas/Automotive' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Gas');
  });

  it('AMZNFreeTime + CSV Entertainment → Entertainment (CSV beats capped Amazon)', () => {
    const txn = makeTxn({ raw_description: 'AMZNFreeTime*VF1EL1ZN3', csv_category: 'Entertainment' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Entertainment');
  });

  it('Tesla Insurance Company + CSV Insurance → Insurance', () => {
    const txn = makeTxn({ raw_description: 'Tesla Insurance Company', csv_category: 'Insurance' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Insurance');
  });

  it('SP BOHEMIAN SKIN + CSV Other Services → Personal Care (SKIN keyword beats vague CSV)', () => {
    const txn = makeTxn({ raw_description: 'SP BOHEMIAN SKIN', csv_category: 'Other Services' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    // SKIN keyword → Personal Care (0.45) beats "Other Services" → Other (0.25 * 0.6 = 0.15)
    expect(result.category).toBe('Personal Care');
  });

  it('IN-N-OUT CAMARILLO + CSV Dining → Dining', () => {
    const txn = makeTxn({ raw_description: 'IN-N-OUT CAMARILLO', csv_category: 'Dining' });
    const derived = scoreDerivedCategory(txn, SEED_MERCHANTS);
    const csv = scoreCsvCategory(txn.csv_category, derived);
    const result = resolveCategory(derived, csv);
    expect(result.category).toBe('Dining');
  });
});
