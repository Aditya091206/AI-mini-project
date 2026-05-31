import React from 'react';
import type { Card } from '../types/poker';
import { isRedSuit } from '../engine/poker';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

interface CardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayingCard({ card, faceDown, size = 'md', className = '' }: CardProps) {
  const sizes = {
    sm: 'w-10 h-14 text-sm',
    md: 'w-14 h-20 text-base',
    lg: 'w-20 h-28 text-xl',
  };

  if (faceDown || !card) {
    return (
      <div className={`${sizes[size]} ${className} rounded-lg border-2 border-gray-600 bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center shadow-xl`}>
        <div className="text-blue-700 text-2xl">🂠</div>
      </div>
    );
  }

  const isRed = isRedSuit(card.suit);
  const suit = SUIT_SYMBOLS[card.suit];

  return (
    <div className={`${sizes[size]} ${className} rounded-lg border border-gray-200 bg-white flex flex-col justify-between p-1 shadow-xl relative overflow-hidden`}>
      <div className={`font-bold leading-none ${isRed ? 'text-red-600' : 'text-gray-900'} text-xs`}>
        <div>{card.rank}</div>
        <div>{suit}</div>
      </div>
      <div className={`text-center font-bold ${isRed ? 'text-red-600' : 'text-gray-900'} ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
        {suit}
      </div>
      <div className={`font-bold leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'} text-xs self-end`}>
        <div>{card.rank}</div>
        <div>{suit}</div>
      </div>
    </div>
  );
}

interface CardHandProps {
  cards: Card[];
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CardHand({ cards, faceDown, size = 'md' }: CardHandProps) {
  return (
    <div className="flex gap-1">
      {cards.map((card, i) => (
        <PlayingCard key={i} card={card} faceDown={faceDown} size={size} />
      ))}
    </div>
  );
}
