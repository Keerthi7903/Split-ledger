import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { setupStore } from '../app/store';
import { ExpensesPage } from './ExpensesPage';
import sampleData from '../data/sample-data.json';
import { Expense } from '../types/expense';

describe('ExpensesPage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithProviders = (initialExpenses?: Expense[]) => {
    const store = setupStore({
      expenses: {
        members: sampleData.members,
        expenses: initialExpenses ?? [...(sampleData.expenses as Expense[])],
      },
    });

    const utils = render(
      <Provider store={store}>
        <MemoryRouter>
          <ExpensesPage />
        </MemoryRouter>
      </Provider>
    );

    return { ...utils, store };
  };

  it('renders page heading and all 5 member balance cards', () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { name: /goa trip expenses/i })).toBeInTheDocument();

    // Verify all 5 member balance card headings are displayed
    expect(screen.getByRole('heading', { name: 'Aarav' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Diya' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kabir' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meera' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rohan' })).toBeInTheDocument();
  });

  it('renders all 6 initial sample expenses in the table', () => {
    renderWithProviders();

    expect(screen.getByText('Villa booking')).toBeInTheDocument();
    expect(screen.getByText('Beach shack dinner')).toBeInTheDocument();
    expect(screen.getByText('Scuba diving')).toBeInTheDocument();
    expect(screen.getByText('Scooter rental')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Airport cab')).toBeInTheDocument();
  });

  it('filters expenses by category and updates visible total', () => {
    renderWithProviders();

    // Initially showing all 6 expenses
    expect(screen.getByText(/6 expenses/i)).toBeInTheDocument();

    // Click "Food" filter
    const foodFilter = screen.getByRole('radio', { name: /^food$/i });
    fireEvent.click(foodFilter);

    // Food has 2 expenses: "Beach shack dinner" (₹3,250.00) and "Groceries" (₹1,000.00)
    // Sum = ₹4,250.00
    expect(screen.getByText('Beach shack dinner')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Villa booking')).not.toBeInTheDocument();
    expect(screen.queryByText('Scuba diving')).not.toBeInTheDocument();

    expect(screen.getByText(/2 expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/₹4,250.00/i)).toBeInTheDocument();
  });

  it('displays contextual empty state when category has no matches', () => {
    renderWithProviders();

    // Click "Other" filter (sample data has 0 "Other" expenses)
    const otherFilter = screen.getByRole('radio', { name: /^other$/i });
    fireEvent.click(otherFilter);

    expect(screen.getByText(/no expenses found in "other"/i)).toBeInTheDocument();

    // Clicking "View All Expenses" clears the filter
    const resetBtn = screen.getByRole('button', { name: /view all expenses/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText('Villa booking')).toBeInTheDocument();
    expect(screen.getByText(/6 expenses/i)).toBeInTheDocument();
  });

  it('opens confirmation modal and cancels deletion without modifying expenses', () => {
    renderWithProviders();

    const deleteVillaBtn = screen.getByRole('button', { name: /delete expense: villa booking/i });
    fireEvent.click(deleteVillaBtn);

    // Modal opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete "villa booking"/i)).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    fireEvent.click(cancelBtn);

    // Modal closes, expense remains
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Villa booking')).toBeInTheDocument();
  });

  it('deletes an expense upon confirmation and immediately recalculates balances and totals', () => {
    const { store } = renderWithProviders();

    // Total expenses count initially 6
    expect(screen.getByText(/6 expenses/i)).toBeInTheDocument();

    // Find and click delete for "Villa booking" (₹24,000.00 paid by Aarav)
    const deleteVillaBtn = screen.getByRole('button', { name: /delete expense: villa booking/i });
    fireEvent.click(deleteVillaBtn);

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /^delete expense$/i });
    fireEvent.click(confirmBtn);

    // Villa booking is gone
    expect(screen.queryByText('Villa booking')).not.toBeInTheDocument();
    expect(screen.getByText(/5 expenses/i)).toBeInTheDocument();

    // Store updated
    expect(store.getState().expenses.expenses.some((e) => e.id === 'e1')).toBe(false);
  });

  it('displays full empty state when no expenses exist in the app', () => {
    renderWithProviders([]);

    expect(screen.getByText(/no expenses recorded yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+ add first expense/i })).toBeInTheDocument();
  });
});
