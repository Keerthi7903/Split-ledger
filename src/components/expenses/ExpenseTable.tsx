import React from 'react';
import { Expense, Member, Category } from '../../types/expense';
import { ExpenseRow } from './ExpenseRow';
import { EmptyState } from '../common/EmptyState';

export interface ExpenseTableProps {
  expenses: Expense[];
  members: Member[];
  selectedCategory: Category | 'All';
  totalGlobalExpensesCount: number;
  onDeleteExpense: (expense: Expense) => void;
  onResetFilter: () => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  members,
  selectedCategory,
  totalGlobalExpensesCount,
  onDeleteExpense,
  onResetFilter,
}) => {
  const membersMap = new Map(members.map((m) => [m.id, m]));

  if (expenses.length === 0) {
    if (totalGlobalExpensesCount === 0) {
      return (
        <EmptyState
          title="No expenses recorded yet"
          description="Get started by recording your first shared trip expense."
          actionText="+ Add First Expense"
          actionLink="/expenses/new"
        />
      );
    }

    return (
      <EmptyState
        title={`No expenses found in "${selectedCategory}"`}
        description="Try selecting a different category or view all expenses."
        actionText="View All Expenses"
        onActionClick={onResetFilter}
      />
    );
  }

  return (
    <div className="table-responsive-wrapper">
      <table className="expense-table" aria-label="Expenses Table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Paid By</th>
            <th scope="col">Amount</th>
            <th scope="col">Split</th>
            <th scope="col" aria-label="Actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              membersMap={membersMap}
              onDelete={onDeleteExpense}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
