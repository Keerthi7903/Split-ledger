import React from 'react';
import { Member } from '../../types/expense';
import { formatPaiseToINR } from '../../utils/money';

export interface ExactSplitFieldsProps {
  members: Member[];
  sharesRupees: Record<string, string>;
  onChangeShare: (memberId: string, value: string) => void;
  totalAmountPaise: number;
  error?: string;
  memberErrors?: Record<string, string>;
}

export const ExactSplitFields: React.FC<ExactSplitFieldsProps> = ({
  members,
  sharesRupees,
  onChangeShare,
  totalAmountPaise,
  error,
  memberErrors = {},
}) => {
  // Compute assigned total
  let assignedPaise = 0;
  for (const val of Object.values(sharesRupees)) {
    const trimmed = (val ?? '').trim();
    if (!trimmed || trimmed.startsWith('-') || /e/i.test(trimmed)) continue;
    const [wholeStr = '0', fracStr = ''] = trimmed.split('.');
    const whole = parseInt(wholeStr, 10);
    const frac = parseInt(fracStr.padEnd(2, '0').slice(0, 2), 10);
    if (!Number.isNaN(whole) && !Number.isNaN(frac)) {
      assignedPaise += whole * 100 + frac;
    }
  }

  const remainingPaise = totalAmountPaise - assignedPaise;
  let statusClass = 'split-status-neutral';
  let statusMessage = '';

  if (totalAmountPaise > 0) {
    if (remainingPaise === 0) {
      statusClass = 'split-status-success';
      statusMessage = '✓ Exact match! All amount assigned.';
    } else if (remainingPaise > 0) {
      statusClass = 'split-status-warning';
      statusMessage = `${formatPaiseToINR(remainingPaise)} left to assign`;
    } else {
      statusClass = 'split-status-error';
      statusMessage = `${formatPaiseToINR(Math.abs(remainingPaise))} over assigned`;
    }
  }

  return (
    <div className="split-fields-card">
      <div className="split-fields-header">
        <h3 className="split-fields-title">Assign Exact Amounts (₹)</h3>
        {statusMessage && (
          <span className={`split-status-pill ${statusClass}`}>
            {statusMessage}
          </span>
        )}
      </div>

      <div className="shares-input-list">
        {members.map((member) => {
          const val = sharesRupees[member.id] ?? '';
          const memberError = memberErrors[member.id];

          return (
            <div key={member.id} className="share-input-row">
              <label htmlFor={`exact-share-${member.id}`} className="share-member-label">
                {member.name}
              </label>
              <div className="share-input-wrapper">
                <span className="currency-prefix" aria-hidden="true">₹</span>
                <input
                  id={`exact-share-${member.id}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={val}
                  onChange={(e) => onChangeShare(member.id, e.target.value)}
                  className={`share-text-input ${memberError ? 'input-error' : ''}`}
                />
              </div>
              {memberError && (
                <span className="share-error-text" role="alert">
                  {memberError}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <span className="form-field-error" role="alert" style={{ marginTop: '0.75rem' }}>
          {error}
        </span>
      )}
    </div>
  );
};
