import { createContext } from 'react';

export interface EmojiContextValue {
  emoji: string;
}

export const EmojiContext = createContext<EmojiContextValue | null>(null);
