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

//  Joker PRO avec dégradés, ombres et motif de fond
function JokerIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Dégradés */}
        <linearGradient id="hatRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4444"/>
          <stop offset="100%" stopColor="#990000"/>
        </linearGradient>
        <linearGradient id="hatBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4488ff"/>
          <stop offset="100%" stopColor="#003399"/>
        </linearGradient>
        <linearGradient id="hatGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffdd44"/>
          <stop offset="100%" stopColor="#cc8800"/>
        </linearGradient>
        <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff5e0"/>
          <stop offset="100%" stopColor="#f0d0a0"/>
        </linearGradient>
        <linearGradient id="collarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffdd44"/>
          <stop offset="100%" stopColor="#cc8800"/>
        </linearGradient>
        <radialGradient id="bellGrad">
          <stop offset="0%" stopColor="#ffee66"/>
          <stop offset="70%" stopColor="#ffcc00"/>
          <stop offset="100%" stopColor="#aa7700"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3"/>
        </filter>
      </defs>

      {/* Chapeau - pic gauche rouge */}
      <path d="M50 8 L28 50 L12 28 L22 60 L5 65 L35 75 Z" 
            fill="url(#hatRed)" stroke="#000" strokeWidth="1.2" filter="url(#shadow)"/>
      {/* Chapeau - pic droit bleu */}
      <path d="M50 8 L72 50 L88 28 L78 60 L95 65 L65 75 Z" 
            fill="url(#hatBlue)" stroke="#000" strokeWidth="1.2" filter="url(#shadow)"/>
      {/* Chapeau - pic central doré */}
      <path d="M50 8 L50 75 L35 50 Z" 
            fill="url(#hatGold)" stroke="#000" strokeWidth="1.2" filter="url(#shadow)"/>
      <path d="M50 8 L50 75 L65 50 Z" 
            fill="url(#hatGold)" stroke="#000" strokeWidth="1.2" filter="url(#shadow)"/>

      {/* Grelots aux pointes */}
      <circle cx="12" cy="28" r="4.5" fill="url(#bellGrad)" stroke="#000" strokeWidth="1"/>
      <circle cx="88" cy="28" r="4.5" fill="url(#bellGrad)" stroke="#000" strokeWidth="1"/>
      <circle cx="5" cy="65" r="4" fill="url(#bellGrad)" stroke="#000" strokeWidth="1"/>
      <circle cx="95" cy="65" r="4" fill="url(#bellGrad)" stroke="#000" strokeWidth="1"/>
      <circle cx="50" cy="8" r="4.5" fill="url(#bellGrad)" stroke="#000" strokeWidth="1"/>
      
      {/* Reflets sur les grelots */}
      <circle cx="10" cy="26" r="1.5" fill="#fff" opacity="0.7"/>
      <circle cx="86" cy="26" r="1.5" fill="#fff" opacity="0.7"/>
      <circle cx="48" cy="6" r="1.5" fill="#fff" opacity="0.7"/>

      {/* Visage ovale */}
      <ellipse cx="50" cy="90" rx="20" ry="22" fill="url(#faceGrad)" stroke="#000" strokeWidth="1.5" filter="url(#shadow)"/>
      
      {/* Yeux avec reflets */}
      <ellipse cx="43" cy="85" rx="3" ry="4" fill="#000"/>
      <ellipse cx="57" cy="85" rx="3" ry="4" fill="#000"/>
      <circle cx="44" cy="84" r="1" fill="#fff"/>
      <circle cx="58" cy="84" r="1" fill="#fff"/>
      
      {/* Sourcils */}
      <path d="M39 80 Q43 78 47 80" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M53 80 Q57 78 61 80" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      
      {/* Nez rouge */}
      <circle cx="50" cy="92" r="3.5" fill="#dc2626" stroke="#000" strokeWidth="0.8"/>
      <circle cx="49" cy="91" r="1" fill="#fff" opacity="0.6"/>
      
      {/* Grand sourire */}
      <path d="M38 98 Q50 108 62 98" stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M38 98 Q40 100 42 98" stroke="#dc2626" strokeWidth="1.5" fill="none"/>
      <path d="M62 98 Q60 100 58 98" stroke="#dc2626" strokeWidth="1.5" fill="none"/>
      
      {/* Joues roses */}
      <circle cx="38" cy="95" r="3" fill="#ff9999" opacity="0.6"/>
      <circle cx="62" cy="95" r="3" fill="#ff9999" opacity="0.6"/>

      {/* Col à volants */}
      <path d="M28 110 Q50 120 72 110 L77 125 L23 125 Z" 
            fill="url(#collarGrad)" stroke="#000" strokeWidth="1.5" filter="url(#shadow)"/>
      
      {/* Grelots sur le col */}
      <circle cx="35" cy="118" r="2.5" fill="url(#bellGrad)" stroke="#000" strokeWidth="0.8"/>
      <circle cx="50" cy="121" r="2.5" fill="url(#bellGrad)" stroke="#000" strokeWidth="0.8"/>
      <circle cx="65" cy="118" r="2.5" fill="url(#bellGrad)" stroke="#000" strokeWidth="0.8"/>
      
      {/* Motifs losanges sur le col */}
      <path d="M43 113 L47 117 L43 121 L39 117 Z" fill="#dc2626" stroke="#000" strokeWidth="0.5"/>
      <path d="M57 113 L61 117 L57 121 L53 117 Z" fill="#2563eb" stroke="#000" strokeWidth="0.5"/>
    </svg>
  );
}

interface PlayingCardProps {
  card?: GameCard;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  onPlay?: (card: GameCard) => void;
  className?: string;
}

export function PlayingCard({ card, isFaceDown, isPlayable, onPlay, className }: PlayingCardProps) {
  const handlePlay = () => {
    if (card && onPlay && isPlayable) {
      onPlay(card);
    }
  };

  const Component = onPlay ? 'button' : 'div';

  // Dos de carte - OPTIMISÉ MOBILE
  if (isFaceDown) {
    return (
      <div
        className={cn(
          "aspect-[2.5/3.5] w-16 sm:w-20 md:w-24 rounded-xl border-2 border-yellow-600 shadow-lg flex items-center justify-center overflow-hidden relative",
          className
        )}
        style={{
          background: 'radial-gradient(circle at center, #1a6b3c 0%, #0d4a28 60%, #062d17 100%)',
        }}
      >
        <div className="absolute inset-1.5 border border-yellow-600/50 rounded-lg"></div>
        <div className="absolute inset-2.5 border border-yellow-600/30 rounded-md"></div>
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rotate-45 bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-300 shadow-lg"></div>
        </div>
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-yellow-500/60 rounded-full"></div>
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-500/60 rounded-full"></div>
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-yellow-500/60 rounded-full"></div>
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-yellow-500/60 rounded-full"></div>
      </div>
    );
  }

  if (!card) return null;

  const Icon = card.isJoker ? null : suitIcons[card.suit!];
  const rankText = rankDisplay[card.rank] || card.rank;
  const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
  const textColor = isRed ? 'text-red-600' : 'text-black';

  return (
    <Component
      onClick={handlePlay}
      disabled={!isPlayable}
      className={cn(
        "aspect-[2.5/3.5] w-16 sm:w-20 md:w-24 rounded-xl bg-white border-2 border-gray-300 shadow-lg p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-300 overflow-hidden",
        isPlayable && "cursor-pointer ring-2 sm:ring-4 ring-yellow-400 ring-offset-1 sm:ring-offset-2 hover:-translate-y-2 sm:hover:-translate-y-4 shadow-2xl",
        !isPlayable && onPlay && "cursor-not-allowed opacity-70",
        textColor,
        className
      )}
    >
      {/* Coin haut gauche - OPTIMISÉ MOBILE */}
      <div className="flex flex-col items-start leading-none">
        <span className="font-bold text-sm sm:text-base md:text-lg">{rankText}</span>
        {Icon && <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 -mt-0.5" fill="currentColor" />}
      </div>

      {/* Centre de la carte - OPTIMISÉ MOBILE */}
      <div className="flex items-center justify-center flex-1">
        {card.isJoker ? (
          <JokerIcon className="w-10 h-14 sm:w-14 sm:h-20 md:w-16 md:h-24" />
        ) : (
          Icon && <Icon className="h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="currentColor" />
        )}
      </div>

      {/* Coin bas droit - OPTIMISÉ MOBILE */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className="font-bold text-xs sm:text-xs md:text-sm">{rankText}</span>
        {Icon && <Icon className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 -mt-0.5" fill="currentColor" />}
      </div>
    </Component>
  );
}