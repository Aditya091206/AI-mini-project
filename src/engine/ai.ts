import type { Player, GameState, AIDecision, PlayerAction, AIPersonality } from '../types/poker';
import { evaluateHand, cardToString } from './poker';

const PERSONALITY_PROMPTS: Record<AIPersonality, string> = {
  'CFR Solver': `You are a CFR (Counterfactual Regret Minimization) poker solver. 
You play Game Theory Optimal (GTO) poker, minimizing exploitability. 
You think in terms of ranges, equity, and Nash equilibria. 
You balance your ranges and make decisions based on pot odds and expected value.`,

  'POMDP Agent': `You are a POMDP (Partially Observable Markov Decision Process) poker agent.
You model uncertainty explicitly and update belief states about opponent hands.
You reason about information sets and value of information.
You're methodical, probabilistic, and slightly conservative.`,

  'Deep RL Bot': `You are a Deep Reinforcement Learning poker bot trained via self-play.
You've learned emergent strategies that sometimes deviate from classical theory.
You're aggressive, adaptive, and exploit patterns you detect in opponents.
You occasionally make unconventional plays that confuse opponents.`,

  'GTO Optimizer': `You are a GTO (Game Theory Optimal) poker optimizer.
You focus on mixed strategies, range construction, and unexploitability.
You think in frequencies: "I should bet 70% here and check 30%".
You're balanced, calculated, and never emotionally driven.`,
};

export async function getAIDecision(
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[]
): Promise<AIDecision> {
  const personality = player.personality ?? 'CFR Solver';
  const systemPrompt = PERSONALITY_PROMPTS[personality];

  const handStr = player.holeCards.map(cardToString).join(', ');
  const communityStr = gameState.communityCards.length
    ? gameState.communityCards.map(cardToString).join(', ')
    : 'None yet';

  const handEval = player.holeCards.length >= 2
    ? evaluateHand([...player.holeCards, ...gameState.communityCards])
    : null;

  const activePlayers = gameState.players.filter(p => !p.folded && !p.isAllIn);

  const userPrompt = `
GAME STATE:
- Street: ${gameState.street}
- Pot: $${gameState.pot}
- Current bet to call: $${gameState.currentBet - player.bet}
- Your chips: $${player.chips}
- Your hole cards: ${handStr}
- Community cards: ${communityStr}
- Current hand strength: ${handEval?.description ?? 'N/A'}
- Active opponents: ${activePlayers.length - 1}
- Your total bet this street: $${player.bet}

VALID ACTIONS: ${validActions.join(', ')}

Respond ONLY with a JSON object (no markdown, no explanation outside JSON):
{
  "action": "<one of: ${validActions.join('|')}>",
  "amount": <raise amount in dollars, or null>,
  "reasoning": "<1-2 sentence strategic explanation>",
  "confidence": <0.0 to 1.0>,
  "bluffProbability": <0.0 to 1.0, probability this is a bluff>
}`;

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const text: string = data.text ?? '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as AIDecision;

    // Validate action
    if (!validActions.includes(parsed.action)) {
      parsed.action = validActions[0];
    }

    return parsed;
  } catch {
    // Fallback heuristic decision
    return fallbackDecision(player, gameState, validActions);
  }
}

function fallbackDecision(
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[]
): AIDecision {
  const callAmount = gameState.currentBet - player.bet;
  const potOdds = callAmount / (gameState.pot + callAmount);
  const handEval = player.holeCards.length >= 2
    ? evaluateHand([...player.holeCards, ...gameState.communityCards])
    : null;
  const handScore = handEval?.score ?? 0;

  let action: PlayerAction = 'fold';

  if (callAmount === 0 && validActions.includes('check')) {
    action = Math.random() > 0.4 ? 'check' : (validActions.includes('raise') ? 'raise' : 'check');
  } else if (handScore > 200000 && validActions.includes('raise')) {
    action = 'raise';
  } else if (potOdds < 0.3 && validActions.includes('call')) {
    action = 'call';
  } else if (validActions.includes('fold')) {
    action = 'fold';
  }

  return {
    action,
    amount: action === 'raise' ? Math.min(gameState.currentBet * 2, player.chips) : undefined,
    reasoning: 'Heuristic fallback decision based on pot odds and hand strength.',
    confidence: 0.5,
    bluffProbability: 0.1,
  };
}
