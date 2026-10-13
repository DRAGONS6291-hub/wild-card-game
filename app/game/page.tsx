'use client';
import { useSearchParams } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { Suspense } from 'react';

function GameContent() {
  const searchParams = useSearchParams();
  // Lit la difficulté dans l'URL, par défaut 'easy'
  const difficulty = (searchParams.get('difficulty') as 'easy' | 'medium' | 'hard') || 'easy';

  return <GameBoard difficulty={difficulty} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-2xl font-bold">Chargement de la partie...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}