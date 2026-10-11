'use client';
import { GameCard, Suit, SUITS_FR } from '@/lib/game-types';
import { Card } from './Card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeckProps { topCard: GameCard; pendingDraw: number; deckCount: number; onDraw: () => void; drawButtonDisabled: boolean; gameMessage: string | null; forcedSuit: Suit | null; isPending?: boolean; className?: string; }

export function Deck({ topCard, pendingDraw, deckCount, onDraw, drawButtonDisabled, gameMessage, forcedSuit, isPending, className }: DeckProps) {
  return (
    <div className={cn("flex-shrink-0 flex items-center justify-center gap-4 md:gap-8 my-4 py-4", className)}>
      <div className="flex flex-col items-center gap-2">
        <div className="relative"><Card card={topCard} />{pendingDraw > 0 && <Badge variant="destructive" className="absolute -top-3 -right-3 text-lg rounded-full h-8 w-8 flex items-center justify-center animate-bounce">+{pendingDraw}</Badge>}</div>
        <span className="text-sm font-semibold">Défausse</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button onClick={onDraw} disabled={drawButtonDisabled} className="cursor-pointer disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"><Card isFaceDown /></button>
        <span className="text-sm font-semibold">Pioche ({deckCount})</span>
      </div>
      <div className="w-48 text-center p-4 rounded-lg bg-background/80 shadow-md border-2 border-primary/20 backdrop-blur-sm">
        {isPending && <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-primary" />}
        <p className="font-semibold text-base min-h-[48px] text-foreground flex items-center justify-center">{isPending ? "Traitement..." : gameMessage}</p>
        {forcedSuit && <p className="text-sm text-destructive font-bold mt-1">Imposé : {SUITS_FR[forcedSuit]}</p>}
      </div>
    </div>
  );
}
