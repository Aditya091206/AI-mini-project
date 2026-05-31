import { useState, useCallback, useRef } from 'react';
import type { GameState, Player, PlayerAction, Card, Street, LogEntry } from '../types/poker';
import { createDeck, dealCards, evaluateHand } from '../engine/poker';
import { getAIDecision } from '../engine/ai';

const AI_PERSONALITIES = ['CFR Solver', 'POMDP Agent', 'Deep RL Bot', 'GTO Optimizer'] as const;

function createInitialPlayers(): Player[] {
  return [
    {
      id: 'human',
      name: 'You',
      chips: 1000,
      holeCards: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      isAllIn: false,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      isHuman: true,
    },
    ...AI_PERSONALITIES.map((p, i) => ({
      id: `ai-${i}`,
      name: p,
      chips: 1000,
      holeCards: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      isAllIn: false,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      isHuman: false,
      personality: p,
      bluffScore: Math.random(),
      aggression: Math.random(),
    })),
  ];
}

function createInitialState(): GameState {
  return {
    players: createInitialPlayers(),
    deck: [],
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentBet: 0,
    currentPlayerIndex: 0,
    street: 'preflop',
    round: 0,
    dealerIndex: 0,
    winners: [],
    gameLog: [],
    isGameOver: false,
    handInProgress: false,
  };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiThinkingRef = useRef(false);

  const addLog = useCallback((message: string, type: LogEntry['type'], player?: string) => {
    setState(prev => ({
      ...prev,
      gameLog: [
        { message, type, timestamp: Date.now(), player },
        ...prev.gameLog.slice(0, 49),
      ],
    }));
  }, []);

  const startNewHand = useCallback(() => {
    setState(prev => {
      const alivePlayers = prev.players.filter(p => p.chips > 0);
      if (alivePlayers.length < 2) return { ...prev, isGameOver: true };

      let deck = createDeck();
      const dealerIdx = (prev.dealerIndex + 1) % alivePlayers.length;
      const sbIdx = (dealerIdx + 1) % alivePlayers.length;
      const bbIdx = (dealerIdx + 2) % alivePlayers.length;

      const SMALL_BLIND = 10;
      const BIG_BLIND = 20;

      // Deal 2 cards to each alive player
      const players: Player[] = prev.players.map(p => {
        if (p.chips <= 0) return { ...p, folded: true, holeCards: [], bet: 0, totalBet: 0 };
        const { cards, remaining } = dealCards(deck, 2);
        deck = remaining;
        const aliveIdx = alivePlayers.findIndex(ap => ap.id === p.id);
        const isDealer = aliveIdx === dealerIdx;
        const isSB = aliveIdx === sbIdx;
        const isBB = aliveIdx === bbIdx;
        const blind = isSB ? SMALL_BLIND : isBB ? BIG_BLIND : 0;
        const actualBlind = Math.min(blind, p.chips);
        return {
          ...p,
          holeCards: cards,
          folded: false,
          isAllIn: false,
          bet: actualBlind,
          totalBet: actualBlind,
          chips: p.chips - actualBlind,
          isDealer,
          isSmallBlind: isSB,
          isBigBlind: isBB,
          lastAction: undefined,
        };
      });

      const pot = players.reduce((s, p) => s + p.bet, 0);
      const firstToAct = (bbIdx + 1) % alivePlayers.length;
      const firstPlayerIdx = players.findIndex(
        p => alivePlayers[firstToAct]?.id === p.id
      );

      return {
        ...prev,
        players,
        deck,
        communityCards: [],
        pot,
        sidePots: [],
        currentBet: BIG_BLIND,
        currentPlayerIndex: firstPlayerIdx >= 0 ? firstPlayerIdx : 0,
        street: 'preflop' as Street,
        round: prev.round + 1,
        dealerIndex: dealerIdx,
        winners: [],
        gameLog: prev.gameLog,
        isGameOver: false,
        handInProgress: true,
      };
    });
  }, []);

  const getValidActions = useCallback((player: Player, currentBet: number): PlayerAction[] => {
    const actions: PlayerAction[] = [];
    const callAmount = currentBet - player.bet;
    if (callAmount === 0) actions.push('check');
    else {
      actions.push('fold');
      if (player.chips >= callAmount) actions.push('call');
    }
    if (player.chips > callAmount) actions.push('raise');
    if (player.chips > 0) actions.push('all-in');
    return actions;
  }, []);

  const applyAction = useCallback((playerId: string, action: PlayerAction, amount?: number) => {
    setState(prev => {
      const playerIdx = prev.players.findIndex(p => p.id === playerId);
      if (playerIdx < 0) return prev;

      const players = [...prev.players];
      const player = { ...players[playerIdx] };
      let pot = prev.pot;
      let currentBet = prev.currentBet;

      switch (action) {
        case 'fold':
          player.folded = true;
          player.lastAction = 'fold';
          break;
        case 'check':
          player.lastAction = 'check';
          break;
        case 'call': {
          const callAmt = Math.min(currentBet - player.bet, player.chips);
          player.chips -= callAmt;
          pot += callAmt;
          player.bet += callAmt;
          player.totalBet += callAmt;
          player.lastAction = 'call';
          if (player.chips === 0) player.isAllIn = true;
          break;
        }
        case 'raise': {
          const raiseAmt = amount ?? currentBet * 2;
          const toAdd = Math.min(raiseAmt - player.bet, player.chips);
          player.chips -= toAdd;
          pot += toAdd;
          player.bet += toAdd;
          player.totalBet += toAdd;
          currentBet = player.bet;
          player.lastAction = 'raise';
          if (player.chips === 0) player.isAllIn = true;
          break;
        }
        case 'all-in': {
          pot += player.chips;
          player.bet += player.chips;
          player.totalBet += player.chips;
          if (player.bet > currentBet) currentBet = player.bet;
          player.chips = 0;
          player.isAllIn = true;
          player.lastAction = 'all-in';
          break;
        }
      }

      players[playerIdx] = player;

      // Find next player
      const activePlayers = players.filter(p => !p.folded && !p.isAllIn && p.chips > 0);
      let nextIdx = prev.currentPlayerIndex;

      if (activePlayers.length <= 1) {
        // Go to next street or showdown
        return advanceStreet({ ...prev, players, pot, currentBet });
      }

      // Find next active player
      let attempts = 0;
      do {
        nextIdx = (nextIdx + 1) % players.length;
        attempts++;
      } while (
        (players[nextIdx].folded || players[nextIdx].isAllIn) &&
        attempts < players.length
      );

      // Check if betting round is over
      const bettingDone = activePlayers.every(
        p => p.bet === currentBet || p.isAllIn || p.folded
      );

      if (bettingDone) {
        return advanceStreet({ ...prev, players, pot, currentBet });
      }

      return { ...prev, players, pot, currentBet, currentPlayerIndex: nextIdx };
    });
  }, []);

  function advanceStreet(prev: GameState): GameState {
    const activePlayers = prev.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      // One player left, they win
      const winner = activePlayers[0];
      const players = prev.players.map(p =>
        p.id === winner.id ? { ...p, chips: p.chips + prev.pot } : p
      );
      return {
        ...prev, players,
        winners: [winner.id],
        handInProgress: false,
        gameLog: [
          { message: `${winner.name} wins $${prev.pot}!`, type: 'winner', timestamp: Date.now() },
          ...prev.gameLog,
        ],
      };
    }

    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    const nextStreetIdx = streetOrder.indexOf(prev.street) + 1;
    const nextStreet = streetOrder[nextStreetIdx] ?? 'showdown';

    if (nextStreet === 'showdown') {
      return handleShowdown(prev);
    }

    let deck = [...prev.deck];
    let newCards: Card[] = [];
    if (nextStreet === 'flop') {
      const { cards, remaining } = dealCards(deck, 3);
      newCards = cards; deck = remaining;
    } else if (nextStreet === 'turn' || nextStreet === 'river') {
      const { cards, remaining } = dealCards(deck, 1);
      newCards = cards; deck = remaining;
    }

    // Reset bets for new street
    const players = prev.players.map(p => ({ ...p, bet: 0, lastAction: undefined }));

    // First active player after dealer
    let firstIdx = (prev.dealerIndex + 1) % players.length;
    let attempts = 0;
    while ((players[firstIdx].folded || players[firstIdx].isAllIn) && attempts < players.length) {
      firstIdx = (firstIdx + 1) % players.length;
      attempts++;
    }

    return {
      ...prev,
      players,
      deck,
      communityCards: [...prev.communityCards, ...newCards],
      currentBet: 0,
      currentPlayerIndex: firstIdx,
      street: nextStreet,
      gameLog: [
        { message: `--- ${nextStreet.toUpperCase()} ---`, type: 'system', timestamp: Date.now() },
        ...prev.gameLog,
      ],
    };
  }

  function handleShowdown(prev: GameState): GameState {
    const activePlayers = prev.players.filter(p => !p.folded);
    const evals = activePlayers.map(p => ({
      player: p,
      eval: evaluateHand([...p.holeCards, ...prev.communityCards]),
    }));
    evals.sort((a, b) => b.eval.score - a.eval.score);
    const winner = evals[0].player;
    const players = prev.players.map(p =>
      p.id === winner.id ? { ...p, chips: p.chips + prev.pot } : p
    );
    return {
      ...prev, players,
      winners: [winner.id],
      street: 'showdown',
      handInProgress: false,
      gameLog: [
        {
          message: `${winner.name} wins $${prev.pot} with ${evals[0].eval.description}!`,
          type: 'winner',
          timestamp: Date.now(),
        },
        ...prev.gameLog,
      ],
    };
  }

  const processAITurn = useCallback(async (gameState: GameState) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.folded || currentPlayer.isAllIn) return;
    if (aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    setIsAIThinking(true);

    try {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200)); // Think delay
      const validActions = getValidActions(currentPlayer, gameState.currentBet);
      const decision = await getAIDecision(currentPlayer, gameState, validActions);

      addLog(
        `${currentPlayer.name}: ${decision.action.toUpperCase()}${decision.amount ? ` $${decision.amount}` : ''} — "${decision.reasoning}"`,
        'ai-thought',
        currentPlayer.id
      );

      applyAction(currentPlayer.id, decision.action, decision.amount);
    } finally {
      aiThinkingRef.current = false;
      setIsAIThinking(false);
    }
  }, [getValidActions, addLog, applyAction]);

  return {
    state,
    isAIThinking,
    startNewHand,
    applyAction,
    getValidActions,
    processAITurn,
    addLog,
  };
}
