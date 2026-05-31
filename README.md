# 🃏 Texas Hold'em CFR Poker Engine

An advanced multi-agent AI poker simulator with CFR, POMDP, Deep RL, and GTO solver agents, powered by Gemini AI.

## Setup

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your Gemini API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and paste your key from https://aistudio.google.com/app/apikey
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Project Structure

```
src/
  types/poker.ts        — All TypeScript types
  engine/poker.ts       — Deck, dealing, hand evaluation
  engine/ai.ts          — Gemini-powered AI decision engine
  hooks/useGameState.ts — Game state management
  components/
    Card.tsx            — Playing card components
    PlayerSeat.tsx      — Player position UI
    ActionButtons.tsx   — Human player controls
    GameLog.tsx         — Live game log
  App.tsx               — Main UI
  main.tsx              — Entry point
server.ts               — Express backend (Gemini proxy)
```

## AI Agents

| Agent | Strategy |
|---|---|
| 🧮 CFR Solver | Nash equilibrium / GTO ranges |
| 🔮 POMDP Agent | Belief state planning under uncertainty |
| 🤖 Deep RL Bot | Self-play trained, emergent strategies |
| ⚡ GTO Optimizer | Mixed strategies, unexploitable frequencies |
