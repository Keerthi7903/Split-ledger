/**
 * Expenses Redux Slice
 *
 * Manages raw entities: members and expenses.
 * Derived data (balances, filtered views, totals) is computed via selectors.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Expense, Member } from '../../types/expense';
import sampleData from '../../data/sample-data.json';
import { loadInitialExpenses } from '../../storage/localStorage';

export interface ExpensesState {
  members: Member[];
  expenses: Expense[];
}

const validMemberIds = new Set(sampleData.members.map((m) => m.id));

export const initialState: ExpensesState = {
  members: sampleData.members,
  expenses: loadInitialExpenses(validMemberIds, sampleData.expenses as Expense[]),
};

export const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.push(action.payload);
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((expense) => expense.id !== action.payload);
    },
    resetToSampleData: (state) => {
      state.expenses = [...(sampleData.expenses as Expense[])];
    },
  },
});

export const { addExpense, deleteExpense, resetToSampleData } = expenseSlice.actions;
export default expenseSlice.reducer;
