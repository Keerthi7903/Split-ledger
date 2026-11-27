import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';

describe('App Navigation and Routing', () => {
  it('renders the navbar and defaults to Expenses dashboard', () => {
    window.history.pushState({}, 'Test', '/');

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Navbar branding
    expect(screen.getByText('Trip Splitter')).toBeInTheDocument();

    // Navigation links
    const expensesLink = screen.getByRole('link', { name: /^expenses$/i });
    const addExpenseLink = screen.getByRole('link', { name: /\+ add expense/i });

    expect(expensesLink).toBeInTheDocument();
    expect(addExpenseLink).toBeInTheDocument();

    // Active route highlight
    expect(expensesLink).toHaveClass('nav-link-active');

    // Page content
    expect(screen.getByRole('heading', { name: /goa trip expenses/i })).toBeInTheDocument();
  });

  it('renders 404 Page Not Found for invalid routes with return link', () => {
    window.history.pushState({}, 'Test', '/some-non-existent-route');

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: /back to expenses/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });
});
