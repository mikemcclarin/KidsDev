import { describe, it, expect } from 'vitest';
import { parseDate, parseAmount, mapRows } from '../map';

describe('parseDate', () => {
  it('handles MM/DD/YYYY', () => {
    expect(parseDate('01/15/2025')).toBe('2025-01-15');
  });

  it('handles M/D/YYYY', () => {
    expect(parseDate('1/5/2025')).toBe('2025-01-05');
  });

  it('handles MM-DD-YYYY', () => {
    expect(parseDate('01-15-2025')).toBe('2025-01-15');
  });

  it('handles ISO format passthrough', () => {
    expect(parseDate('2025-01-15')).toBe('2025-01-15');
  });

  it('handles MM/DD/YY', () => {
    expect(parseDate('01/15/25')).toBe('2025-01-15');
  });

  it('handles MM/DD/YY for 1990s', () => {
    expect(parseDate('01/15/99')).toBe('1999-01-15');
  });
});

describe('parseAmount', () => {
  it('handles plain number', () => {
    expect(parseAmount('45.99')).toBe(45.99);
  });

  it('handles negative', () => {
    expect(parseAmount('-45.99')).toBe(-45.99);
  });

  it('handles dollar sign and commas', () => {
    expect(parseAmount('$1,234.56')).toBe(1234.56);
  });

  it('handles parentheses as negative', () => {
    expect(parseAmount('(127.43)')).toBe(-127.43);
  });

  it('handles spaces', () => {
    expect(parseAmount(' 42.10 ')).toBe(42.10);
  });
});

describe('mapRows', () => {
  it('maps with single amount column', () => {
    const rows = [
      { Date: '01/15/2025', Description: 'AMAZON PURCHASE', Amount: '-45.99' },
    ];
    const result = mapRows(rows, { date: 'Date', description: 'Description', amount: 'Amount' });
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-01-15');
    expect(result[0].amount_signed).toBe(-45.99);
    expect(result[0].raw_description).toBe('AMAZON PURCHASE');
  });

  it('maps with debit/credit columns', () => {
    const rows = [
      { Date: '01/15/2025', Memo: 'PURCHASE', Debit: '45.99', Credit: '' },
      { Date: '01/20/2025', Memo: 'DEPOSIT', Debit: '', Credit: '3200.00' },
    ];
    const result = mapRows(rows, { date: 'Date', description: 'Memo', debit: 'Debit', credit: 'Credit' });
    expect(result[0].amount_signed).toBe(-45.99);
    expect(result[1].amount_signed).toBe(3200);
  });

  it('extracts csv_category when category column is mapped', () => {
    const rows = [
      { Date: '01/15/2025', Description: 'AMAZON', Amount: '-45.99', Category: 'Merchandise' },
    ];
    const result = mapRows(rows, { date: 'Date', description: 'Description', amount: 'Amount', category: 'Category' });
    expect(result[0].csv_category).toBe('Merchandise');
  });

  it('csv_category is undefined when not mapped', () => {
    const rows = [
      { Date: '01/15/2025', Description: 'AMAZON', Amount: '-45.99' },
    ];
    const result = mapRows(rows, { date: 'Date', description: 'Description', amount: 'Amount' });
    expect(result[0].csv_category).toBeUndefined();
  });

  it('csv_category is undefined for empty values', () => {
    const rows = [
      { Date: '01/15/2025', Description: 'AMAZON', Amount: '-45.99', Category: '' },
    ];
    const result = mapRows(rows, { date: 'Date', description: 'Description', amount: 'Amount', category: 'Category' });
    expect(result[0].csv_category).toBeUndefined();
  });
});
