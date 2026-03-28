import { ReactNode, useState } from 'react';
import { EmojiContext } from './EmojiContextInstance.js';

const MOOD_EMOJIS = ['😀', '😂', '🥰', '😎', '🤔', '😴', '🥳', '😤', '😱', '🤗'];

const STORAGE_KEY = 'last_placeholder_emoji';

function pickEmoji(): string {
  const last = localStorage.getItem(STORAGE_KEY);
  const candidates = last ? MOOD_EMOJIS.filter((e) => e !== last) : MOOD_EMOJIS;
  const pool = candidates.length > 0 ? candidates : MOOD_EMOJIS;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  localStorage.setItem(STORAGE_KEY, chosen);
  return chosen;
}

export function EmojiProvider({ children }: { children: ReactNode }) {
  const [emoji] = useState<string>(pickEmoji);
  return <EmojiContext.Provider value={{ emoji }}>{children}</EmojiContext.Provider>;
}
