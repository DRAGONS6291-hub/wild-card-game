'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { LocalGameBoard } from '@/components/game/LocalGameBoard';
import { createInitialGameState, createInitialLocalGameState } from '@/lib/game-logic';
import { Loader2 } from 'lucide-react';
import type { GameState, LocalGameState, Difficulty } from '@/lib/game-types';

function GamePageContent() {
  const searchParams = useSearchParams();
  const [initialGameState, setInitialGameState] = useState<GameState | null>(null);
  const [initialLocalGameState, setInitialLocalGameState] = useState<LocalGameState | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const playerCount = searchParams.get('players');
    const difficulty = (searchParams.get('difficulty') || 'medium') as Difficulty;
    if (playerCount) {
      const numPlayers = parseInt(playerCount, 10);
      const playerNames = Array.from({ length: numPlayers }, (_, i) => searchParams.get(`name${i}`) || `Joueur ${i + 1}`);
      setInitialLocalGameState(createInitialLocalGameState(playerNames));
      setIsLocal(true);
    } else {
      setInitialGameState(createInitialGameState(difficulty));
      setIsLocal(false);
    }
  }, [searchParams]);

  if (isLocal) {
    if (!initialLocalGameState) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin" /></div>;
    return <LocalGameBoard initialGameState={initialLocalGameState} />;
  }
  if (!initialGameState) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin" /></div>;
  return <GameBoard initialGameState={initialGameState} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin" /></div>}>
      <GamePageContent />
    </Suspense>
  );
}
