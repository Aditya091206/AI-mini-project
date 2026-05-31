import type { Card, Rank, Suit, HandEvaluation, HandRank } from '../types/poker';

const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS: Suit[] = ['spades','hearts','diamonds','clubs'];
const RANK_VALUES: Record<Rank, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealCards(deck: Card[], count: number): { cards: Card[]; remaining: Card[] } {
  return { cards: deck.slice(0, count), remaining: deck.slice(count) };
}

function rankVal(r: Rank): number { return RANK_VALUES[r]; }

export function evaluateHand(cards: Card[]): HandEvaluation {
  const best = getBestFiveCardHand(cards);
  return best;
}

function getBestFiveCardHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    return { rank: 'High Card', score: 0, description: 'Not enough cards' };
  }
  let best: HandEvaluation | null = null;
  // Try all C(n,5) combos
  const combos = combinations(cards, 5);
  for (const combo of combos) {
    const ev = evaluateFive(combo);
    if (!best || ev.score > best.score) best = ev;
  }
  return best!;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function evaluateFive(cards: Card[]): HandEvaluation {
  const sorted = [...cards].sort((a, b) => rankVal(b.rank) - rankVal(a.rank));
  const suits = sorted.map(c => c.suit);
  const ranks = sorted.map(c => rankVal(c.rank));

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const counts = getCounts(ranks);
  const groups = Object.values(counts).sort((a, b) => b - a);

  let score = 0;
  let rank: HandRank;
  let description = '';

  if (isFlush && isStraight && ranks[0] === 14) {
    rank = 'Royal Flush'; score = 900000 + ranks[0];
    description = 'Royal Flush!';
  } else if (isFlush && isStraight) {
    rank = 'Straight Flush'; score = 800000 + ranks[0];
    description = `Straight Flush, ${sorted[0].rank} high`;
  } else if (groups[0] === 4) {
    rank = 'Four of a Kind'; score = 700000 + ranks[0];
    description = `Four of a Kind, ${getTopRankWithCount(counts, 4)}s`;
  } else if (groups[0] === 3 && groups[1] === 2) {
    rank = 'Full House'; score = 600000 + ranks[0];
    description = `Full House, ${getTopRankWithCount(counts, 3)}s full of ${getTopRankWithCount(counts, 2)}s`;
  } else if (isFlush) {
    rank = 'Flush'; score = 500000 + ranks[0];
    description = `Flush, ${sorted[0].rank} high`;
  } else if (isStraight) {
    rank = 'Straight'; score = 400000 + ranks[0];
    description = `Straight, ${sorted[0].rank} high`;
  } else if (groups[0] === 3) {
    rank = 'Three of a Kind'; score = 300000 + ranks[0];
    description = `Three of a Kind, ${getTopRankWithCount(counts, 3)}s`;
  } else if (groups[0] === 2 && groups[1] === 2) {
    rank = 'Two Pair'; score = 200000 + ranks[0];
    description = `Two Pair`;
  } else if (groups[0] === 2) {
    rank = 'One Pair'; score = 100000 + ranks[0];
    description = `Pair of ${getTopRankWithCount(counts, 2)}s`;
  } else {
    rank = 'High Card'; score = ranks[0];
    description = `${sorted[0].rank} high`;
  }

  return { rank, score, description };
}

function checkStraight(ranks: number[]): boolean {
  const sorted = [...new Set(ranks)].sort((a, b) => b - a);
  if (sorted.length < 5) return false;
  // Normal straight
  if (sorted[0] - sorted[4] === 4) return true;
  // Wheel: A-2-3-4-5
  if (sorted[0] === 14 && sorted[1] === 5 && sorted[4] === 2) return true;
  return false;
}

function getCounts(ranks: number[]): Record<number, number> {
  const c: Record<number, number> = {};
  for (const r of ranks) c[r] = (c[r] || 0) + 1;
  return c;
}

function getTopRankWithCount(counts: Record<number, number>, target: number): string {
  const entry = Object.entries(counts)
    .filter(([, v]) => v === target)
    .sort(([a], [b]) => Number(b) - Number(a))[0];
  if (!entry) return '?';
  const val = Number(entry[0]);
  const map: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  return map[val] ?? String(val);
}

export function cardToString(card: Card): string {
  const suitSymbols: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
