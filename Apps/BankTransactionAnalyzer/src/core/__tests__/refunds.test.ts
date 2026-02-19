import { describe, it, expect } from 'vitest';
import {
  isLikelyRefund,
  dateDiffDays,
  scoreRefundMatch,
  linkRefunds,
} from '../refunds';
import { DEFAULT_REFUND_SETTINGS } from '../types';
import type { Transaction } from '../types';

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? 'test-' + Math.random().toString(36).slice(2),
    date: '2025-01-15',
    amount_signed: -10,
    raw_description: 'TEST',
    merchant_canonical: 'Test',
    merchant_confidence: 1,
    category: 'Other',
    type: 'purchase',
    account_type: 'unknown',
    tags: [],
    source_row: 0,
    ...overrides,
  };
}

describe('isLikelyRefund', () => {
  it('detects REFUND keyword', () => {
    const t = makeTxn({ amount_signed: 45.99, raw_description: 'AMAZON.COM REFUND', type: 'unknown' });
    expect(isLikelyRefund(t)).toBe(true);
  });

  it('detects RETURN keyword', () => {
    const t = makeTxn({ amount_signed: 32.18, raw_description: 'RETURN DEBIT WALMART', type: 'unknown' });
    expect(isLikelyRefund(t)).toBe(true);
  });

  it('rejects negative amounts', () => {
    const t = makeTxn({ amount_signed: -10, raw_description: 'REFUND' });
    expect(isLikelyRefund(t)).toBe(false);
  });

  it('rejects rewards', () => {
    const t = makeTxn({ amount_signed: 25, raw_description: 'CASHBACK REWARD', type: 'reward' });
    expect(isLikelyRefund(t)).toBe(false);
  });

  it('rejects transfers', () => {
    const t = makeTxn({ amount_signed: 75, raw_description: 'VENMO PAYMENT', type: 'transfer' });
    expect(isLikelyRefund(t)).toBe(false);
  });

  it('rejects income', () => {
    const t = makeTxn({ amount_signed: 3200, raw_description: 'PAYROLL', type: 'income' });
    expect(isLikelyRefund(t)).toBe(false);
  });
});

describe('dateDiffDays', () => {
  it('returns 0 for same day', () => {
    expect(dateDiffDays('2025-01-15', '2025-01-15')).toBe(0);
  });

  it('returns positive for later date', () => {
    expect(dateDiffDays('2025-01-15', '2025-01-24')).toBe(9);
  });

  it('returns negative for earlier date', () => {
    expect(dateDiffDays('2025-01-24', '2025-01-15')).toBe(-9);
  });
});

describe('scoreRefundMatch', () => {
  it('scores exact amount match highly', () => {
    const purchase = makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -45.99, merchant_canonical: 'Amazon' });
    const refund = makeTxn({ id: 'r1', date: '2025-01-24', amount_signed: 45.99, merchant_canonical: 'Amazon' });
    const score = scoreRefundMatch(refund, purchase, DEFAULT_REFUND_SETTINGS);
    expect(score).toBeGreaterThan(0.7);
  });

  it('returns 0 for mismatched merchants', () => {
    const purchase = makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -45.99, merchant_canonical: 'Amazon' });
    const refund = makeTxn({ id: 'r1', date: '2025-01-24', amount_signed: 45.99, merchant_canonical: 'Starbucks' });
    const score = scoreRefundMatch(refund, purchase, DEFAULT_REFUND_SETTINGS);
    expect(score).toBe(0);
  });

  it('returns 0 for transactions outside time window', () => {
    const purchase = makeTxn({ id: 'p1', date: '2024-01-01', amount_signed: -45.99, merchant_canonical: 'Amazon' });
    const refund = makeTxn({ id: 'r1', date: '2025-01-24', amount_signed: 45.99, merchant_canonical: 'Amazon' });
    const score = scoreRefundMatch(refund, purchase, DEFAULT_REFUND_SETTINGS);
    expect(score).toBe(0);
  });

  it('handles partial refunds', () => {
    const purchase = makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -100, merchant_canonical: 'Amazon' });
    const refund = makeTxn({ id: 'r1', date: '2025-01-24', amount_signed: 50, merchant_canonical: 'Amazon' });
    const score = scoreRefundMatch(refund, purchase, DEFAULT_REFUND_SETTINGS);
    expect(score).toBeGreaterThan(0);
  });
});

describe('linkRefunds', () => {
  it('links a refund to matching purchase', () => {
    const transactions = [
      makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -45.99, merchant_canonical: 'Amazon', raw_description: 'AMAZON PURCHASE', type: 'purchase' }),
      makeTxn({ id: 'r1', date: '2025-01-24', amount_signed: 45.99, merchant_canonical: 'Amazon', raw_description: 'AMAZON.COM REFUND', type: 'unknown' }),
    ];
    const result = linkRefunds(transactions, DEFAULT_REFUND_SETTINGS);
    expect(result[1].type).toBe('refund');
    expect(result[1].linked_transaction_id).toBe('p1');
  });

  it('refund inherits purchase category', () => {
    const transactions = [
      makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -45.99, merchant_canonical: 'Amazon', category: 'Shopping', type: 'purchase' }),
      makeTxn({ id: 'r1', date: '2025-01-24', amount_signed: 45.99, merchant_canonical: 'Amazon', raw_description: 'AMAZON REFUND', type: 'unknown' }),
    ];
    const result = linkRefunds(transactions, DEFAULT_REFUND_SETTINGS);
    expect(result[1].category).toBe('Shopping');
  });

  it('does not link rewards as refunds', () => {
    const transactions = [
      makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -45.99, merchant_canonical: 'Amazon', type: 'purchase' }),
      makeTxn({ id: 'r1', date: '2025-01-28', amount_signed: 25.50, raw_description: 'CREDIT CARD REWARD CASHBACK', merchant_canonical: 'REWARD', type: 'reward' }),
    ];
    const result = linkRefunds(transactions, DEFAULT_REFUND_SETTINGS);
    expect(result[1].type).toBe('reward');
    expect(result[1].linked_transaction_id).toBeUndefined();
  });

  it('does not link transfers as refunds', () => {
    const transactions = [
      makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -50, merchant_canonical: 'Venmo', type: 'purchase' }),
      makeTxn({ id: 'r1', date: '2025-02-01', amount_signed: 75, raw_description: 'VENMO PAYMENT FROM JANE', merchant_canonical: 'Venmo', type: 'transfer' }),
    ];
    const result = linkRefunds(transactions, DEFAULT_REFUND_SETTINGS);
    expect(result[1].type).toBe('transfer');
  });

  it('handles multiple refunds for one purchase', () => {
    const transactions = [
      makeTxn({ id: 'p1', date: '2025-01-15', amount_signed: -100, merchant_canonical: 'Amazon', type: 'purchase' }),
      makeTxn({ id: 'r1', date: '2025-01-20', amount_signed: 40, merchant_canonical: 'Amazon', raw_description: 'AMAZON REFUND', type: 'unknown' }),
      makeTxn({ id: 'r2', date: '2025-01-25', amount_signed: 60, merchant_canonical: 'Amazon', raw_description: 'AMAZON REFUND', type: 'unknown' }),
    ];
    const result = linkRefunds(transactions, DEFAULT_REFUND_SETTINGS);
    expect(result[1].type).toBe('refund');
    expect(result[1].linked_transaction_id).toBe('p1');
    expect(result[2].type).toBe('refund');
    expect(result[2].linked_transaction_id).toBe('p1');
  });
});
