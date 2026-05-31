import React, { useEffect, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { PlayerSeat } from './components/PlayerSeat';
import { PlayingCard } from './components/Card';
import { ActionButtons } from './components/ActionButtons';
import { GameLog } from './components/GameLog';
import type { PlayerAction } from './types/poker';

export default function App() {
  const { state, isAIThinking, startNewHand, applyAction, getValidActions, processAITurn, addLog } = useGameState();

  const currentPlayer = state.players[state.currentPlayerIndex];
  const humanPlayer = state.players.find(p => p.isHuman);
  const isHumanTurn = currentPlayer?.isHuman && state.handInProgress && !state.isGameOver;

  const validActions = humanPlayer && state.handInProgress && currentPlayer
    ? getValidActions(currentPlayer, state.currentBet)
    : [];

  useEffect(() => {
    if (
      state.handInProgress &&
      currentPlayer &&
      !currentPlayer.isHuman &&
      !currentPlayer.folded &&
      !currentPlayer.isAllIn &&
      !isAIThinking
    ) {
      processAITurn(state);
    }
  }, [state.currentPlayerIndex, state.handInProgress, state.street]);

  const handleHumanAction = useCallback((action: PlayerAction, amount?: number) => {
    if (!currentPlayer || !currentPlayer.isHuman) return;
    addLog(`You: ${action.toUpperCase()}${amount ? ` $${amount}` : ''}`, 'action', humanPlayer?.id);
    applyAction(currentPlayer.id, action, amount);
  }, [currentPlayer, applyAction, addLog, humanPlayer]);

  const aiPlayers = state.players.filter(p => !p.isHuman);
  const topPlayers = aiPlayers.slice(0, 2);
  const leftPlayers = aiPlayers.slice(2, 3);
  const rightPlayers = aiPlayers.slice(3, 4);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-950/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🃏</div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-widest uppercase">Texas Hold'em</h1>
            <p className="text-xs text-gray-500">CFR · POMDP · Deep RL · GTO</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">POT</div>
            <div className="text-yellow-400 font-bold text-lg">${state.pot}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">STREET</div>
            <div className="text-cyan-400 font-bold uppercase">{state.street}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">ROUND</div>
            <div className="text-white font-bold">#{state.round}</div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="flex gap-4 justify-center">
            {topPlayers.map(p => (
              <PlayerSeat key={p.id} player={p} gameState={state}
                isCurrentTurn={state.players[state.currentPlayerIndex]?.id === p.id}
                isAIThinking={isAIThinking} />
            ))}
          </div>

          <div className="flex items-center gap-6 w-full max-w-3xl">
            <div className="flex flex-col gap-4">
              {leftPlayers.map(p => (
                <PlayerSeat key={p.id} player={p} gameState={state}
                  isCurrentTurn={state.players[state.currentPlayerIndex]?.id === p.id}
                  isAIThinking={isAIThinking} />
              ))}
            </div>

            <div className="flex-1 bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-[40px] border-4 border-yellow-800/60 shadow-2xl p-6 flex flex-col items-center gap-4 min-h-36">
              <div className="flex gap-2 flex-wrap justify-center">
                {state.communityCards.length === 0 && state.handInProgress && (
                  <div className="text-green-600/60 text-sm">Waiting for flop...</div>
                )}
                {state.communityCards.map((card, i) => (
                  <PlayingCard key={i} card={card} size="md" />
                ))}
              </div>

              {state.pot > 0 && (
                <div className="bg-black/40 px-4 py-1.5 rounded-full border border-yellow-600/40">
                  <span className="text-yellow-400 font-bold text-sm">Pot: ${state.pot}</span>
                </div>
              )}

              {state.winners.length > 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-4 py-2 text-center">
                  <div className="text-yellow-400 font-bold text-sm">
                    🏆 {state.players.find(p => state.winners.includes(p.id))?.name} wins!
                  </div>
                </div>
              )}

              {isAIThinking && (
                <div className="text-cyan-400/80 text-xs flex items-center gap-1.5 animate-pulse">
                  <span>●</span>
                  <span>{currentPlayer?.name} is thinking...</span>
                </div>
              )}

              {(!state.handInProgress || state.winners.length > 0) && (
                <button onClick={startNewHand}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg text-sm transition-all">
                  {state.round === 0 ? '▶ Start Game' : '▶ Next Hand'}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {rightPlayers.map(p => (
                <PlayerSeat key={p.id} player={p} gameState={state}
                  isCurrentTurn={state.players[state.currentPlayerIndex]?.id === p.id}
                  isAIThinking={isAIThinking} />
              ))}
            </div>
          </div>

          {humanPlayer && (
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-900/80 border border-yellow-600/30 w-full max-w-md">
              <PlayerSeat player={humanPlayer} gameState={state}
                isCurrentTurn={isHumanTurn ?? false} isAIThinking={false} />
              {isHumanTurn && (
                <ActionButtons validActions={validActions} currentBet={state.currentBet}
                  playerBet={humanPlayer.bet} playerChips={humanPlayer.chips}
                  onAction={handleHumanAction} disabled={!isHumanTurn} />
              )}
              {!isHumanTurn && state.handInProgress && !state.winners.length && (
                <div className="text-gray-500 text-xs animate-pulse">Waiting for AI players...</div>
              )}
            </div>
          )}
        </div>

        <div className="w-72 border-l border-gray-800 p-4 flex flex-col gap-3 bg-gray-950/50">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 font-bold">Game Log</h2>
          <GameLog entries={state.gameLog} />
          <div className="mt-2">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Standings</h2>
            <div className="flex flex-col gap-1.5">
              {[...state.players].sort((a, b) => b.chips - a.chips).map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className={`${p.isHuman ? 'text-yellow-400' : 'text-gray-300'} truncate flex-1`}>
                    {p.isHuman ? '👤 ' : ''}{p.name}
                  </span>
                  <span className={`font-mono ml-2 ${p.chips === 0 ? 'text-red-500' : 'text-green-400'}`}>
                    ${p.chips}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto border-t border-gray-800 pt-3">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">AI Agents</h2>
            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
              <div><span className="text-cyan-400">🧮 CFR</span> — Nash equilibrium solver</div>
              <div><span className="text-purple-400">🔮 POMDP</span> — Belief state planner</div>
              <div><span className="text-orange-400">🤖 Deep RL</span> — Self-play trained</div>
              <div><span className="text-green-400">⚡ GTO</span> — Unexploitable ranges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}