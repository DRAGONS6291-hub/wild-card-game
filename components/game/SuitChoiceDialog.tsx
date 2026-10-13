'use client';
import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { Suit, GameCard } from '@/lib/game-types';
import { PlayingCard } from './PlayingCard';

interface SuitChoiceDialogProps {
  isOpen: boolean;
  onSuitChoose: (suit: Suit) => void;
  playerHand?: GameCard[];
}

export function SuitChoiceDialog({ isOpen, onSuitChoose, playerHand = [] }: SuitChoiceDialogProps) {
  if (!isOpen) return null;

  // Compter les cartes par couleur (AVEC les majuscules exactes de game-types.ts)
  const countBySuit = {
    Hearts: playerHand.filter(c => c.suit === 'Hearts').length,
    Diamonds: playerHand.filter(c => c.suit === 'Diamonds').length,
    Clubs: playerHand.filter(c => c.suit === 'Clubs').length,
    Spades: playerHand.filter(c => c.suit === 'Spades').length,
  };

  // Trouver la couleur majoritaire
  const bestSuit = (Object.entries(countBySuit) as [Suit, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Hearts';

  const suits = [
    { suit: 'Hearts' as Suit, name: 'Cœurs', icon: Heart, color: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100 border-red-300', count: countBySuit.Hearts },
    { suit: 'Diamonds' as Suit, name: 'Carreaux', icon: Diamond, color: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100 border-red-300', count: countBySuit.Diamonds },
    { suit: 'Clubs' as Suit, name: 'Trèfles', icon: Club, color: 'text-green-700', bg: 'bg-green-50 hover:bg-green-100 border-green-300', count: countBySuit.Clubs },
    { suit: 'Spades' as Suit, name: 'Piques', icon: Spade, color: 'text-gray-900', bg: 'bg-gray-50 hover:bg-gray-100 border-gray-300', count: countBySuit.Spades },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond semi-transparent SANS flou pour voir les cartes */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-yellow-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-black text-gray-800 mb-2">Choisissez une couleur</h3>
          <p className="text-sm text-gray-600">
            💡 Suggestion : <span className="font-bold text-yellow-600">
              {suits.find(s => s.suit === bestSuit)?.name} ({countBySuit[bestSuit]} cartes)
            </span>
          </p>
        </div>

        {/* Boutons de couleur avec compteur */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {suits.map(({ suit, name, icon: Icon, color, bg, count }) => (
            <button
              key={suit}
              onClick={() => onSuitChoose(suit)}
              className={`${bg} border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md relative ${
                suit === bestSuit ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
              }`}
            >
              <Icon className={`w-10 h-10 ${color}`} fill="currentColor" />
              <span className={`font-bold text-lg ${color}`}>{name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                count > 0 ? 'bg-yellow-400 text-black' : 'bg-gray-300 text-gray-600'
              }`}>
                {count} carte{count > 1 ? 's' : ''}
              </span>
              {suit === bestSuit && count > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                  ⭐ Meilleur
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Aperçu des cartes du joueur */}
        <div className="border-t-2 border-gray-200 pt-4">
          <p className="text-sm font-bold text-gray-600 mb-3 text-center">👇 Tes cartes ({playerHand.length})</p>
          <div className="flex justify-center flex-wrap gap-1 max-h-32 overflow-y-auto">
            {playerHand.map((card) => (
              <div key={card.id} className="transform scale-50 origin-top">
                <PlayingCard card={card} className="w-16 h-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}