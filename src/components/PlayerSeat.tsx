import React from 'react';
import type { Player, GameState } from '../types/poker';
import { CardHand } from './Card';
import { evaluateHand } from '../engine/poker';

interface PlayerSeatProps {
  player: Player;
  gameState: GameState;
  isCurrentTurn: boolean;
  isAIThinking: boolean;
}

const PERSONALITY_COLORS: Record<string, string> = {
  'CFR Solver': 'from-cyan-500 to-blue-600',
  'POMDP Agent': 'from-purple-500 to-indigo-600',
  'Deep RL Bot': 'from-orange-500 to-red-600',
  'GTO Optimizer': 'from-emerald-500 to-teal-600',
  'You': 'from-yellow-400 to-amber-500',
};

const PERSONALITY_ICONS: Record<string, string> = {
  'CFR Solver': '🧮',
  'POMDP Agent': '🔮',
  'Deep RL Bot': '🤖',
  'GTO Optimizer': '⚡',
};

export function PlayerSeat({ player, gameState, isCurrentTurn, isAIThinking }: PlayerSeatProps) {
  const isShowdown = gameState.street === 'showdown';
  const isWinner = gameState.winners.includes(player.id);
  const showCards = player.isHuman || isShowdown;

  const handEval = showCards && player.holeCards.length >= 2 && gameState.communityCards.length >= 0
    ? evaluateHand([...player.holeCards, ...gameState.communityCards])
    : null;

  const gradientClass = PERSONALITY_COLORS[player.name] ?? 'from-gray-500 to-gray-600';

  return (
    <div className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300
      ${isCurrentTurn ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent shadow-yellow-400/30 shadow-lg' : ''}
      ${player.folded ? 'opacity-40' : ''}
      ${isWinner ? 'ring-2 ring-green-400 shadow-green-400/50 shadow-lg' : ''}
      bg-gray-900/80 backdrop-blur-sm border border-gray-700/50
    `}>
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-xl font-bold shadow-lg relative`}>
        {player.isHuman ? '👤' : PERSONALITY_ICONS[player.name] ?? '🤖'}
        {isCurrentTurn && isAIThinking && (
          <div className="absolute -right-1 -top-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
        )}
        {isWinner && (
          <div className="absolute -right-1 -top-1 text-sm">🏆</div>
        )}
      </div>

      {/* Name & chips */}
      <div className="text-center">
        <div className="text-white font-semibold text-sm leading-none">{player.name}</div>
        <div className="text-yellow-400 text-xs font-mono mt-0.5">${player.chips}</div>
      </div>

      {/* Cards */}
      <CardHand
        cards={player.holeCards}
        faceDown={!showCards}
        size="sm"
      />

      {/* Hand eval */}
      {handEval && !player.folded && gameState.communityCards.length > 0 && (
        <div className="text-xs text-cyan-300 font-medium text-center max-w-24 leading-tight">
          {handEval.description}
        </div>
      )}

      {/* Last action badge */}
      {player.lastAction && !player.folded && (
        <div className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
          ${player.lastAction === 'fold' ? 'bg-red-900/60 text-red-300' :
            player.lastAction === 'raise' || player.lastAction === 'all-in' ? 'bg-orange-900/60 text-orange-300' :
            'bg-gray-700 text-gray-300'}
        `}>
          {player.lastAction}
        </div>
      )}

      {/* Blind indicators */}
      <div className="flex gap-1">
        {player.isDealer && <span className="text-xs bg-white text-black rounded-full w-5 h-5 flex items-center justify-center font-bold">D</span>}
        {player.isSmallBlind && <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">S</span>}
        {player.isBigBlind && <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">B</span>}
      </div>

      {/* Bet */}
      {player.bet > 0 && (
        <div className="text-xs text-white bg-yellow-600/80 px-2 py-0.5 rounded-full font-mono">
          Bet: ${player.bet}
        </div>
      )}

      {player.isAllIn && (
        <div className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
          ALL IN
        </div>
      )}
    </div>
  );
}
