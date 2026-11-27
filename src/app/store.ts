/**
 * Redux Store Configuration
 *
 * Configures the Redux Toolkit store with the expenses slice.
 * Automatically synchronizes changes to state.expenses.expenses with localStorage.
 */

import { configureStore } from '@reduxjs/toolkit';
import expenseReducer from '../features/expenses/expenseSlice';
import { saveExpensesToStorage } from '../storage/localStorage';
import { Expense } from '../types/expense';

export function setupStore(preloadedState?: Parameters<typeof configureStore>[0]['preloadedState']) {
  const store = configureStore({
    reducer: {
      expenses: expenseReducer,
    },
    preloadedState,
  });

  // Track the reference of state.expenses.expenses to persist only on mutations
  let previousExpenses: Expense[] = store.getState().expenses.expenses;

  store.subscribe(() => {
    const currentExpenses = store.getState().expenses.expenses;
    if (currentExpenses !== previousExpenses) {
      previousExpenses = currentExpenses;
      saveExpensesToStorage(currentExpenses);
    }
  });

  return store;
}

export const store = setupStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
