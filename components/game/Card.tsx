'use client';
import { GameCard, Suit } from '@/lib/game-types';
import { cn } from '@/lib/utils';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

const suitIcons: Record<Suit, React.ElementType> = {
  Hearts: Heart,
  Diamonds: Diamond,
  Clubs: Club,
  Spades: Spade,
};

const rankDisplay: Record<string, string> = {
  'Jack': 'V',
  'Queen': 'D',
  'King': 'R',
  'Ace': 'A',
};

interface CardProps {
  card?: GameCard;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  onPlay?: (card: GameCard) => void;
  className?: string;
}

export function Card({ card, isFaceDown, isPlayable, onPlay, className }: CardProps) {
  const handlePlay = () => {
    if (card && onPlay && isPlayable) {
      onPlay(card);
    }
  };

  const Component = onPlay ? 'button' : 'div';
  const cardColor = card && !card.isJoker && (card.suit === 'Hearts' || card.suit === 'Diamonds') ? 'text-red-600' : 'text-foreground';

  if (isFaceDown) {
    return (
      <div className={cn(
        "aspect-[2.5/3.5] w-20 md:w-24 rounded-lg bg-primary border-2 border-primary-foreground/50 shadow-md flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-green-700 to-primary",
        className
      )}>
        <div className="text-white/20 text-4xl font-bold">WC</div>
      </div>
    );
  }

  if (!card) return null;

  const Icon = card.isJoker ? null : suitIcons[card.suit!];
  const rankText = rankDisplay[card.rank] || card.rank;

  return (
    <Component
      onClick={handlePlay}
      disabled={!isPlayable}
      className={cn(
        "aspect-[2.5/3.5] w-20 md:w-24 rounded-lg bg-white/90 dark:bg-slate-900 border border-gray-300 dark:border-gray-600 shadow-lg p-2 flex flex-col justify-between transition-all duration-300",
        isPlayable && "cursor-pointer ring-4 ring-accent dark:ring-yellow-400 ring-offset-2 hover:-translate-y-4 shadow-xl hover:shadow-2xl",
        !isPlayable && onPlay && "cursor-not-allowed opacity-60",
        cardColor,
        className
      )}
    >
      <div className="text-left">
        <div className="font-bold text-lg md:text-xl leading-none">{rankText}</div>
        {Icon && <Icon className="h-4 w-4" fill="currentColor" />}
      </div>
      <div className="flex items-center justify-center">
        {card.isJoker ? (
          <div className="text-center">
            <p className="font-bold text-sm text-black dark:text-white">JOKER</p>
          </div>
        ) : (
          Icon && <Icon className="h-8 w-8" fill="currentColor" />
        )}
      </div>
      <div className="text-right rotate-180">
        <div className="font-bold text-lg md:text-xl leading-none">{rankText}</div>
        {Icon && <Icon className="h-4 w-4" fill="currentColor" />}
      </div>
    </Component>
  );
}