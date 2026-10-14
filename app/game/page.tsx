import { GameBoard } from '@/components/game/GameBoard';
import { createInitialGameState } from '@/lib/game-logic';

// Next.js 15 : searchParams est une Promise dans les Server Components
export default async function GamePage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string }>;
}) {
  // On attend les paramètres de l'URL
  const params = await searchParams;
  const difficulty = (params.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
  
  // On génère l'état initial du jeu côté serveur (très rapide)
  const initialGameState = createInitialGameState(difficulty);

  // On passe cet état au composant client GameBoard
  return <GameBoard initialGameState={initialGameState} />;
}