import { useContext } from 'react';
import { EmojiContext } from '../context/EmojiContextInstance.js';

export function useEmoji() {
  const ctx = useContext(EmojiContext);
  if (!ctx) throw new Error('useEmoji must be used inside EmojiProvider');
  return ctx;
}
