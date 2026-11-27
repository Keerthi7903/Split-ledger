import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectAllMembers } from '../features/expenses/selectors';
import { addExpense } from '../features/expenses/expenseSlice';
import { Category, CATEGORIES, Expense, SplitDetails } from '../types/expense';
import { getLocalTodayString } from '../utils/date';
import { parseRupeesToPaise } from '../utils/money';
import { validateExpenseForm, FormValidationErrors } from '../utils/validation';
import { FormField } from '../components/form/FormField';
import { SplitMethodSelector, SplitMethod } from '../components/form/SplitMethodSelector';
import { EqualSplitFields } from '../components/form/EqualSplitFields';
import { ExactSplitFields } from '../components/form/ExactSplitFields';
import { PercentSplitFields } from '../components/form/PercentSplitFields';
import { Button } from '../components/common/Button';

export const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectAllMembers);
  const memberIds = members.map((m) => m.id);

  // Form State
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? 'm1');
  const [date, setDate] = useState(getLocalTodayString());
  const [category, setCategory] = useState<Category>('Food');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');

  // Split-specific state
  const [equalMemberIds, setEqualMemberIds] = useState<string[]>(memberIds);
  const [exactSharesRupees, setExactSharesRupees] = useState<Record<string, string>>({});
  const [percentShares, setPercentShares] = useState<Record<string, string>>({});

  // Validation errors state
  const [errors, setErrors] = useState<FormValidationErrors>({});

  // Real-time parsed amount in paise for live split calculation previews
  const parsedAmountPaise = parseRupeesToPaise(amountRupees).paise;

  // Handlers for Equal Split
  const handleToggleEqualMember = (memberId: string) => {
    setEqualMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAllEqual = () => {
    if (equalMemberIds.length === members.length) {
      setEqualMemberIds([]);
    } else {
      setEqualMemberIds(members.map((m) => m.id));
    }
  };

  // Handlers for Exact Split
  const handleChangeExactShare = (memberId: string, value: string) => {
    setExactSharesRupees((prev) => ({ ...prev, [memberId]: value }));
  };

  // Handlers for Percent Split
  const handleChangePercentShare = (memberId: string, value: string) => {
    setPercentShares((prev) => ({ ...prev, [memberId]: value }));
  };

  // Submission handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = validateExpenseForm({
      description,
      amountRupees,
      paidBy,
      date,
      category,
      splitType: splitMethod,
      equalMemberIds,
      exactSharesRupees,
      percentShares,
      validMemberIds: memberIds,
    });

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    // Build the concrete SplitDetails object based ONLY on the active split method
    let splitDetails: SplitDetails;

    if (splitMethod === 'equal') {
      splitDetails = {
        type: 'equal',
        memberIds: equalMemberIds,
      };
    } else if (splitMethod === 'exact') {
      const sharesPaise: Record<string, number> = {};
      for (const mId of memberIds) {
        const valStr = (exactSharesRupees[mId] ?? '').trim();
        if (valStr) {
          const [wholeStr = '0', fracStr = ''] = valStr.split('.');
          const whole = parseInt(wholeStr, 10);
          const frac = parseInt(fracStr.padEnd(2, '0').slice(0, 2), 10);
          sharesPaise[mId] = whole * 100 + frac;
        } else {
          sharesPaise[mId] = 0;
        }
      }
      splitDetails = {
        type: 'exact',
        shares: sharesPaise,
      };
    } else {
      const sharesNum: Record<string, number> = {};
      for (const mId of memberIds) {
        const valStr = (percentShares[mId] ?? '').trim();
        if (valStr) {
          sharesNum[mId] = parseFloat(valStr);
        } else {
          sharesNum[mId] = 0;
        }
      }
      splitDetails = {
        type: 'percent',
        shares: sharesNum,
      };
    }

    const newExpense: Expense = {
      id: `e_${Date.now()}`,
      description: description.trim(),
      amount: validationResult.parsedAmountPaise,
      paidBy,
      date,
      category,
      split: splitDetails,
    };

    dispatch(addExpense(newExpense));

    // Navigate back to expenses with flash message
    navigate('/', {
      replace: true,
      state: {
        flashMessage: `Expense "${newExpense.description}" was added successfully!`,
      },
    });
  };

  return (
    <div className="page-container form-page-container">
      <header className="page-header">
        <h1 className="page-title">Add Expense</h1>
        <p className="page-subtitle">
          Record a new shared trip expense and configure participant allocations.
        </p>
      </header>

      <form onSubmit={handleSave} className="expense-form" noValidate>
        {/* Description */}
        <FormField
          label="Description"
          htmlFor="expense-description"
          required
          error={errors.description}
          helpText="Briefly describe what this expense was for (max 60 characters)."
        >
          <input
            id="expense-description"
            type="text"
            maxLength={60}
            placeholder="e.g. Dinner at Beach Shack"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`form-input ${errors.description ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'expense-description-error' : undefined}
          />
        </FormField>

        {/* Amount in Rupees */}
        <FormField
          label="Amount in ₹"
          htmlFor="expense-amount"
          required
          error={errors.amount}
          helpText="Enter the total expense in rupees (e.g. 1250.50)."
        >
          <div className="input-with-prefix">
            <span className="input-prefix" aria-hidden="true">₹</span>
            <input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className={`form-input input-has-prefix ${errors.amount ? 'input-error' : ''}`}
              aria-required="true"
              aria-invalid={errors.amount ? 'true' : 'false'}
              aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
            />
          </div>
        </FormField>

        {/* Paid By & Date Row */}
        <div className="form-row-two-col">
          <FormField
            label="Paid by"
            htmlFor="expense-paid-by"
            required
            error={errors.paidBy}
          >
            <select
              id="expense-paid-by"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className={`form-select ${errors.paidBy ? 'input-error' : ''}`}
              aria-required="true"
              aria-invalid={errors.paidBy ? 'true' : 'false'}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Date"
            htmlFor="expense-date"
            required
            error={errors.date}
          >
            <input
              id="expense-date"
              type="date"
              max={getLocalTodayString()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`form-input ${errors.date ? 'input-error' : ''}`}
              aria-required="true"
              aria-invalid={errors.date ? 'true' : 'false'}
              aria-describedby={errors.date ? 'expense-date-error' : undefined}
            />
          </FormField>
        </div>

        {/* Category */}
        <FormField
          label="Category"
          htmlFor="expense-category"
          required
          error={errors.category}
        >
          <select
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={`form-select ${errors.category ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={errors.category ? 'true' : 'false'}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </FormField>

        {/* Split Method Selector */}
        <SplitMethodSelector
          selectedMethod={splitMethod}
          onSelectMethod={(method) => {
            setSplitMethod(method);
            // Clear split errors on method switch
            setErrors((prev) => ({ ...prev, split: undefined, memberShares: undefined }));
          }}
        />

        {/* Dynamic Split Sections */}
        {splitMethod === 'equal' && (
          <EqualSplitFields
            members={members}
            selectedMemberIds={equalMemberIds}
            onToggleMember={handleToggleEqualMember}
            onSelectAll={handleSelectAllEqual}
            totalAmountPaise={parsedAmountPaise}
            error={errors.split}
          />
        )}

        {splitMethod === 'exact' && (
          <ExactSplitFields
            members={members}
            sharesRupees={exactSharesRupees}
            onChangeShare={handleChangeExactShare}
            totalAmountPaise={parsedAmountPaise}
            error={errors.split}
            memberErrors={errors.memberShares}
          />
        )}

        {splitMethod === 'percent' && (
          <PercentSplitFields
            members={members}
            sharesPercent={percentShares}
            onChangePercent={handleChangePercentShare}
            error={errors.split}
            memberErrors={errors.memberShares}
          />
        )}

        {/* Form Actions */}
        <div className="form-actions-bar">
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
          <Button type="submit" variant="primary">
            Save Expense
          </Button>
        </div>
      </form>
    </div>
  );
};
