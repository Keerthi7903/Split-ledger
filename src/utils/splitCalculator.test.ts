import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplit,
  calculateExactSplitSummary,
  calculatePercentSplit,
  resolveExpenseShares,
} from './splitCalculator';

const CANONICAL_MEMBERS = ['m1', 'm2', 'm3', 'm4', 'm5'];

describe('splitCalculator module', () => {
  describe('calculateEqualSplit', () => {
    it('splits ₹100 (10000 paise) equally between 3 members with ordered remainder', () => {
      // Required by assignment: ₹100 split 3 ways must equal ₹33.34 + ₹33.33 + ₹33.33
      const shares = calculateEqualSplit(10000, ['m1', 'm2', 'm3']);

      expect(shares['m1']).toBe(3334); // ₹33.34
      expect(shares['m2']).toBe(3333); // ₹33.33
      expect(shares['m3']).toBe(3333); // ₹33.33

      // Verify exact sum invariant
      const sum = Object.values(shares).reduce((a, b) => a + b, 0);
      expect(sum).toBe(10000);
    });

    it('splits evenly when divisible without remainder', () => {
      const shares = calculateEqualSplit(20000, ['m1', 'm2']);
      expect(shares['m1']).toBe(10000);
      expect(shares['m2']).toBe(10000);
    });

    it('splits for 1 member with full amount', () => {
      const shares = calculateEqualSplit(5000, ['m3']);
      expect(shares['m3']).toBe(5000);
    });

    it('distributes 2 remainder paise to first 2 selected members', () => {
      // 10001 paise / 3 = 3333 base, remainder 2 -> m1: 3334, m2: 3334, m3: 3333
      const shares = calculateEqualSplit(10001, ['m1', 'm2', 'm3']);
      expect(shares['m1']).toBe(3334);
      expect(shares['m2']).toBe(3334);
      expect(shares['m3']).toBe(3333);
      expect((shares['m1'] ?? 0) + (shares['m2'] ?? 0) + (shares['m3'] ?? 0)).toBe(10001);
    });
  });

  describe('calculateExactSplitSummary', () => {
    it('returns exact match when shares sum to total', () => {
      const summary = calculateExactSplitSummary(1050000, {
        m3: 350000,
        m4: 350000,
        m5: 350000,
      });

      expect(summary.assignedPaise).toBe(1050000);
      expect(summary.remainingPaise).toBe(0);
      expect(summary.isExactMatch).toBe(true);
    });

    it('calculates remaining amount when under-allocated', () => {
      const summary = calculateExactSplitSummary(10000, {
        m1: 5000,
        m2: 2500,
      });

      expect(summary.assignedPaise).toBe(7500);
      expect(summary.remainingPaise).toBe(2500);
      expect(summary.isExactMatch).toBe(false);
    });

    it('calculates excess when over-allocated', () => {
      const summary = calculateExactSplitSummary(10000, {
        m1: 7000,
        m2: 5000,
      });

      expect(summary.assignedPaise).toBe(12000);
      expect(summary.remainingPaise).toBe(-2000);
      expect(summary.isExactMatch).toBe(false);
    });
  });

  describe('calculatePercentSplit', () => {
    it('splits sample e4 (₹2000, 50%, 25%, 25%) exactly', () => {
      const shares = calculatePercentSplit(
        200000,
        { m5: 50, m1: 25, m2: 25 },
        CANONICAL_MEMBERS
      );

      expect(shares['m5']).toBe(100000); // 50% = ₹1000.00
      expect(shares['m1']).toBe(50000);  // 25% = ₹500.00
      expect(shares['m2']).toBe(50000);  // 25% = ₹500.00

      const sum = Object.values(shares).reduce((a, b) => a + b, 0);
      expect(sum).toBe(200000);
    });

    it('splits sample e6 (₹1499.99 with 33.33%, 33.33%, 33.34%) without losing paise', () => {
      // 149999 paise:
      // m1 (33.33% = 3333 bps): 149999 * 3333 / 10000 = 49994.6667 -> 49994 paise, rem 6667
      // m2 (33.33% = 3333 bps): 149999 * 3333 / 10000 = 49994.6667 -> 49994 paise, rem 6667
      // m3 (33.34% = 3334 bps): 149999 * 3334 / 10000 = 50009.6666 -> 50009 paise, rem 6666
      // Total base: 49994 + 49994 + 50009 = 149997. Deficit = 2 paise!
      // Remainder ranking:
      // m1: 6667 (canonical index 0)
      // m2: 6667 (canonical index 1)
      // m3: 6666 (canonical index 2)
      // Top 2 remainders are m1 and m2 (tie broken by canonical order).
      // m1 gets +1 -> 49995
      // m2 gets +1 -> 49995
      // m3 gets 0 -> 50009
      // Total: 49995 + 49995 + 50009 = 149999!
      const shares = calculatePercentSplit(
        149999,
        { m1: 33.33, m2: 33.33, m3: 33.34 },
        CANONICAL_MEMBERS
      );

      expect(shares['m1']).toBe(49995);
      expect(shares['m2']).toBe(49995);
      expect(shares['m3']).toBe(50009);

      const sum = Object.values(shares).reduce((a, b) => a + b, 0);
      expect(sum).toBe(149999);
    });

    it('breaks ties deterministically using canonical member order', () => {
      // Split 100 paise between m2 and m1 at 50% each:
      // 100 * 5000 / 10000 = 50 paise each, rem 0.
      // What if 101 paise? 101 * 5000 / 10000 = 50 paise, rem 5000 for both!
      // Deficit = 1 paisa.
      // Canonical order: m1 comes before m2.
      // Therefore, m1 must get the extra paisa even if passed as { m2: 50, m1: 50 }!
      const shares = calculatePercentSplit(
        101,
        { m2: 50, m1: 50 },
        CANONICAL_MEMBERS
      );

      expect(shares['m1']).toBe(51);
      expect(shares['m2']).toBe(50);
      expect((shares['m1'] ?? 0) + (shares['m2'] ?? 0)).toBe(101);
    });
  });

  describe('resolveExpenseShares', () => {
    it('resolves equal split', () => {
      const shares = resolveExpenseShares(
        12000,
        { type: 'equal', memberIds: ['m1', 'm2'] },
        CANONICAL_MEMBERS
      );
      expect(shares['m1']).toBe(6000);
      expect(shares['m2']).toBe(6000);
    });
  });
});
