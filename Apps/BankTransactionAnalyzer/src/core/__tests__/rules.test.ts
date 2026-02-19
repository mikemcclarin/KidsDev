import { describe, it, expect } from 'vitest';
import { detectTransactionType, applyRules, categorizeAll } from '../rules';
import { SEED_MERCHANTS } from '../merchant';
import type { Transaction, Rule } from '../types';

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

describe('detectTransactionType', () => {
  it('detects ATM withdrawal', () => {
    expect(detectTransactionType('ATM WITHDRAWAL 1234 MAIN ST', -60)).toBe('atm');
  });

  it('detects fee', () => {
    expect(detectTransactionType('MONTHLY SERVICE FEE', -12)).toBe('fee');
  });

  it('detects income from payroll', () => {
    expect(detectTransactionType('ACH DEPOSIT EMPLOYER PAYROLL ACME CORP', 3200)).toBe('income');
  });

  it('detects reward/cashback', () => {
    expect(detectTransactionType('CREDIT CARD REWARD CASHBACK', 25.50)).toBe('reward');
  });

  it('detects transfer from Zelle', () => {
    expect(detectTransactionType('ZELLE PAYMENT TO JOHN DOE', -50)).toBe('transfer');
  });

  it('detects refund keyword', () => {
    expect(detectTransactionType('AMAZON.COM REFUND', 45.99)).toBe('refund');
  });

  it('defaults to purchase for negative amount', () => {
    expect(detectTransactionType('STARBUCKS STORE 12345', -6.75)).toBe('purchase');
  });

  it('detects transfer from merchant category', () => {
    expect(detectTransactionType('VENMO PAYMENT', 75, 'unknown', 'Transfer')).toBe('transfer');
  });
});

describe('applyRules', () => {
  const rules: Rule[] = [
    {
      id: '1', enabled: true, priority: 1, name: 'Coffee rule',
      match: { merchant: 'Starbucks' },
      action: { category: 'Coffee' },
    },
    {
      id: '2', enabled: true, priority: 2, name: 'Gas regex',
      match: { regex: 'SHELL|CHEVRON|EXXON' },
      action: { category: 'Gas' },
    },
    {
      id: '3', enabled: false, priority: 0, name: 'Disabled rule',
      match: { keyword: 'TEST' },
      action: { category: 'NOPE' },
    },
  ];

  it('matches by merchant name', () => {
    const t = makeTxn({ merchant_canonical: 'Starbucks' });
    expect(applyRules(t, rules)?.category).toBe('Coffee');
  });

  it('matches by regex', () => {
    const t = makeTxn({ raw_description: 'SHELL OIL 57421 DALLAS TX' });
    expect(applyRules(t, rules)?.category).toBe('Gas');
  });

  it('skips disabled rules', () => {
    const t = makeTxn({ raw_description: 'TEST THING' });
    const result = applyRules(t, rules);
    expect(result?.category).not.toBe('NOPE');
  });

  it('returns null when no rules match', () => {
    const t = makeTxn({ merchant_canonical: 'Unknown', raw_description: 'RANDOM' });
    expect(applyRules(t, rules)).toBeNull();
  });
});

describe('categorizeAll', () => {
  it('assigns category from merchant dictionary', () => {
    const txns = [makeTxn({ merchant_canonical: 'Amazon', raw_description: 'AMAZON' })];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    expect(result[0].category).toBe('Shopping');
  });

  it('user rules override merchant defaults', () => {
    const txns = [makeTxn({ merchant_canonical: 'Amazon', raw_description: 'AMAZON' })];
    const rules: Rule[] = [{
      id: '1', enabled: true, priority: 1, name: 'Amazon override',
      match: { merchant: 'Amazon' },
      action: { category: 'Gifts/Donations' },
    }];
    const result = categorizeAll(txns, rules, SEED_MERCHANTS);
    expect(result[0].category).toBe('Gifts/Donations');
  });

  it('sets category_confidence on all transactions', () => {
    const txns = [
      makeTxn({ merchant_canonical: 'Starbucks', raw_description: 'STARBUCKS' }),
      makeTxn({ merchant_canonical: 'RANDOM', raw_description: 'RANDOM THING' }),
    ];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    for (const t of result) {
      expect(t.category_confidence).toBeDefined();
      expect(t.category_confidence).toBeGreaterThanOrEqual(0);
    }
  });

  it('keyword categorizes unknown merchant with food keywords as Dining', () => {
    const txns = [makeTxn({
      merchant_canonical: 'HECTORS MEXICAN FOOD',
      raw_description: 'HECTORS MEXICAN FOOD',
      merchant_confidence: 0.2,
    })];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    expect(result[0].category).toBe('Dining');
    expect(result[0].category_confidence).toBeGreaterThan(0.4);
  });

  it('CSV category wins for multi-category merchant (Amazon + Entertainment)', () => {
    const txns = [makeTxn({
      merchant_canonical: 'Amazon',
      raw_description: 'AMZNFreeTime*VF1EL1ZN3',
      csv_category: 'Entertainment',
    })];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    expect(result[0].category).toBe('Entertainment');
  });

  it('specific CSV category overrides weak derived score', () => {
    const txns = [makeTxn({
      merchant_canonical: 'UNKNOWN STORE',
      raw_description: 'UNKNOWN STORE DALLAS TX',
      csv_category: 'Gas/Automotive',
      merchant_confidence: 0.2,
    })];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    expect(result[0].category).toBe('Gas');
  });

  it('assigns Other when no signals at all', () => {
    const txns = [makeTxn({
      merchant_canonical: 'XYZABC',
      raw_description: 'XYZABC 99999',
      merchant_confidence: 0.2,
    })];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    expect(result[0].category).toBe('Other');
  });

  it('user rules still get confidence 1.0', () => {
    const txns = [makeTxn({ merchant_canonical: 'Amazon', raw_description: 'AMAZON' })];
    const rules: Rule[] = [{
      id: '1', enabled: true, priority: 1, name: 'Test',
      match: { merchant: 'Amazon' },
      action: { category: 'Gifts/Donations' },
    }];
    const result = categorizeAll(txns, rules, SEED_MERCHANTS);
    expect(result[0].category_confidence).toBe(1.0);
  });

  it('structural types (fee, transfer) bypass scoring', () => {
    const txns = [makeTxn({
      merchant_canonical: 'TEST',
      raw_description: 'MONTHLY SERVICE FEE',
      csv_category: 'Dining', // CSV says Dining but type detection says fee
    })];
    const result = categorizeAll(txns, [], SEED_MERCHANTS);
    expect(result[0].category).toBe('Fees/Interest');
    expect(result[0].type).toBe('fee');
  });
});
