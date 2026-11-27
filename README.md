# Trip Splitter

A minimal, offline-first group expense tracking and settlement application built for five friends following their trip to Goa.

## How to Install and Run

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Setup
```bash
npm install
npm run dev
```

### Verification Scripts
```bash
npm run typecheck    # Strict TypeScript verification (tsc --noEmit)
npm run lint         # ESLint Flat Config verification
npm run test         # Vitest unit and integration test suite
npm run build        # Production bundle build (Vite)
```

---

## Unfinished Functionality & Known Limitations

1. **Fixed Roster**: Group members are fixed to the five specified friends (Aarav, Diya, Kabir, Meera, Rohan). Adding or removing members is not supported.
2. **Single Currency**: All calculations and views are strictly denominated in Indian Rupees (INR / ₹) with integer paise. Multi-currency exchange is not supported.
3. **Expense Editing**: Expenses can be created and deleted with immediate balance recalculation; in-place editing of existing expenses is not implemented.

---

## Three Key Technical Decisions

### 1. Pure Integer Arithmetic (Paise & Basis Points)
JavaScript's IEEE 754 floating-point numbers introduce rounding errors (e.g. `0.1 + 0.2 !== 0.3`), causing lost or invented paise in financial apps.
- **Rupees**: Parsed and stored strictly as integer paise ($1\text{ INR} = 100\text{ paise}$).
- **Percentages**: Stored and calculated as integer basis points ($1\% = 100\text{ bps}$, $100\% = 10,000\text{ bps}$).
- **Splits**: Equal splits distribute remainder paise in participant order. Percentage splits use the Largest Remainder Method (Hare-Niemeyer) with canonical member order tie-breaking.
This guarantees $\sum \text{Shares} \equiv \text{Amount}$ down to the single paisa without floating-point math.

### 2. Normalized Redux State with Pure Derived Selectors
Only raw entities (`members` and `expenses`) are stored in Redux Toolkit. Derived values—member balances, filtered expenses, and visible totals—are never duplicated in state. Instead, pure memoized selectors (`createSelector`) compute them on-the-fly. This preserves a single source of truth and prevents state synchronization bugs. Form input keystrokes remain component-local.

### 3. Fail-Safe Persistence with Custom Runtime Type Guards
Expenses persist to `localStorage` via a synchronous store subscriber (`store.subscribe`) that triggers only when the expenses array reference mutates. On startup, a handcrafted recursive type guard validates all stored fields (IDs, descriptions, integer amounts, categories, dates, and split sums) without external schema libraries. Corrupted JSON or invalid structures gracefully fall back to the bundled sample data.

---

## What Could Be Improved with Another Day

1. **Debt Simplification**: Implement a greedy cash-flow settlement algorithm ("Aarav pays Kabir ₹554.08") to settle all balances in the minimum number of transactions.
2. **Export / Import**: Support exporting and importing trip ledgers as JSON or CSV files.
3. **Receipt Photos**: Allow attaching receipt images stored locally in IndexedDB.

---

## AI Usage Disclosure

AI assistance (ChatGPT Plus, Claude, and Gemini via Antigravity) was used as an architectural sounding board, code reviewer, and technical mentor. The architecture, mathematical invariants, type design, and test criteria were actively directed, reviewed, and validated to ensure strict compliance with all assignment requirements.
