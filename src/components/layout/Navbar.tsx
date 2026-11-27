import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">💳</span>
          <span className="brand-title">Trip Splitter</span>
        </NavLink>

        <nav className="navbar-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Expenses
          </NavLink>
          <NavLink
            to="/expenses/new"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            + Add Expense
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
