import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  children,
}) => {
  return (
    <div className={`form-field-group ${error ? 'form-field-has-error' : ''}`}>
      <label htmlFor={htmlFor} className="form-field-label">
        <span>{label}</span>
        {required && <span className="field-required-marker" aria-hidden="true">*</span>}
      </label>

      <div className="form-field-control">{children}</div>

      {helpText && !error && (
        <span className="form-field-help">{helpText}</span>
      )}

      {error && (
        <span
          id={`${htmlFor}-error`}
          className="form-field-error"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
};
