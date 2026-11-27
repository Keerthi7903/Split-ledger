/**
 * Pure Memoized Selectors for Expenses
 *
 * Derives presentation data from Redux state using pure domain calculation functions.
 * Derived balances and totals are NEVER stored directly in the Redux store.
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { Expense, Category, MemberBalance } from '../../types/expense';
import { calculateBalances } from '../../utils/balanceCalculator';

/**
 * Returns all raw expenses.
 */
export const selectAllExpenses = (state: RootState): Expense[] =>
  state.expenses.expenses;

/**
 * Returns all members.
 */
export const selectAllMembers = (state: RootState) =>
  state.expenses.members;

/**
 * Returns expenses sorted by newest date first (YYYY-MM-DD descending).
 * Uses a stable secondary sort by ID descending for determinism.
 */
export const selectSortedExpenses = createSelector(
  [selectAllExpenses],
  (expenses): Expense[] => {
    return [...expenses].sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return b.id.localeCompare(a.id);
    });
  }
);

/**
 * Returns expenses filtered by category (or all if category is 'All').
 */
export const selectFilteredExpenses = createSelector(
  [selectSortedExpenses, (_state: RootState, category: Category | 'All') => category],
  (sortedExpenses, category): Expense[] => {
    if (category === 'All') {
      return sortedExpenses;
    }
    return sortedExpenses.filter((expense) => expense.category === category);
  }
);

/**
 * Returns the total amount (in integer paise) of the currently filtered expenses.
 */
export const selectFilteredTotal = createSelector(
  [selectFilteredExpenses],
  (filteredExpenses): number => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }
);

/**
 * Returns member balances computed across all active expenses.
 */
export const selectMemberBalances = createSelector(
  [selectAllMembers, selectAllExpenses],
  (members, expenses): MemberBalance[] => {
    const result = calculateBalances(members, expenses);
    return result.balances;
  }
);
