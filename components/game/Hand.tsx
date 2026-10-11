'use client';
import { GameCard, Suit } from '@/lib/game-types';
import { Card } from './Card';
import { isPlayable } from '@/lib/game-logic';
import { cn } from '@/lib/utils';

interface HandProps { hand: GameCard[]; isPlayerTurn: boolean; topCard: GameCard; forcedSuit: Suit | null; pendingDraw: number; onPlayCard: (card: GameCard) => void; className?: string; sortByRank?: boolean; }
const rankOrder: Record<string, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'Jack': 11, 'Queen': 12, 'King': 13, 'Ace': 14, 'Joker': 15 };

export function Hand({ hand, isPlayerTurn, topCard, forcedSuit, pendingDraw, onPlayCard, className, sortByRank = true }: HandProps) {
  const displayHand = sortByRank ? [...hand].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]) : hand;
  return (
    <div className={cn("flex justify-center items-end flex-wrap gap-2 max-w-5xl p-4 min-h-[150px] md:min-h-[170px]", className)}>
      {displayHand.map((card) => <Card key={card.id} card={card} isPlayable={isPlayable(card, topCard, forcedSuit, pendingDraw) && isPlayerTurn} onPlay={onPlayCard} />)}
    </div>
  );
}
