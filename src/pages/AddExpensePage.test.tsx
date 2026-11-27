import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupStore } from '../app/store';
import { AddExpensePage } from './AddExpensePage';
import { ExpensesPage } from './ExpensesPage';
import sampleData from '../data/sample-data.json';
import { Expense } from '../types/expense';

describe('AddExpensePage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithProviders = (initialRoute = '/expenses/new') => {
    const store = setupStore({
      expenses: {
        members: sampleData.members,
        expenses: [...(sampleData.expenses as Expense[])],
      },
    });

    const utils = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<ExpensesPage />} />
            <Route path="/expenses/new" element={<AddExpensePage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    return { ...utils, store };
  };

  it('renders all required form fields and default values', () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { name: /add expense/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount in ₹/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paid by/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /split method/i })).toBeInTheDocument();

    // Default split method is 'equal'
    expect(screen.getByRole('radio', { name: /equally/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: /save expense/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
  });

  it('displays multiple validation errors simultaneously when saving an empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    // Clear default date and deselect all members to trigger all errors
    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);

    const selectAllBtn = screen.getByRole('button', { name: /deselect all/i });
    await user.click(selectAllBtn);

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveBtn);

    // Verify all applicable errors appear together
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(screen.getByText('Select at least one member')).toBeInTheDocument();
  });

  it('shows exact negative amount error: "Amount must be more than ₹0"', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const amountInput = screen.getByLabelText(/amount in ₹/i);
    await user.type(amountInput, '-50');

    const saveBtn = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveBtn);

    expect(screen.getByText('Amount must be more than ₹0')).toBeInTheDocument();
  });

  it('rejects description longer than 60 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const descInput = screen.getByLabelText(/description/i);
    // Directly fire change to bypass input maxLength for validation test
    fireEvent.change(descInput, { target: { value: 'A'.repeat(65) } });

    const saveBtn = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveBtn);

    expect(screen.getByText('Description must be at most 60 characters')).toBeInTheDocument();
  });

  it('rejects future date with error message', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');

    const saveBtn = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveBtn);

    expect(screen.getByText('The date cannot be in the future')).toBeInTheDocument();
  });

  it('switches between split methods dynamically and renders respective fields', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    // Default is equal split (checkboxes)
    expect(screen.getByText('Select Participants')).toBeInTheDocument();

    // Switch to Exact amounts
    const exactTab = screen.getByRole('radio', { name: /exact amounts/i });
    await user.click(exactTab);

    expect(screen.getByText(/assign exact amounts/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Aarav')).toBeInTheDocument();

    // Switch to Percentages
    const percentTab = screen.getByRole('radio', { name: /percentages/i });
    await user.click(percentTab);

    expect(screen.getByText(/assign percentages/i)).toBeInTheDocument();
    expect(screen.getByText(/total: 0.00% \/ 100%/i)).toBeInTheDocument();
  });

  it('validates exact split sum and blocks save when under-allocated', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await user.type(screen.getByLabelText(/description/i), 'Go Karting');
    await user.type(screen.getByLabelText(/amount in ₹/i), '1000');

    // Switch to Exact amounts
    await user.click(screen.getByRole('radio', { name: /exact amounts/i }));

    // Assign 400 to Aarav, 400 to Diya (800 total, 200 remaining)
    await user.type(screen.getByLabelText('Aarav'), '400');
    await user.type(screen.getByLabelText('Diya'), '400');

    // Save
    await user.click(screen.getByRole('button', { name: /save expense/i }));

    expect(screen.getAllByText(/left to assign/i).length).toBeGreaterThanOrEqual(1);
  });

  it('validates percentage split and blocks save when total is not 100%', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await user.type(screen.getByLabelText(/description/i), 'Boat Ride');
    await user.type(screen.getByLabelText(/amount in ₹/i), '1500');

    // Switch to Percentages
    await user.click(screen.getByRole('radio', { name: /percentages/i }));

    // Assign 50% to Aarav, 30% to Diya (80% total)
    await user.type(screen.getByLabelText('Aarav'), '50');
    await user.type(screen.getByLabelText('Diya'), '30');

    await user.click(screen.getByRole('button', { name: /save expense/i }));

    expect(screen.getByText(/percentages must equal exactly 100%/i)).toBeInTheDocument();
  });

  it('successfully creates an equal split expense, updates Redux, and navigates back with flash message', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders();

    const initialCount = store.getState().expenses.expenses.length;

    await user.type(screen.getByLabelText(/description/i), 'Parasailing Adventure');
    await user.type(screen.getByLabelText(/amount in ₹/i), '4500.00');

    // Save
    await user.click(screen.getByRole('button', { name: /save expense/i }));

    // Verify navigation back to ExpensesPage
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /goa trip expenses/i })).toBeInTheDocument();
    });

    // Flash message banner is displayed
    expect(screen.getByText(/expense "parasailing adventure" was added successfully!/i)).toBeInTheDocument();

    // Redux state updated with integer paise (450000 paise)
    const expenses = store.getState().expenses.expenses;
    expect(expenses).toHaveLength(initialCount + 1);
    const added = expenses[expenses.length - 1];
    expect(added?.description).toBe('Parasailing Adventure');
    expect(added?.amount).toBe(450000);
    expect(added?.split.type).toBe('equal');
  });

  it('successfully creates an exact split expense and stores shares in integer paise', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders();

    await user.type(screen.getByLabelText(/description/i), 'Seafood Platter');
    await user.type(screen.getByLabelText(/amount in ₹/i), '1200.00');

    await user.click(screen.getByRole('radio', { name: /exact amounts/i }));
    await user.type(screen.getByLabelText('Aarav'), '600.00');
    await user.type(screen.getByLabelText('Diya'), '600.00');

    await user.click(screen.getByRole('button', { name: /save expense/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /goa trip expenses/i })).toBeInTheDocument();
    });

    const expenses = store.getState().expenses.expenses;
    const added = expenses[expenses.length - 1];
    expect(added?.description).toBe('Seafood Platter');
    expect(added?.amount).toBe(120000);
    expect(added?.split.type).toBe('exact');
    if (added?.split.type === 'exact') {
      expect(added.split.shares['m1']).toBe(60000);
      expect(added.split.shares['m2']).toBe(60000);
    }
  });

  it('cancel button navigates back without saving anything', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders();

    const initialCount = store.getState().expenses.expenses.length;

    await user.type(screen.getByLabelText(/description/i), 'Unfinished Expense');
    await user.type(screen.getByLabelText(/amount in ₹/i), '999');

    // Click Cancel
    await user.click(screen.getByRole('link', { name: /cancel/i }));

    // Back on Expenses dashboard
    expect(screen.getByRole('heading', { name: /goa trip expenses/i })).toBeInTheDocument();

    // No expense added
    expect(store.getState().expenses.expenses).toHaveLength(initialCount);
  });
});
