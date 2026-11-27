/**
 * Money Utility Module
 *
 * Implements strict integer-based currency conversion and Indian formatting.
 *
 * Design Rule:
 * All internal arithmetic operates strictly on integer paise (1 INR = 100 paise)
 * to eliminate IEEE 754 floating-point rounding anomalies.
 */

export interface MoneyParseResult {
  isValid: boolean;
  paise: number;
  error?: string;
}

export const MAX_AMOUNT_RUPEES = 1_000_000;
export const MAX_AMOUNT_PAISE = MAX_AMOUNT_RUPEES * 100; // 100,000,000 paise

/**
 * Parses a rupee input string directly into integer paise without floating-point math.
 *
 * Rules:
 * - Rejects empty string -> "Amount is required"
 * - Rejects scientific notation (e.g. 1e5) -> "Scientific notation is not allowed"
 * - Rejects negative values -> "Amount must be more than ₹0"
 * - Validates format: digits, optional decimal point, at most 2 decimal places
 * - Rejects zero or negative amounts -> "Amount must be more than ₹0"
 * - Rejects amounts > ₹10,00,000 -> "Amount cannot exceed ₹10,00,000"
 */
export function parseRupeesToPaise(input: string): MoneyParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { isValid: false, paise: 0, error: 'Amount is required' };
  }

  // Reject scientific notation
  if (/e/i.test(trimmed)) {
    return { isValid: false, paise: 0, error: 'Scientific notation is not allowed' };
  }

  // Reject negative inputs
  if (trimmed.startsWith('-')) {
    return { isValid: false, paise: 0, error: 'Amount must be more than ₹0' };
  }

  // Validate format: integer or up to 2 decimal places
  const rupeePattern = /^\d+(\.\d{1,2})?$/;
  if (!rupeePattern.test(trimmed)) {
    return {
      isValid: false,
      paise: 0,
      error: 'Enter a valid amount with at most 2 decimal places',
    };
  }

  const [wholeStr = '0', fracStr = ''] = trimmed.split('.');
  const whole = parseInt(wholeStr, 10);
  const frac = parseInt(fracStr.padEnd(2, '0').slice(0, 2), 10);

  if (Number.isNaN(whole) || Number.isNaN(frac)) {
    return { isValid: false, paise: 0, error: 'Enter a valid amount' };
  }

  const totalPaise = whole * 100 + frac;

  if (totalPaise <= 0) {
    return { isValid: false, paise: 0, error: 'Amount must be more than ₹0' };
  }

  if (totalPaise > MAX_AMOUNT_PAISE) {
    return { isValid: false, paise: 0, error: 'Amount cannot exceed ₹10,00,000' };
  }

  return { isValid: true, paise: totalPaise };
}

/**
 * Formats an integer paise value into Indian currency format (e.g. ₹1,00,000.00).
 */
export function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Converts integer paise back into a plain decimal string (e.g. 125050 -> "1250.50").
 * Useful for prepopulating input fields.
 */
export function paiseToRupeeString(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const whole = Math.floor(absPaise / 100);
  const frac = (absPaise % 100).toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}${whole}.${frac}`;
}
