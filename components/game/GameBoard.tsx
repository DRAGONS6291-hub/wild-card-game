'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/game/Card';
import { GameOverDisplay } from '@/components/game/GameOverDisplay';
import { LocalGameHeader } from '@/components/game/LocalGameHeader';
import { SoundButton } from '@/components/ui/SoundButton';
import { useSound } from '@/hooks/useSound';
import { createGame, playCard as playCardAction, determineWinner } from '@/lib/game-logic';
import type { Card as CardType, GameState, Player } from '@/lib/game-types';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface GameBoardProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

export function GameBoard({ difficulty }: GameBoardProps) {
  const router = useRouter();
  const { userId, profile } = useAuth();
  const { playCard: playCardSound } = useSound();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentWins, setCurrentWins] = useState(0);
  const [currentTotalGames, setCurrentTotalGames] = useState(0);
  const [currentXp, setCurrentXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);

  // Charger les stats du joueur au démarrage
  useEffect(() => {
    if (userId) {
      const loadStats = async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('xp, level')
          .eq('id', userId)
          .single();
        
        if (profileData) {
          setCurrentXp(profileData.xp || 0);
          setCurrentLevel(profileData.level || 1);
        }

        const { data: leaderboardData } = await supabase
          .from('leaderboard')
          .select('wins, total_games')
          .eq('id', userId)
          .single();
        
        if (leaderboardData) {
          setCurrentWins(leaderboardData.wins || 0);
          setCurrentTotalGames(leaderboardData.total_games || 0);
        }
      };
      loadStats();
    }
  }, [userId]);

  // Initialiser la partie
  useEffect(() => {
    const newGame = createGame(difficulty);
    setGameState(newGame);
    setWinner(null);
  }, [difficulty]);

  const handlePlayCard = (card: CardType) => {
    if (!gameState || winner) return;
    
    playCardSound();
    
    const newState = playCardAction(gameState, card);
    setGameState(newState);
    
    // Vérifier si la partie est terminée
    if (newState.playerHand.length === 0 || newState.aiHand.length === 0) {
      const gameWinner = determineWinner(newState);
      setWinner(gameWinner);
    }
  };

  const handlePlayAgain = () => {
    setWinner(null);
    const newGame = createGame(difficulty);
    setGameState(newGame);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-2xl font-bold">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* En-tête */}
        <LocalGameHeader 
          player={gameState.player}
          ai={gameState.ai}
          difficulty={difficulty}
        />

        {/* Zone de jeu */}
        <div className="mt-8 space-y-8">
          {/* Main de l'IA */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50">
            <h3 className="text-white font-bold mb-4 text-center">
              {gameState.ai.name} - {gameState.aiHand.length} cartes
            </h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.aiHand.map((card, index) => (
                <Card key={index} card={card} hidden />
              ))}
            </div>
          </div>

          {/* Zone centrale (cartes jouées) */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-yellow-400/50 min-h-[200px] flex items-center justify-center">
            <div className="flex gap-8 items-center">
              {gameState.lastPlayedCard && (
                <>
                  <Card card={gameState.lastPlayedCard.playerCard} label="Tu as joué" />
                  <div className="text-white text-4xl font-black">VS</div>
                  <Card card={gameState.lastPlayedCard.aiCard} label={gameState.ai.name} />
                </>
              )}
            </div>
          </div>

          {/* Main du joueur */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50">
            <h3 className="text-white font-bold mb-4 text-center">
              Ton main - {gameState.playerHand.length} cartes
            </h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.playerHand.map((card, index) => (
                <Card 
                  key={index} 
                  card={card} 
                  onClick={() => handlePlayCard(card)}
                  disabled={!!winner}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Boutons de contrôle */}
        <div className="fixed bottom-8 right-8 flex gap-3 z-40">
          <SoundButton
            onClick={() => router.push('/menu')}
            className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold border-b-4 border-blue-900 shadow-lg p-4 rounded-full"
          >
            <Home className="w-6 h-6" />
          </SoundButton>
          
          <SoundButton
            onClick={handlePlayAgain}
            className="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold border-b-4 border-green-900 shadow-lg p-4 rounded-full"
          >
            <RotateCcw className="w-6 h-6" />
          </SoundButton>
        </div>

        {/* Écran de fin de partie */}
        {winner && (
          <GameOverDisplay 
            winner={winner}
            onPlayAgain={handlePlayAgain}
            difficulty={difficulty}
            userId={userId}
            currentStats={{
              wins: currentWins,
              totalGames: currentTotalGames,
              xp: currentXp,
              level: currentLevel,
            }}
          />
        )}
      </div>
    </div>
  );
}