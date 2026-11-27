/**
 * Balance Calculator Module
 *
 * Computes net balances for all group members across an arbitrary list of expenses.
 *
 * Mathematical Definitions:
 * For each member m:
 *   Paid(m) = Total amount in paise paid by m across all expenses.
 *   Owed(m) = Total allocated share in paise assigned to m across all expenses.
 *   Net(m)  = Paid(m) - Owed(m)
 *
 * Interpretation:
 * - Net(m) > 0: Member is owed money ("Gets back ₹X")
 * - Net(m) < 0: Member owes money ("Owes ₹X")
 * - Net(m) = 0: Member has settled up ("Settled up")
 *
 * Invariant:
 * The sum of Net(m) across all members must ALWAYS equal exactly 0 paise.
 */

import { Member, Expense, MemberBalance } from '../types/expense';
import { resolveExpenseShares } from './splitCalculator';

export interface BalanceCalculationResult {
  balances: MemberBalance[];
  totalExpensesPaise: number;
  isZeroSum: boolean;
  zeroSumDiscrepancyPaise: number;
}

/**
 * Computes individual balances for all members across the provided expenses list.
 */
export function calculateBalances(
  members: readonly Member[],
  expenses: readonly Expense[]
): BalanceCalculationResult {
  const canonicalMemberIds = members.map((m) => m.id);

  // Initialize accumulators
  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();

  for (const member of members) {
    paidMap.set(member.id, 0);
    owedMap.set(member.id, 0);
  }

  let totalExpensesPaise = 0;

  // Aggregate paid amounts and owed shares
  for (const expense of expenses) {
    totalExpensesPaise += expense.amount;

    // Credit the payer
    const currentPaid = paidMap.get(expense.paidBy) ?? 0;
    paidMap.set(expense.paidBy, currentPaid + expense.amount);

    // Resolve individual member shares for this expense
    const shares = resolveExpenseShares(
      expense.amount,
      expense.split,
      canonicalMemberIds
    );

    // Debit each participant
    for (const [memberId, sharePaise] of Object.entries(shares)) {
      const currentOwed = owedMap.get(memberId) ?? 0;
      owedMap.set(memberId, currentOwed + sharePaise);
    }
  }

  // Construct MemberBalance objects in original members order
  let sumNetPaise = 0;
  const balances: MemberBalance[] = members.map((member) => {
    const paidPaise = paidMap.get(member.id) ?? 0;
    const owedPaise = owedMap.get(member.id) ?? 0;
    const netPaise = paidPaise - owedPaise;
    sumNetPaise += netPaise;

    let status: 'gets_back' | 'owes' | 'settled';
    if (netPaise > 0) {
      status = 'gets_back';
    } else if (netPaise < 0) {
      status = 'owes';
    } else {
      status = 'settled';
    }

    return {
      memberId: member.id,
      memberName: member.name,
      paidPaise,
      owedPaise,
      netPaise,
      status,
    };
  });

  return {
    balances,
    totalExpensesPaise,
    isZeroSum: sumNetPaise === 0,
    zeroSumDiscrepancyPaise: sumNetPaise,
  };
}
