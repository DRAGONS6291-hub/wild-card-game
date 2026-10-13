'use client';
import { Trophy, Swords } from 'lucide-react';
import type { Player } from '@/lib/game-types';

interface LocalGameHeaderProps {
  player: Player;
  ai: Player;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function LocalGameHeader({ player, ai, difficulty }: LocalGameHeaderProps) {
  const difficultyLabels = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <Swords className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Joueur</p>
          <p className="text-yellow-400 font-black text-lg">{player.name}</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
          {difficultyLabels[difficulty]}
        </span>
        <p className="text-white/60 text-xs mt-1">Wild Card</p>
      </div>

      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-white font-bold text-sm">Adversaire</p>
          <p className="text-red-400 font-black text-lg">{ai.name}</p>
        </div>
        <div className="bg-red-500/20 p-2 rounded-lg">
          <Trophy className="w-6 h-6 text-red-400" />
        </div>
      </div>
    </div>
  );
}