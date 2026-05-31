import React from 'react';
import { useState } from 'react';
import type { PlayerAction } from '../types/poker';

interface ActionButtonsProps {
  validActions: PlayerAction[];
  currentBet: number;
  playerBet: number;
  playerChips: number;
  onAction: (action: PlayerAction, amount?: number) => void;
  disabled?: boolean;
}

export function ActionButtons({
  validActions, currentBet, playerBet, playerChips, onAction, disabled,
}: ActionButtonsProps) {
  const [raiseAmount, setRaiseAmount] = useState(currentBet * 2);
  const callAmount = currentBet - playerBet;
  const minRaise = currentBet * 2;

  const buttonClass = (variant: 'fold' | 'neutral' | 'raise' | 'allin') => {
    const base = 'px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide';
    const variants = {
      fold: 'bg-red-900/80 hover:bg-red-800 border border-red-700 text-red-200 hover:text-white',
      neutral: 'bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 hover:text-white',
      raise: 'bg-orange-600 hover:bg-orange-500 border border-orange-500 text-white shadow-orange-500/30 shadow',
      allin: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 border border-orange-500 text-white font-black shadow-lg',
    };
    return `${base} ${variants[variant]}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 justify-center">
        {validActions.includes('fold') && (
          <button
            className={buttonClass('fold')}
            onClick={() => onAction('fold')}
            disabled={disabled}
          >
            Fold
          </button>
        )}

        {validActions.includes('check') && (
          <button
            className={buttonClass('neutral')}
            onClick={() => onAction('check')}
            disabled={disabled}
          >
            Check
          </button>
        )}

        {validActions.includes('call') && (
          <button
            className={buttonClass('neutral')}
            onClick={() => onAction('call')}
            disabled={disabled}
          >
            Call ${callAmount}
          </button>
        )}

        {validActions.includes('raise') && (
          <button
            className={buttonClass('raise')}
            onClick={() => onAction('raise', raiseAmount)}
            disabled={disabled}
          >
            Raise ${raiseAmount}
          </button>
        )}

        {validActions.includes('all-in') && (
          <button
            className={buttonClass('allin')}
            onClick={() => onAction('all-in')}
            disabled={disabled}
          >
            All In ${playerChips}
          </button>
        )}
      </div>

      {validActions.includes('raise') && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Raise:</span>
          <input
            type="range"
            min={minRaise}
            max={playerChips + playerBet}
            step={10}
            value={raiseAmount}
            onChange={e => setRaiseAmount(Number(e.target.value))}
            disabled={disabled}
            className="flex-1 accent-orange-500 h-1"
          />
          <span className="text-orange-400 font-mono text-sm w-16 text-right">${raiseAmount}</span>
        </div>
      )}
    </div>
  );
}
