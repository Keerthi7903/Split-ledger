import { describe, it, expect } from 'vitest';
import { validateExpenseForm, ValidationInput } from './validation';
import { isValidCalendarDate, isFutureDate } from './date';

const VALID_MEMBERS = ['m1', 'm2', 'm3', 'm4', 'm5'];

describe('date and validation utilities', () => {
  describe('date utility', () => {
    it('validates real calendar dates', () => {
      expect(isValidCalendarDate('2026-03-12')).toBe(true);
      expect(isValidCalendarDate('2024-02-29')).toBe(true); // Leap year 2024
    });

    it('rejects impossible dates like Feb 31 or Apr 31', () => {
      expect(isValidCalendarDate('2026-02-31')).toBe(false);
      expect(isValidCalendarDate('2026-04-31')).toBe(false);
      expect(isValidCalendarDate('invalid-date')).toBe(false);
    });

    it('correctly flags future dates', () => {
      const today = '2026-03-15';
      expect(isFutureDate('2026-03-16', today)).toBe(true);
      expect(isFutureDate('2026-03-15', today)).toBe(false);
      expect(isFutureDate('2026-03-14', today)).toBe(false);
    });
  });

  describe('validateExpenseForm', () => {
    const baseValidInput: ValidationInput = {
      description: 'Dinner at Beach Shack',
      amountRupees: '3250.00',
      paidBy: 'm2',
      date: '2026-03-12',
      category: 'Food',
      splitType: 'equal',
      equalMemberIds: ['m1', 'm2', 'm3', 'm4'],
      exactSharesRupees: {},
      percentShares: {},
      validMemberIds: VALID_MEMBERS,
    };

    it('passes for a completely valid equal split form', () => {
      const result = validateExpenseForm(baseValidInput, '2026-03-15');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.parsedAmountPaise).toBe(325000);
    });

    it('shows all applicable validation errors simultaneously on invalid form', () => {
      const invalidInput: ValidationInput = {
        description: '', // Required
        amountRupees: '-100', // Negative
        paidBy: '', // Required
        date: '2026-03-20', // Future date
        category: '', // Required
        splitType: 'equal',
        equalMemberIds: [], // Empty
        exactSharesRupees: {},
        percentShares: {},
        validMemberIds: VALID_MEMBERS,
      };

      const result = validateExpenseForm(invalidInput, '2026-03-15');

      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description is required');
      expect(result.errors.amount).toBe('Amount must be more than ₹0');
      expect(result.errors.paidBy).toBe('Paid by is required');
      expect(result.errors.date).toBe('The date cannot be in the future');
      expect(result.errors.category).toBe('Category is required');
      expect(result.errors.split).toBe('Select at least one member');
    });

    it('enforces description length <= 60 characters', () => {
      const longInput: ValidationInput = {
        ...baseValidInput,
        description: 'A'.repeat(61),
      };

      const result = validateExpenseForm(longInput, '2026-03-15');
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description must be at most 60 characters');
    });

    it('validates exact split remainder and shows left to assign', () => {
      const exactInput: ValidationInput = {
        ...baseValidInput,
        amountRupees: '100.00',
        splitType: 'exact',
        exactSharesRupees: {
          m1: '50.00',
          m2: '30.00',
        },
      };

      const result = validateExpenseForm(exactInput, '2026-03-15');
      expect(result.isValid).toBe(false);
      // ₹20.00 left to assign
      expect(result.errors.split).toContain('left to assign');
    });

    it('validates percentage split and requires exact 100%', () => {
      const percentInput: ValidationInput = {
        ...baseValidInput,
        amountRupees: '1000.00',
        splitType: 'percent',
        percentShares: {
          m1: '40',
          m2: '40',
        }, // 80% total
      };

      const result = validateExpenseForm(percentInput, '2026-03-15');
      expect(result.isValid).toBe(false);
      expect(result.errors.split).toContain('Percentages must equal exactly 100%');
    });
  });
});
