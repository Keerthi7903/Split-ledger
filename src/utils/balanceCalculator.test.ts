import { describe, it, expect } from 'vitest';
import { calculateBalances } from './balanceCalculator';
import sampleData from '../data/sample-data.json';
import { Expense } from '../types/expense';

describe('balanceCalculator module', () => {
  const members = sampleData.members;
  const sampleExpenses = sampleData.expenses as Expense[];

  it('computes balances for all 6 sample expenses and verifies the zero-sum invariant', () => {
    const result = calculateBalances(members, sampleExpenses);

    expect(result.balances).toHaveLength(5);
    expect(result.isZeroSum).toBe(true);
    expect(result.zeroSumDiscrepancyPaise).toBe(0);

    // Verify all member net balances sum to 0
    const totalNet = result.balances.reduce((acc, b) => acc + b.netPaise, 0);
    expect(totalNet).toBe(0);
  });

  it('handles empty expenses list with all members settled up at 0', () => {
    const result = calculateBalances(members, []);

    expect(result.totalExpensesPaise).toBe(0);
    expect(result.isZeroSum).toBe(true);

    for (const b of result.balances) {
      expect(b.paidPaise).toBe(0);
      expect(b.owedPaise).toBe(0);
      expect(b.netPaise).toBe(0);
      expect(b.status).toBe('settled');
    }
  });

  it('correctly credits a payer who is completely outside the split', () => {
    // Kabir (m3) buys groceries for ₹1000 (100,000 paise) for Meera (m4) and Rohan (m5)
    const singleExpense: Expense = {
      id: 'test_ext',
      description: 'Groceries for friends',
      amount: 100000,
      paidBy: 'm3',
      date: '2026-03-14',
      category: 'Food',
      split: {
        type: 'equal',
        memberIds: ['m4', 'm5'],
      },
    };

    const result = calculateBalances(members, [singleExpense]);

    const m3 = result.balances.find((b) => b.memberId === 'm3');
    const m4 = result.balances.find((b) => b.memberId === 'm4');
    const m5 = result.balances.find((b) => b.memberId === 'm5');
    const m1 = result.balances.find((b) => b.memberId === 'm1');

    // Kabir paid 100,000 paise and owes 0 -> gets back ₹1000.00
    expect(m3?.paidPaise).toBe(100000);
    expect(m3?.owedPaise).toBe(0);
    expect(m3?.netPaise).toBe(100000);
    expect(m3?.status).toBe('gets_back');

    // Meera owes 50,000 paise (₹500.00)
    expect(m4?.paidPaise).toBe(0);
    expect(m4?.owedPaise).toBe(50000);
    expect(m4?.netPaise).toBe(-50000);
    expect(m4?.status).toBe('owes');

    // Rohan owes 50,000 paise (₹500.00)
    expect(m5?.paidPaise).toBe(0);
    expect(m5?.owedPaise).toBe(50000);
    expect(m5?.netPaise).toBe(-50000);
    expect(m5?.status).toBe('owes');

    // Aarav was not involved -> settled up
    expect(m1?.netPaise).toBe(0);
    expect(m1?.status).toBe('settled');

    // Zero-sum invariant check
    expect(result.isZeroSum).toBe(true);
  });
});
