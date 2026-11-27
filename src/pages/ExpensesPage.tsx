import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectMemberBalances,
  selectFilteredExpenses,
  selectFilteredTotal,
  selectAllExpenses,
  selectAllMembers,
} from '../features/expenses/selectors';
import { deleteExpense } from '../features/expenses/expenseSlice';
import { Category, Expense } from '../types/expense';
import { BalanceList } from '../components/expenses/BalanceList';
import { CategoryFilter } from '../components/expenses/CategoryFilter';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatPaiseToINR } from '../utils/money';

export const ExpensesPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // State from Redux selectors
  const members = useAppSelector(selectAllMembers);
  const allExpenses = useAppSelector(selectAllExpenses);
  const balances = useAppSelector(selectMemberBalances);

  // Component-local view state
  const location = useLocation();
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage ?? null
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {
        setFlashMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const filteredExpenses = useAppSelector((state) =>
    selectFilteredExpenses(state, selectedCategory)
  );
  const filteredTotalPaise = useAppSelector((state) =>
    selectFilteredTotal(state, selectedCategory)
  );

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      dispatch(deleteExpense(expenseToDelete.id));
      setExpenseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setExpenseToDelete(null);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Goa Trip Expenses</h1>
        <p className="page-subtitle">
          Track shared group expenses, view individual member balances, and settle payments.
        </p>
      </header>

      {/* Success Notification Banner */}
      {flashMessage && (
        <div className="flash-banner" role="status" aria-live="polite">
          <span className="flash-banner-icon" aria-hidden="true">✓</span>
          <span className="flash-banner-text">{flashMessage}</span>
          <button
            type="button"
            className="flash-banner-close"
            aria-label="Dismiss message"
            onClick={() => setFlashMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Member Balances Section */}
      <BalanceList balances={balances} />

      {/* Expenses Management Section */}
      <section className="expenses-section" aria-label="Trip Expenses List">
        <div className="expenses-section-header">
          <h2 className="section-title">Expense History</h2>
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          filteredTotalPaise={filteredTotalPaise}
          totalExpensesCount={filteredExpenses.length}
        />

        <ExpenseTable
          expenses={filteredExpenses}
          members={members}
          selectedCategory={selectedCategory}
          totalGlobalExpensesCount={allExpenses.length}
          onDeleteExpense={(exp) => setExpenseToDelete(exp)}
          onResetFilter={() => setSelectedCategory('All')}
        />
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={expenseToDelete !== null}
        title="Delete Expense"
        message={
          expenseToDelete
            ? `Are you sure you want to delete "${expenseToDelete.description}" (${formatPaiseToINR(expenseToDelete.amount)})? This will immediately recalculate all member balances.`
            : ''
        }
        confirmLabel="Delete Expense"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
