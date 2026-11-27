import React from 'react';
import { MemberBalance } from '../../types/expense';
import { BalanceCard } from './BalanceCard';

export interface BalanceListProps {
  balances: MemberBalance[];
}

export const BalanceList: React.FC<BalanceListProps> = ({ balances }) => {
  return (
    <section className="balances-section" aria-label="Member Balances">
      <div className="balances-grid">
        {balances.map((balance) => (
          <BalanceCard key={balance.memberId} balance={balance} />
        ))}
      </div>
    </section>
  );
};
