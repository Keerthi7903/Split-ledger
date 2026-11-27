/**
 * Split Calculator Module
 *
 * Implements exact integer-based splitting algorithms:
 * 1. Equal Split (Integer division with deterministic ordered remainder distribution)
 * 2. Exact Split (Per-member integer paise allocation)
 * 3. Percentage Split (Largest Remainder Method / Hare-Niemeyer using integer basis points)
 *
 * Invariant:
 * The sum of allocated shares across all participants must ALWAYS equal the total expense amount.
 * Zero lost paise. Zero invented paise.
 */

import { SplitDetails } from '../types/expense';

export interface ParticipantShare {
  memberId: string;
  paise: number;
}

/**
 * Calculates equal split shares among selected members.
 *
 * Remainder Policy:
 * When dividing totalAmountPaise across N members leaves a remainder R = totalAmountPaise % N,
 * an extra 1 paisa is assigned to the first R members in the selectedMemberIds array.
 *
 * Worked Example:
 * ₹100.00 (10,000 paise) split among 3 members:
 * - base = floor(10000 / 3) = 3333 paise (₹33.33)
 * - remainder = 10000 % 3 = 1 paisa
 * - Member 1: 3333 + 1 = 3334 paise (₹33.34)
 * - Member 2: 3333 paise (₹33.33)
 * - Member 3: 3333 paise (₹33.33)
 * Total: 3334 + 3333 + 3333 = 10000 paise (₹100.00)
 */
export function calculateEqualSplit(
  totalAmountPaise: number,
  selectedMemberIds: readonly string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  const count = selectedMemberIds.length;

  if (count === 0) {
    return result;
  }

  const baseShare = Math.floor(totalAmountPaise / count);
  const remainder = totalAmountPaise % count;

  selectedMemberIds.forEach((memberId, index) => {
    // The first `remainder` members get 1 extra paisa
    const extraPaisa = index < remainder ? 1 : 0;
    result[memberId] = baseShare + extraPaisa;
  });

  return result;
}

/**
 * Validates and normalizes exact split shares.
 * Returns the assigned total and the difference from totalAmountPaise.
 */
export function calculateExactSplitSummary(
  totalAmountPaise: number,
  shares: Record<string, number>
): {
  assignedPaise: number;
  remainingPaise: number;
  isExactMatch: boolean;
} {
  let assignedPaise = 0;

  for (const value of Object.values(shares)) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
      assignedPaise += value;
    }
  }

  const remainingPaise = totalAmountPaise - assignedPaise;

  return {
    assignedPaise,
    remainingPaise,
    isExactMatch: remainingPaise === 0,
  };
}

/**
 * Calculates percentage split shares using the Largest Remainder Method (Hare-Niemeyer)
 * executed purely in integer basis points (1% = 100 basis points, 100% = 10,000 basis points).
 *
 * Algorithm Steps:
 * 1. Convert percentages to basis points: B_i = Math.round(percent * 100).
 * 2. Integer base allocation: P_i = floor((totalAmountPaise * B_i) / 10000).
 * 3. Exact integer remainder in basis points: R_i = (totalAmountPaise * B_i) % 10000.
 * 4. Missing paise: delta = totalAmountPaise - sum(P_i).
 * 5. Sort participants descending by R_i.
 *    Tie-breaker: canonical member order ascending (earlier member in canonical list wins).
 * 6. Add +1 paisa to the top delta participants.
 *
 * Guarantees:
 * - sum(allocated shares) === totalAmountPaise exactly.
 * - Zero floating-point arithmetic.
 * - Zero epsilon comparisons.
 * - Completely deterministic tie-breaking.
 */
export function calculatePercentSplit(
  totalAmountPaise: number,
  percentShares: Record<string, number>,
  canonicalMemberIds: readonly string[]
): Record<string, number> {
  const participantIds = canonicalMemberIds.filter((id) => id in percentShares);

  if (participantIds.length === 0) {
    return {};
  }

  let totalAllocatedPaise = 0;
  const allocations: {
    memberId: string;
    integerPaise: number;
    remainderBasisPoints: number;
    canonicalIndex: number;
  }[] = [];

  for (const memberId of participantIds) {
    const percent = percentShares[memberId] ?? 0;
    // 33.33% -> 3333 basis points
    const basisPoints = Math.round(percent * 100);

    const product = totalAmountPaise * basisPoints;
    const integerPaise = Math.floor(product / 10000);
    const remainderBasisPoints = product % 10000;

    totalAllocatedPaise += integerPaise;

    allocations.push({
      memberId,
      integerPaise,
      remainderBasisPoints,
      canonicalIndex: canonicalMemberIds.indexOf(memberId),
    });
  }

  const missingPaise = totalAmountPaise - totalAllocatedPaise;

  // Sort descending by integer remainder
  // Tie-breaker: canonical index ascending
  allocations.sort((a, b) => {
    if (b.remainderBasisPoints !== a.remainderBasisPoints) {
      return b.remainderBasisPoints - a.remainderBasisPoints;
    }
    return a.canonicalIndex - b.canonicalIndex;
  });

  // Distribute the missing paise one by one
  for (let i = 0; i < missingPaise && i < allocations.length; i++) {
    const alloc = allocations[i];
    if (alloc) {
      alloc.integerPaise += 1;
    }
  }

  const result: Record<string, number> = {};
  for (const alloc of allocations) {
    result[alloc.memberId] = alloc.integerPaise;
  }

  return result;
}

/**
 * High-level helper: Resolves any SplitDetails object into a concrete map of memberId -> paise.
 */
export function resolveExpenseShares(
  totalAmountPaise: number,
  split: SplitDetails,
  canonicalMemberIds: readonly string[]
): Record<string, number> {
  switch (split.type) {
    case 'equal':
      return calculateEqualSplit(totalAmountPaise, split.memberIds);
    case 'exact':
      return { ...split.shares };
    case 'percent':
      return calculatePercentSplit(totalAmountPaise, split.shares, canonicalMemberIds);
  }
}
