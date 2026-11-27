import React from 'react';
import { Member } from '../../types/expense';

export interface PercentSplitFieldsProps {
  members: Member[];
  sharesPercent: Record<string, string>;
  onChangePercent: (memberId: string, value: string) => void;
  error?: string;
  memberErrors?: Record<string, string>;
}

export const PercentSplitFields: React.FC<PercentSplitFieldsProps> = ({
  members,
  sharesPercent,
  onChangePercent,
  error,
  memberErrors = {},
}) => {
  // Compute total basis points
  let totalBasisPoints = 0;
  for (const val of Object.values(sharesPercent)) {
    const trimmed = (val ?? '').trim();
    if (!trimmed || trimmed.startsWith('-') || /e/i.test(trimmed)) continue;
    const parsed = parseFloat(trimmed);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      totalBasisPoints += Math.round(parsed * 100);
    }
  }

  const currentPercent = (totalBasisPoints / 100).toFixed(2);
  const isComplete = totalBasisPoints === 10000;
  let statusClass = 'split-status-warning';

  if (isComplete) {
    statusClass = 'split-status-success';
  } else if (totalBasisPoints > 10000) {
    statusClass = 'split-status-error';
  }

  return (
    <div className="split-fields-card">
      <div className="split-fields-header">
        <h3 className="split-fields-title">Assign Percentages (%)</h3>
        <span className={`split-status-pill ${statusClass}`}>
          {isComplete
            ? '✓ Total: 100.00%'
            : `Total: ${currentPercent}% / 100%`}
        </span>
      </div>

      <div className="shares-input-list">
        {members.map((member) => {
          const val = sharesPercent[member.id] ?? '';
          const memberError = memberErrors[member.id];

          return (
            <div key={member.id} className="share-input-row">
              <label htmlFor={`percent-share-${member.id}`} className="share-member-label">
                {member.name}
              </label>
              <div className="share-input-wrapper">
                <input
                  id={`percent-share-${member.id}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={val}
                  onChange={(e) => onChangePercent(member.id, e.target.value)}
                  className={`share-text-input ${memberError ? 'input-error' : ''}`}
                />
                <span className="percent-suffix" aria-hidden="true">%</span>
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
