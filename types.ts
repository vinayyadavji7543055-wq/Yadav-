
export type SportType = 'Football' | 'Cricket' | 'Tennis' | 'Basketball';

export interface Match {
  id: string;
  sport: SportType;
  teamA: string;
  teamB: string;
  captainPhotoA: string;
  captainPhotoB: string;
  oddsA: number;
  oddsDraw?: number;
  oddsB: number;
  startTime: string;
  league: string;
  status: 'upcoming' | 'live' | 'completed';
  score?: string;
  isHot?: boolean;
}

export interface Bet {
  id: string;
  matchId: string;
  matchTitle: string;
  selection: 'A' | 'Draw' | 'B';
  amount: number;
  odds: number;
  timestamp: string;
  status: 'pending' | 'won' | 'lost';
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'win' | 'bet' | 'bonus';
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  balance: number;
  bets: Bet[];
  transactions: Transaction[];
  kycStatus: 'unverified' | 'pending' | 'verified';
  currency: 'INR' | 'USD';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TranslationStrings {
  upcomingMatches: string;
  placeBet: string;
  walletBalance: string;
  history: string;
  aiInsights: string;
  deposit: string;
  withdraw: string;
  odds: string;
  results: string;
  rules: string;
  selectLanguage: string;
  account: string;
  security: string;
  verification: string;
  casino: string;
  leaderboard: string;
  support: string;
  referAndEarn: string;
  fantasy: string;
}
