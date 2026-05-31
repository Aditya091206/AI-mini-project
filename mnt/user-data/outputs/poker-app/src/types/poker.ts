export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
  faceDown?: boolean;
}

export type HandRank =
  | 'High Card'
  | 'One Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface HandEvaluation {
  rank: HandRank;
  score: number;
  description: string;
}

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type AIPersonality = 'CFR Solver' | 'POMDP Agent' | 'Deep RL Bot' | 'GTO Optimizer';

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  bet: number;
  totalBet: number;
  folded: boolean;
  isAllIn: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isHuman: boolean;
  personality?: AIPersonality;
  strategy?: string;
  lastAction?: PlayerAction;
  bluffScore?: number;
  aggression?: number;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: number[];
  currentBet: number;
  currentPlayerIndex: number;
  street: Street;
  round: number;
  dealerIndex: number;
  winners: string[];
  gameLog: LogEntry[];
  isGameOver: boolean;
  handInProgress: boolean;
}

export interface LogEntry {
  message: string;
  type: 'action' | 'system' | 'winner' | 'ai-thought';
  timestamp: number;
  player?: string;
}

export interface AIDecision {
  action: PlayerAction;
  amount?: number;
  reasoning: string;
  confidence: number;
  bluffProbability: number;
}

export interface BiometricData {
  stressLevel: number;
  bluffConfidence: number;
  expressionLabel: string;
  eyeContact: boolean;
  microExpressions: string[];
}
