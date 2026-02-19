import { describe, it, expect } from 'vitest';
import { keywordCategorize } from '../keywords';

describe('keywordCategorize', () => {
  // ─── Dining ──────────────────────────────────────────────────
  it('matches strong dining keyword: RESTAURANT (with multi-match bonus)', () => {
    const result = keywordCategorize('JOES CRAB SHACK RESTAURANT');
    expect(result?.category).toBe('Dining');
    // RESTAURANT (strong=0.65) + CRAB (weak) → multi-match bonus = 0.75
    expect(result?.confidence).toBe(0.75);
  });

  it('matches weak dining keyword: FOOD', () => {
    const result = keywordCategorize('HECTORS MEXICAN FOOD');
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBeGreaterThanOrEqual(0.45);
  });

  it('MEXICAN and FOOD are in same rule group — no double-count', () => {
    const result = keywordCategorize('HECTORS MEXICAN FOOD');
    // MEXICAN and FOOD are both in the weak Dining rule — break after first match
    // Only one rule group matched → no multi-match bonus
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBe(0.45);
  });

  it('matches CAFE as strong dining', () => {
    const result = keywordCategorize('URBANE CAFE 007');
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBe(0.65);
  });

  it('matches RAMEN as strong dining', () => {
    const result = keywordCategorize('TST* SILVERLAKE RAMEN - O');
    expect(result?.category).toBe('Dining');
    expect(result?.confidence).toBe(0.65);
  });

  // ─── Gas ─────────────────────────────────────────────────────
  it('matches CHEVRON as strong gas', () => {
    const result = keywordCategorize('CHEVRON 0092920');
    expect(result?.category).toBe('Gas');
    expect(result?.confidence).toBe(0.65);
  });

  it('matches PARKING as weak gas', () => {
    const result = keywordCategorize('PARKSMART THE COLLECTION');
    expect(result?.category).toBe('Gas');
    expect(result?.confidence).toBe(0.45);
  });

  // ─── Groceries ──────────────────────────────────────────────
  it('matches SPROUTS as strong groceries', () => {
    const result = keywordCategorize('SPROUTS FARMERS MAR');
    expect(result?.category).toBe('Groceries');
  });

  it('matches FARMERS as weak groceries', () => {
    const result = keywordCategorize('LOCAL FARMERS STAND');
    expect(result?.category).toBe('Groceries');
    expect(result?.confidence).toBe(0.45);
  });

  // ─── Entertainment ──────────────────────────────────────────
  it('matches BOWLING as strong entertainment', () => {
    const result = keywordCategorize('BOWLERO OXNARD ARCADE');
    expect(result?.category).toBe('Entertainment');
  });

  it('matches DAVE & BUSTER as weak entertainment', () => {
    const result = keywordCategorize('DAVE & BUSTERS #127');
    expect(result?.category).toBe('Entertainment');
  });

  it('matches FANDANGO as strong entertainment', () => {
    const result = keywordCategorize('FANDANGO    *');
    expect(result?.category).toBe('Entertainment');
    expect(result?.confidence).toBe(0.65);
  });

  // ─── Insurance ──────────────────────────────────────────────
  it('matches INSURANCE as strong', () => {
    const result = keywordCategorize('Tesla Insurance Company');
    expect(result?.category).toBe('Insurance');
    expect(result?.confidence).toBe(0.65);
  });

  // ─── Personal Care ─────────────────────────────────────────
  it('matches SUPERCUTS as strong personal care', () => {
    const result = keywordCategorize('Supercuts Camarillo');
    expect(result?.category).toBe('Personal Care');
    expect(result?.confidence).toBe(0.65);
  });

  // ─── Shopping ───────────────────────────────────────────────
  it('matches KOHLS as weak shopping', () => {
    const result = keywordCategorize('KOHLS #0630');
    expect(result?.category).toBe('Shopping');
    expect(result?.confidence).toBe(0.45);
  });

  it('matches REI as weak shopping', () => {
    const result = keywordCategorize('REI.COM  800-426-4840');
    expect(result?.category).toBe('Shopping');
  });

  // ─── Travel ─────────────────────────────────────────────────
  it('matches AIRBNB as strong travel', () => {
    const result = keywordCategorize('PAYPAL *AIRBNB HMWB9JEK3');
    expect(result?.category).toBe('Travel');
    expect(result?.confidence).toBe(0.65);
  });

  it('matches COT*HTL as weak travel', () => {
    const result = keywordCategorize('COT*HTL');
    expect(result?.category).toBe('Travel');
  });

  // ─── Home Improvement ──────────────────────────────────────
  it('matches HOME DEPOT', () => {
    const result = keywordCategorize('HOMEDEPOT.COM');
    expect(result?.category).toBe('Home Improvement');
    expect(result?.confidence).toBe(0.65);
  });

  // ─── Personal Care from SKIN keyword ────────────────────────
  it('SKIN matches Personal Care weak keyword', () => {
    const result = keywordCategorize('SP BOHEMIAN SKIN');
    expect(result?.category).toBe('Personal Care');
    expect(result?.confidence).toBe(0.45);
  });

  // ─── No match ───────────────────────────────────────────────
  it('returns null for truly unknown descriptions', () => {
    expect(keywordCategorize('XYZABC 99999')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(keywordCategorize('')).toBeNull();
  });

  // ─── Case insensitivity ─────────────────────────────────────
  it('is case insensitive', () => {
    const result = keywordCategorize('hectors mexican food');
    expect(result?.category).toBe('Dining');
  });
});
