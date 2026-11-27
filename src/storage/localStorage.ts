/**
 * LocalStorage Persistence Engine
 *
 * Provides safe reading, writing, and fallback mechanisms for application expenses.
 * Handles storage quota limits, private browsing security restrictions, and corrupted JSON.
 */

import { Expense } from '../types/expense';
import { isValidExpensesArray } from './validationGuard';

export const STORAGE_KEY = 'trip_splitter_expenses_v1';

/**
 * Reads and validates saved expenses from localStorage.
 * If storage is empty, corrupted, structurally invalid, or inaccessible,
 * it returns the provided fallbackExpenses (sample data).
 */
export function loadInitialExpenses(
  validMemberIds: Set<string>,
  fallbackExpenses: Expense[]
): Expense[] {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return fallbackExpenses;
    }

    const parsedData: unknown = JSON.parse(rawData);

    if (isValidExpensesArray(parsedData, validMemberIds)) {
      return parsedData;
    }

    console.warn(
      '[Storage] Saved data failed runtime schema validation. Recovering with sample data.'
    );
    return fallbackExpenses;
  } catch (err) {
    console.warn(
      '[Storage] Failed to read or parse localStorage data. Recovering with sample data.',
      err
    );
    return fallbackExpenses;
  }
}

/**
 * Safely persists expenses to localStorage.
 * Silently catches QuotaExceededError or SecurityError to prevent UI crashes.
 */
export function saveExpensesToStorage(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.warn('[Storage] Failed to persist expenses to localStorage:', err);
  }
}
