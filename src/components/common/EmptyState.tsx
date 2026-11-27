import React from 'react';
import { Link } from 'react-router-dom';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">📋</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLink && actionText && (
        <Link to={actionLink} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          {actionText}
        </Link>
      )}
      {!actionLink && actionText && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
