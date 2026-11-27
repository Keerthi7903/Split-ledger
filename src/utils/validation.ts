/**
 * Validation Utility Module
 *
 * Implements pure validation functions according to the assignment requirements.
 * Validates every field and split type, returning an errors map for simultaneous display.
 */

import { Category, CATEGORIES } from '../types/expense';
import { parseRupeesToPaise, formatPaiseToINR } from './money';
import { isValidCalendarDate, isFutureDate } from './date';

export interface FormValidationErrors {
  description?: string;
  amount?: string;
  paidBy?: string;
  date?: string;
  category?: string;
  split?: string;
  memberShares?: Record<string, string>;
}

export interface ValidationInput {
  description: string;
  amountRupees: string;
  paidBy: string;
  date: string;
  category: string;
  splitType: 'equal' | 'exact' | 'percent';
  equalMemberIds: string[];
  exactSharesRupees: Record<string, string>; // memberId -> rupee string
  percentShares: Record<string, string>;      // memberId -> percentage string
  validMemberIds: string[];
}

export function validateExpenseForm(
  input: ValidationInput,
  todayString?: string
): {
  isValid: boolean;
  errors: FormValidationErrors;
  parsedAmountPaise: number;
} {
  const errors: FormValidationErrors = {};
  const memberErrors: Record<string, string> = {};

  // 1. Description: required, at most 60 characters
  const trimmedDesc = input.description.trim();
  if (!trimmedDesc) {
    errors.description = 'Description is required';
  } else if (trimmedDesc.length > 60) {
    errors.description = 'Description must be at most 60 characters';
  }

  // 2. Amount: required, > 0, <= 10,00,000, max 2 decimals
  const moneyResult = parseRupeesToPaise(input.amountRupees);
  if (!moneyResult.isValid) {
    errors.amount = moneyResult.error;
  }
  const totalAmountPaise = moneyResult.paise;

  // 3. Paid by: required
  if (!input.paidBy || !input.validMemberIds.includes(input.paidBy)) {
    errors.paidBy = 'Paid by is required';
  }

  // 4. Date: required, cannot be in future
  if (!input.date) {
    errors.date = 'Date is required';
  } else if (!isValidCalendarDate(input.date)) {
    errors.date = 'Enter a valid date in YYYY-MM-DD format';
  } else if (isFutureDate(input.date, todayString)) {
    errors.date = 'The date cannot be in the future';
  }

  // 5. Category: required, valid union
  if (!input.category) {
    errors.category = 'Category is required';
  } else if (!CATEGORIES.includes(input.category as Category)) {
    errors.category = 'Select a valid category';
  }

  // 6. Split validation (only validate the ACTIVE split type)
  if (input.splitType === 'equal') {
    if (input.equalMemberIds.length === 0) {
      errors.split = 'Select at least one member';
    }
  } else if (input.splitType === 'exact') {
    let assignedPaiseTotal = 0;
    let hasIndividualError = false;

    for (const memberId of input.validMemberIds) {
      const shareStr = (input.exactSharesRupees[memberId] ?? '').trim();
      if (!shareStr) {
        continue;
      }

      // Check scientific notation
      if (/e/i.test(shareStr)) {
        memberErrors[memberId] = 'Invalid amount';
        hasIndividualError = true;
        continue;
      }

      // Negative check
      if (shareStr.startsWith('-')) {
        memberErrors[memberId] = 'Share cannot be negative';
        hasIndividualError = true;
        continue;
      }

      if (!/^\d+(\.\d{1,2})?$/.test(shareStr)) {
        memberErrors[memberId] = 'Max 2 decimals';
        hasIndividualError = true;
        continue;
      }

      const [wholeStr = '0', fracStr = ''] = shareStr.split('.');
      const whole = parseInt(wholeStr, 10);
      const frac = parseInt(fracStr.padEnd(2, '0').slice(0, 2), 10);
      const sharePaise = whole * 100 + frac;

      assignedPaiseTotal += sharePaise;
    }

    if (!hasIndividualError && moneyResult.isValid) {
      const diffPaise = totalAmountPaise - assignedPaiseTotal;
      if (diffPaise > 0) {
        errors.split = `${formatPaiseToINR(diffPaise)} left to assign`;
      } else if (diffPaise < 0) {
        errors.split = `${formatPaiseToINR(Math.abs(diffPaise))} over assigned`;
      }
    }
  } else if (input.splitType === 'percent') {
    let totalBasisPoints = 0;
    let hasIndividualError = false;

    for (const memberId of input.validMemberIds) {
      const percentStr = (input.percentShares[memberId] ?? '').trim();
      if (!percentStr) {
        continue;
      }

      // Reject non-numeric / negative / scientific
      if (!/^\d+(\.\d{1,2})?$/.test(percentStr)) {
        memberErrors[memberId] = 'Must be between 0 and 100 with max 2 decimals';
        hasIndividualError = true;
        continue;
      }

      const val = parseFloat(percentStr);
      if (val < 0 || val > 100) {
        memberErrors[memberId] = 'Must be between 0 and 100';
        hasIndividualError = true;
        continue;
      }

      // Convert to integer basis points (33.33 -> 3333)
      const basisPoints = Math.round(val * 100);
      totalBasisPoints += basisPoints;
    }

    if (!hasIndividualError) {
      if (totalBasisPoints !== 10000) {
        const currentPercent = (totalBasisPoints / 100).toFixed(2);
        errors.split = `Percentages must equal exactly 100% (currently ${currentPercent}%)`;
      }
    }
  }

  if (Object.keys(memberErrors).length > 0) {
    errors.memberShares = memberErrors;
  }

  const isValid =
    Object.keys(errors).length === 0 &&
    Object.keys(memberErrors).length === 0 &&
    moneyResult.isValid;

  return {
    isValid,
    errors,
    parsedAmountPaise: totalAmountPaise,
  };
}
