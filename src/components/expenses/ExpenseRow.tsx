import React from 'react';
import { Expense, Member } from '../../types/expense';
import { formatPaiseToINR } from '../../utils/money';

export interface ExpenseRowProps {
  expense: Expense;
  membersMap: Map<string, Member>;
  onDelete: (expense: Expense) => void;
}

export function formatSplitSummary(expense: Expense): string {
  switch (expense.split.type) {
    case 'equal': {
      const count = expense.split.memberIds.length;
      return `Equally, ${count} ${count === 1 ? 'person' : 'people'}`;
    }
    case 'exact': {
      const count = Object.keys(expense.split.shares).length;
      return `Exact, ${count} ${count === 1 ? 'person' : 'people'}`;
    }
    case 'percent': {
      const count = Object.keys(expense.split.shares).length;
      return `Percentage, ${count} ${count === 1 ? 'person' : 'people'}`;
    }
  }
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  membersMap,
  onDelete,
}) => {
  const payerName = membersMap.get(expense.paidBy)?.name ?? expense.paidBy;
  const splitText = formatSplitSummary(expense);
  const formattedAmount = formatPaiseToINR(expense.amount);

  return (
    <tr className="expense-table-row">
      <td className="expense-cell-date">{expense.date}</td>
      <td className="expense-cell-desc">
        <span className="expense-desc-text">{expense.description}</span>
      </td>
      <td className="expense-cell-category">
        <span className={`category-badge category-badge-${expense.category.toLowerCase()}`}>
          {expense.category}
        </span>
      </td>
      <td className="expense-cell-payer">{payerName}</td>
      <td className="expense-cell-amount">{formattedAmount}</td>
      <td className="expense-cell-split">
        <span className="split-summary-badge">{splitText}</span>
      </td>
      <td className="expense-cell-actions">
        <button
          type="button"
          className="btn-icon-danger"
          aria-label={`Delete expense: ${expense.description}`}
          title={`Delete ${expense.description}`}
          onClick={() => onDelete(expense)}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
};
