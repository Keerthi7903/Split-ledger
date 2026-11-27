import React from 'react';
import { MemberBalance } from '../../types/expense';
import { formatPaiseToINR } from '../../utils/money';

export interface BalanceCardProps {
  balance: MemberBalance;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  const { memberName, netPaise, status } = balance;

  let statusText = 'Settled up';
  let badgeClass = 'balance-badge-settled';
  let amountText = '';

  if (status === 'gets_back') {
    statusText = 'Gets back';
    amountText = formatPaiseToINR(netPaise);
    badgeClass = 'balance-badge-positive';
  } else if (status === 'owes') {
    statusText = 'Owes';
    amountText = formatPaiseToINR(Math.abs(netPaise));
    badgeClass = 'balance-badge-negative';
  }

  return (
    <div className="balance-card">
      <div className="balance-card-header">
        <span className="balance-member-avatar" aria-hidden="true">
          {memberName.charAt(0)}
        </span>
        <h3 className="balance-member-name">{memberName}</h3>
      </div>
      <div className="balance-card-body">
        <span className={`balance-badge ${badgeClass}`}>
          {statusText}
        </span>
        {amountText ? (
          <span className={`balance-amount ${badgeClass}`}>
            {amountText}
          </span>
        ) : (
          <span className="balance-amount balance-amount-settled">
            ₹0.00
          </span>
        )}
      </div>
    </div>
  );
};
