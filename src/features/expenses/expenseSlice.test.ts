import { describe, it, expect, beforeEach } from 'vitest';
import expenseReducer, {
  addExpense,
  deleteExpense,
  resetToSampleData,
  ExpensesState,
} from './expenseSlice';
import {
  selectAllExpenses,
  selectSortedExpenses,
  selectFilteredExpenses,
  selectFilteredTotal,
  selectMemberBalances,
} from './selectors';
import { setupStore, RootState } from '../../app/store';
import { Expense } from '../../types/expense';
import sampleData from '../../data/sample-data.json';
import { STORAGE_KEY } from '../../storage/localStorage';

describe('Redux expenseSlice and Selectors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const getBaseState = (): ExpensesState => ({
    members: sampleData.members,
    expenses: [...(sampleData.expenses as Expense[])],
  });

  it('adds an expense to the state', () => {
    const state = getBaseState();
    const newExpense: Expense = {
      id: 'e_test_add',
      description: 'Breakfast',
      amount: 15000,
      paidBy: 'm1',
      date: '2026-03-16',
      category: 'Food',
      split: { type: 'equal', memberIds: ['m1', 'm2'] },
    };

    const nextState = expenseReducer(state, addExpense(newExpense));
    expect(nextState.expenses).toHaveLength(state.expenses.length + 1);
    expect(nextState.expenses[nextState.expenses.length - 1]).toEqual(newExpense);
  });

  it('deletes an expense from the state by ID', () => {
    const state = getBaseState();
    const targetId = 'e1';

    const nextState = expenseReducer(state, deleteExpense(targetId));
    expect(nextState.expenses).toHaveLength(state.expenses.length - 1);
    expect(nextState.expenses.some((e) => e.id === targetId)).toBe(false);
  });

  it('resets expenses back to sample data', () => {
    const state: ExpensesState = {
      members: sampleData.members,
      expenses: [],
    };

    const nextState = expenseReducer(state, resetToSampleData());
    expect(nextState.expenses).toHaveLength(sampleData.expenses.length);
  });

  describe('Selectors', () => {
    const mockRootState: RootState = {
      expenses: {
        members: sampleData.members,
        expenses: [
          {
            id: 'e_old',
            description: 'Old Expense',
            amount: 10000,
            paidBy: 'm1',
            date: '2026-03-10',
            category: 'Food',
            split: { type: 'equal', memberIds: ['m1'] },
          },
          {
            id: 'e_new',
            description: 'New Expense',
            amount: 20000,
            paidBy: 'm2',
            date: '2026-03-15',
            category: 'Travel',
            split: { type: 'equal', memberIds: ['m2'] },
          },
        ],
      },
    };

    it('selectAllExpenses returns all expenses', () => {
      const expenses = selectAllExpenses(mockRootState);
      expect(expenses).toHaveLength(2);
    });

    it('selectSortedExpenses sorts by newest date first', () => {
      const sorted = selectSortedExpenses(mockRootState);
      expect(sorted[0]?.id).toBe('e_new'); // 2026-03-15
      expect(sorted[1]?.id).toBe('e_old'); // 2026-03-10
    });

    it('selectFilteredExpenses filters by category and returns all for "All"', () => {
      const allExpenses = selectFilteredExpenses(mockRootState, 'All');
      expect(allExpenses).toHaveLength(2);

      const foodExpenses = selectFilteredExpenses(mockRootState, 'Food');
      expect(foodExpenses).toHaveLength(1);
      expect(foodExpenses[0]?.id).toBe('e_old');

      const stayExpenses = selectFilteredExpenses(mockRootState, 'Stay');
      expect(stayExpenses).toHaveLength(0);
    });

    it('selectFilteredTotal returns sum of paise of filtered expenses', () => {
      const totalAll = selectFilteredTotal(mockRootState, 'All');
      expect(totalAll).toBe(30000); // 10000 + 20000

      const totalFood = selectFilteredTotal(mockRootState, 'Food');
      expect(totalFood).toBe(10000);

      const totalStay = selectFilteredTotal(mockRootState, 'Stay');
      expect(totalStay).toBe(0);
    });

    it('selectMemberBalances computes net balances and updates immediately upon deletion', () => {
      const store = setupStore({
        expenses: getBaseState(),
      });

      const initialBalances = selectMemberBalances(store.getState());
      expect(initialBalances).toHaveLength(5);

      // Aarav (m1) paid 2400000 for Villa booking (e1).
      // If e1 is deleted, Aarav's balance should immediately change.
      const initialAarav = initialBalances.find((b) => b.memberId === 'm1');
      expect(initialAarav).toBeDefined();

      store.dispatch(deleteExpense('e1'));

      const updatedBalances = selectMemberBalances(store.getState());
      const updatedAarav = updatedBalances.find((b) => b.memberId === 'm1');

      expect(updatedAarav?.paidPaise).toBe((initialAarav?.paidPaise ?? 0) - 2400000);

      // Verify zero-sum invariant holds after deletion
      const netSum = updatedBalances.reduce((sum, b) => sum + b.netPaise, 0);
      expect(netSum).toBe(0);
    });

    it('persists changes to localStorage when store dispatches actions', () => {
      const store = setupStore({
        expenses: getBaseState(),
      });

      const newExpense: Expense = {
        id: 'e_sync_test',
        description: 'Auto persisted item',
        amount: 5000,
        paidBy: 'm4',
        date: '2026-03-14',
        category: 'Food',
        split: { type: 'equal', memberIds: ['m4'] },
      };

      store.dispatch(addExpense(newExpense));

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as Expense[];
      expect(parsed.some((e) => e.id === 'e_sync_test')).toBe(true);
    });
  });
});
