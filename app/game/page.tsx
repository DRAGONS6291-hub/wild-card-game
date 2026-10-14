'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GameBoard } from '@/components/game/GameBoard';
import { createInitialGameState } from '@/lib/game-logic';
import { Loader2 } from 'lucide-react';

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficulty = (searchParams.get('difficulty') as 'easy' | 'medium' | 'hard') || 'medium';
  
  const [initialGameState, setInitialGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Créer l'état initial du jeu avec la difficulté
    const gameState = createInitialGameState(difficulty);
    setInitialGameState(gameState);
    setLoading(false);
  }, [difficulty]);

  if (loading || !initialGameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-bold">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  return <GameBoard initialGameState={initialGameState} />;
}