import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadInitialExpenses,
  saveExpensesToStorage,
  STORAGE_KEY,
} from './localStorage';
import { Expense } from '../types/expense';

describe('localStorage persistence engine', () => {
  const validMemberIds = new Set(['m1', 'm2', 'm3', 'm4', 'm5']);

  const sampleFallback: Expense[] = [
    {
      id: 'e_fb1',
      description: 'Fallback Expense',
      amount: 10000,
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Food',
      split: {
        type: 'equal',
        memberIds: ['m1', 'm2'],
      },
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns fallback data when localStorage is empty', () => {
    const expenses = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(expenses).toEqual(sampleFallback);
  });

  it('loads valid saved expenses successfully', () => {
    const validSaved: Expense[] = [
      {
        id: 'e_saved1',
        description: 'Saved Cab',
        amount: 50000,
        paidBy: 'm2',
        date: '2026-03-10',
        category: 'Travel',
        split: {
          type: 'equal',
          memberIds: ['m1', 'm2'],
        },
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(validSaved));

    const result = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(result).toEqual(validSaved);
  });

  it('recovers with fallback data when JSON is malformed', () => {
    localStorage.setItem(STORAGE_KEY, '{"invalid_json: broken');

    const result = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(result).toEqual(sampleFallback);
  });

  it('rejects structurally invalid data and recovers with fallback', () => {
    // Expense with missing category and invalid split
    const invalidData = [
      {
        id: 'e_bad',
        description: 'Bad item',
        amount: 5000,
        paidBy: 'm1',
        date: '2026-03-10',
        category: 'NonExistentCategory',
        split: { type: 'unknown' },
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidData));

    const result = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(result).toEqual(sampleFallback);
  });

  it('rejects exact split where shares do not equal amount', () => {
    const mismatchedExact = [
      {
        id: 'e_bad_exact',
        description: 'Mismatched exact',
        amount: 10000,
        paidBy: 'm1',
        date: '2026-03-10',
        category: 'Stay',
        split: {
          type: 'exact',
          shares: { m1: 4000, m2: 4000 }, // sums to 8000, not 10000
        },
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mismatchedExact));
    const result = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(result).toEqual(sampleFallback);
  });

  it('rejects percentage split where total is not 100%', () => {
    const badPercent = [
      {
        id: 'e_bad_pct',
        description: 'Bad percent',
        amount: 10000,
        paidBy: 'm1',
        date: '2026-03-10',
        category: 'Stay',
        split: {
          type: 'percent',
          shares: { m1: 50, m2: 30 }, // 80% total
        },
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(badPercent));
    const result = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(result).toEqual(sampleFallback);
  });

  it('handles localStorage throwing SecurityError/access denied gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: Access is denied for this document');
    });

    const result = loadInitialExpenses(validMemberIds, sampleFallback);
    expect(result).toEqual(sampleFallback);
  });

  it('saves expenses to localStorage and catches setItem errors gracefully', () => {
    const toSave: Expense[] = [
      {
        id: 'e_new',
        description: 'New Expense',
        amount: 25000,
        paidBy: 'm3',
        date: '2026-03-12',
        category: 'Food',
        split: { type: 'equal', memberIds: ['m3'] },
      },
    ];

    saveExpensesToStorage(toSave);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(toSave);

    // Test error handling
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw
    expect(() => saveExpensesToStorage(toSave)).not.toThrow();
  });
});
