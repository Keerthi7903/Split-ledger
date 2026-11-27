import React from 'react';
import { Category, CATEGORIES } from '../../types/expense';
import { formatPaiseToINR } from '../../utils/money';

export interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
  filteredTotalPaise: number;
  totalExpensesCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  filteredTotalPaise,
  totalExpensesCount,
}) => {
  const options: (Category | 'All')[] = ['All', ...CATEGORIES];

  return (
    <div className="filter-bar">
      <div className="filter-pills" role="radiogroup" aria-label="Filter expenses by category">
        {options.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`filter-pill ${isSelected ? 'filter-pill-active' : ''}`}
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="filter-summary">
        <span className="filter-count">
          {totalExpensesCount} {totalExpensesCount === 1 ? 'expense' : 'expenses'}
        </span>
        <span className="filter-divider" aria-hidden="true">|</span>
        <span className="filter-total">
          Total shown: <strong>{formatPaiseToINR(filteredTotalPaise)}</strong>
        </span>
      </div>
    </div>
  );
};
