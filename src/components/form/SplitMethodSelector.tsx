import React from 'react';

export type SplitMethod = 'equal' | 'exact' | 'percent';

export interface SplitMethodSelectorProps {
  selectedMethod: SplitMethod;
  onSelectMethod: (method: SplitMethod) => void;
}

export const SplitMethodSelector: React.FC<SplitMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const options: { id: SplitMethod; label: string; desc: string }[] = [
    { id: 'equal', label: 'Equally', desc: 'Split evenly among selected members' },
    { id: 'exact', label: 'Exact amounts', desc: 'Specify exact ₹ amount per member' },
    { id: 'percent', label: 'Percentages', desc: 'Specify % share per member' },
  ];

  return (
    <div className="split-method-container">
      <label className="form-field-label">
        <span>Split Method</span>
        <span className="field-required-marker" aria-hidden="true">*</span>
      </label>
      <div className="segmented-control" role="radiogroup" aria-label="Split method">
        {options.map((option) => {
          const isSelected = selectedMethod === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`segmented-button ${isSelected ? 'segmented-button-active' : ''}`}
              onClick={() => onSelectMethod(option.id)}
            >
              <span className="segmented-button-title">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
