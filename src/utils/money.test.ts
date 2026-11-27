import { describe, it, expect } from 'vitest';
import {
  parseRupeesToPaise,
  formatPaiseToINR,
  paiseToRupeeString,
  MAX_AMOUNT_PAISE,
} from './money';

describe('money utility', () => {
  describe('parseRupeesToPaise', () => {
    it('parses valid integer rupee strings to paise', () => {
      const result = parseRupeesToPaise('100');
      expect(result.isValid).toBe(true);
      expect(result.paise).toBe(10000);
      expect(result.error).toBeUndefined();
    });

    it('parses valid rupee strings with 2 decimal places', () => {
      const result = parseRupeesToPaise('1250.50');
      expect(result.isValid).toBe(true);
      expect(result.paise).toBe(125050);
    });

    it('parses rupee strings with 1 decimal place padding to 10 paise', () => {
      const result = parseRupeesToPaise('45.5');
      expect(result.isValid).toBe(true);
      expect(result.paise).toBe(4550);
    });

    it('rejects empty string with "Amount is required"', () => {
      const result = parseRupeesToPaise('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount is required');
    });

    it('rejects negative numbers with "Amount must be more than ₹0"', () => {
      const result = parseRupeesToPaise('-50');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount must be more than ₹0');
    });

    it('rejects 0 with "Amount must be more than ₹0"', () => {
      const result = parseRupeesToPaise('0');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount must be more than ₹0');
    });

    it('rejects more than 2 decimal places', () => {
      const result = parseRupeesToPaise('10.999');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Enter a valid amount with at most 2 decimal places');
    });

    it('rejects scientific notation', () => {
      const result = parseRupeesToPaise('1e5');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Scientific notation is not allowed');
    });

    it('accepts maximum allowed amount of ₹10,00,000 (100,000,000 paise)', () => {
      const result = parseRupeesToPaise('1000000');
      expect(result.isValid).toBe(true);
      expect(result.paise).toBe(MAX_AMOUNT_PAISE);
    });

    it('rejects amounts exceeding ₹10,00,000', () => {
      const result = parseRupeesToPaise('1000000.01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount cannot exceed ₹10,00,000');
    });
  });

  describe('formatPaiseToINR', () => {
    it('formats paise into Indian currency with two decimals', () => {
      const formatted = formatPaiseToINR(10000000); // ₹1,00,000.00
      // Normalize any non-breaking spaces returned by Intl
      const normalized = formatted.replace(/\u00A0/g, ' ');
      expect(normalized).toContain('1,00,000.00');
      expect(normalized).toContain('₹');
    });

    it('formats single paisa correctly', () => {
      const formatted = formatPaiseToINR(1).replace(/\u00A0/g, ' ');
      expect(formatted).toContain('0.01');
    });
  });

  describe('paiseToRupeeString', () => {
    it('converts paise to decimal string with 2 digits', () => {
      expect(paiseToRupeeString(125050)).toBe('1250.50');
      expect(paiseToRupeeString(100)).toBe('1.00');
      expect(paiseToRupeeString(5)).toBe('0.05');
      expect(paiseToRupeeString(0)).toBe('0.00');
      expect(paiseToRupeeString(-350)).toBe('-3.50');
    });
  });
});
