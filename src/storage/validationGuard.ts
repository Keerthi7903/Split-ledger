/**
 * Runtime Validation Guard Module
 *
 * Implements strict runtime type guards without external schema libraries.
 * Defensively validates data read from untrusted storage (localStorage) before
 * allowing it to hydrate the Redux store.
 */

import {
  Expense,
  Category,
  CATEGORIES,
  SplitDetails,
} from '../types/expense';
import { isValidCalendarDate, isFutureDate } from '../utils/date';
import { MAX_AMOUNT_PAISE } from '../utils/money';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidCategory(value: unknown): value is Category {
  return typeof value === 'string' && CATEGORIES.includes(value as Category);
}

export function isValidSplit(
  split: unknown,
  expectedTotalPaise: number,
  validMemberIds: Set<string>
): split is SplitDetails {
  if (!isRecord(split) || typeof split.type !== 'string') {
    return false;
  }

  if (split.type === 'equal') {
    if (!Array.isArray(split.memberIds) || split.memberIds.length === 0) {
      return false;
    }
    const seen = new Set<string>();
    for (const id of split.memberIds) {
      if (typeof id !== 'string' || !validMemberIds.has(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
    }
    return true;
  }

  if (split.type === 'exact') {
    if (!isRecord(split.shares)) {
      return false;
    }
    const shares = split.shares;
    let sumPaise = 0;
    const entries = Object.entries(shares);
    if (entries.length === 0) {
      return false;
    }

    for (const [id, share] of entries) {
      if (!validMemberIds.has(id)) {
        return false;
      }
      if (
        typeof share !== 'number' ||
        !Number.isSafeInteger(share) ||
        share < 0
      ) {
        return false;
      }
      sumPaise += share;
    }

    return sumPaise === expectedTotalPaise;
  }

  if (split.type === 'percent') {
    if (!isRecord(split.shares)) {
      return false;
    }
    const shares = split.shares;
    let sumBasisPoints = 0;
    const entries = Object.entries(shares);
    if (entries.length === 0) {
      return false;
    }

    for (const [id, percent] of entries) {
      if (!validMemberIds.has(id)) {
        return false;
      }
      if (typeof percent !== 'number' || Number.isNaN(percent)) {
        return false;
      }
      if (percent < 0 || percent > 100) {
        return false;
      }
      // Max 2 decimal places check
      const percentStr = percent.toString();
      const dotIndex = percentStr.indexOf('.');
      if (dotIndex !== -1 && percentStr.length - dotIndex - 1 > 2) {
        return false;
      }

      sumBasisPoints += Math.round(percent * 100);
    }

    // Must sum to exactly 100.00% (10,000 basis points)
    return sumBasisPoints === 10000;
  }

  return false;
}

export function isValidExpense(
  item: unknown,
  validMemberIds: Set<string>
): item is Expense {
  if (!isRecord(item)) {
    return false;
  }

  // 1. id
  if (typeof item.id !== 'string' || !item.id.trim()) {
    return false;
  }

  // 2. description
  if (
    typeof item.description !== 'string' ||
    !item.description.trim() ||
    item.description.length > 60
  ) {
    return false;
  }

  // 3. amount
  if (
    typeof item.amount !== 'number' ||
    !Number.isSafeInteger(item.amount) ||
    item.amount <= 0 ||
    item.amount > MAX_AMOUNT_PAISE
  ) {
    return false;
  }

  // 4. paidBy
  if (typeof item.paidBy !== 'string' || !validMemberIds.has(item.paidBy)) {
    return false;
  }

  // 5. date
  if (
    typeof item.date !== 'string' ||
    !isValidCalendarDate(item.date) ||
    isFutureDate(item.date)
  ) {
    return false;
  }

  // 6. category
  if (!isValidCategory(item.category)) {
    return false;
  }

  // 7. split
  return isValidSplit(item.split, item.amount, validMemberIds);
}

export function isValidExpensesArray(
  data: unknown,
  validMemberIds: Set<string>
): data is Expense[] {
  if (!Array.isArray(data)) {
    return false;
  }
  return data.every((item) => isValidExpense(item, validMemberIds));
}
