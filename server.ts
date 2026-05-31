import express from 'express';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('ERROR: GROQ_API_KEY is not set. Please add it to .env.local');
  process.exit(1);
}

const groq = new Groq({ apiKey });

async function createServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/gemini', async (req, res) => {
    const { systemPrompt, userPrompt } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: 'userPrompt is required' });
    }
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });
      const text = response.choices[0]?.message?.content ?? '';
      return res.json({ text });
    } catch (err: unknown) {
      console.error('Groq API error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback: serve index.html for all non-API routes
    app.get('*', async (req, res, next) => {
      try {
        const indexPath = path.join(__dirname, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(req.url, html);
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🃏 Texas Hold'em AI Poker running at http://localhost:${PORT}\n`);
    console.log('  AI Agents: CFR Solver · POMDP Agent · Deep RL Bot · GTO Optimizer\n');
  });
}

createServer().catch(console.error);