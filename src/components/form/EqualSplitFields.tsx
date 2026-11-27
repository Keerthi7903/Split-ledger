import React from 'react';
import { Member } from '../../types/expense';
import { calculateEqualSplit } from '../../utils/splitCalculator';
import { formatPaiseToINR } from '../../utils/money';

export interface EqualSplitFieldsProps {
  members: Member[];
  selectedMemberIds: string[];
  onToggleMember: (memberId: string) => void;
  onSelectAll: () => void;
  totalAmountPaise: number;
  error?: string;
}

export const EqualSplitFields: React.FC<EqualSplitFieldsProps> = ({
  members,
  selectedMemberIds,
  onToggleMember,
  onSelectAll,
  totalAmountPaise,
  error,
}) => {
  const selectedSet = new Set(selectedMemberIds);

  // Compute live preview
  let previewText = '';
  if (totalAmountPaise > 0 && selectedMemberIds.length > 0) {
    const shares = calculateEqualSplit(totalAmountPaise, selectedMemberIds);
    const uniqueShareAmounts = Array.from(new Set(Object.values(shares)));

    if (uniqueShareAmounts.length === 1 && uniqueShareAmounts[0] !== undefined) {
      previewText = `${formatPaiseToINR(uniqueShareAmounts[0])} per person`;
    } else {
      previewText = selectedMemberIds
        .map((id) => {
          const m = members.find((mem) => mem.id === id);
          const share = shares[id] ?? 0;
          return `${m?.name ?? id}: ${formatPaiseToINR(share)}`;
        })
        .join(', ');
    }
  }

  return (
    <div className="split-fields-card">
      <div className="split-fields-header">
        <h3 className="split-fields-title">Select Participants</h3>
        <button
          type="button"
          className="btn-link"
          onClick={onSelectAll}
        >
          {selectedMemberIds.length === members.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="member-checkbox-grid">
        {members.map((member) => {
          const isChecked = selectedSet.has(member.id);
          return (
            <label
              key={member.id}
              className={`checkbox-card ${isChecked ? 'checkbox-card-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleMember(member.id)}
                className="checkbox-input"
              />
              <span className="checkbox-member-name">{member.name}</span>
            </label>
          );
        })}
      </div>

      {previewText && (
        <div className="split-preview-banner">
          <span className="preview-label">Live Split:</span>
          <span className="preview-value">{previewText}</span>
        </div>
      )}

      {error && (
        <span className="form-field-error" role="alert" style={{ marginTop: '0.5rem' }}>
          {error}
        </span>
      )}
    </div>
  );
};
