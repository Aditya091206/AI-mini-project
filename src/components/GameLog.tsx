import React from 'react';
import type { LogEntry } from '../types/poker';
import { useEffect, useRef } from 'react';

interface GameLogProps {
  entries: LogEntry[];
}

const TYPE_STYLES: Record<LogEntry['type'], string> = {
  action: 'text-gray-300',
  system: 'text-blue-400 font-semibold',
  winner: 'text-yellow-400 font-bold',
  'ai-thought': 'text-cyan-300 italic text-xs',
};

const TYPE_PREFIX: Record<LogEntry['type'], string> = {
  action: '▸',
  system: '●',
  winner: '🏆',
  'ai-thought': '💭',
};

export function GameLog({ entries }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-3 h-48 overflow-y-auto flex flex-col-reverse gap-0.5 scrollbar-thin">
      <div ref={bottomRef} />
      {entries.map((entry, i) => (
        <div key={i} className={`text-xs leading-relaxed flex gap-1.5 ${TYPE_STYLES[entry.type]}`}>
          <span className="flex-shrink-0 mt-0.5">{TYPE_PREFIX[entry.type]}</span>
          <span>{entry.message}</span>
        </div>
      ))}
      {entries.length === 0 && (
        <div className="text-gray-600 text-xs text-center py-4">No activity yet. Start a hand!</div>
      )}
    </div>
  );
}
