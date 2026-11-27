export type Category = 'Food' | 'Travel' | 'Stay' | 'Activities' | 'Other';

export const CATEGORIES: readonly Category[] = [
  'Food',
  'Travel',
  'Stay',
  'Activities',
  'Other'
] as const;

export interface Member {
  id: string;
  name: string;
}

export interface EqualSplit {
  type: 'equal';
  memberIds: string[];
}

export interface ExactSplit {
  type: 'exact';
  shares: Record<string, number>; // key: memberId, value: paise (integer >= 0)
}

export interface PercentSplit {
  type: 'percent';
  shares: Record<string, number>; // key: memberId, value: percentage number (e.g. 33.33)
}

export type SplitDetails = EqualSplit | ExactSplit | PercentSplit;

export interface Expense {
  id: string;
  description: string;
  amount: number; // Stored as integer paise (e.g. ₹1,250.50 -> 125050)
  paidBy: string; // Member id
  date: string;   // YYYY-MM-DD
  category: Category;
  split: SplitDetails;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  paidPaise: number;
  owedPaise: number;
  netPaise: number; // paidPaise - owedPaise
  status: 'gets_back' | 'owes' | 'settled';
}
