// api/gemini.ts
import Groq from 'groq-sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
