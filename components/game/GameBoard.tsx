'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { PlayingCard } from '@/components/game/Card';
import { GameOverDisplay } from '@/components/game/GameOverDisplay';
import { SoundButton } from '@/components/ui/SoundButton';
import { useSound } from '@/hooks/useSound';
import { createInitialGameState, getWinner, isPlayable } from '@/lib/game-logic';
import type { GameCard, GameState, Suit } from '@/lib/game-types';
import { Home, RotateCcw } from 'lucide-react';

interface GameBoardProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

export function GameBoard({ difficulty }: GameBoardProps) {
  const router = useRouter();
  const { userId } = useAuth();
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
    const newGame = createInitialGameState(difficulty);
    setGameState(newGame);
    setWinner(null);
  }, [difficulty]);

  const handlePlayCard = (card: GameCard) => {
    if (!gameState || winner) return;
    if (gameState.currentPlayer !== 'player') return;
    
    // Vérifier si la carte est jouable
    if (!isPlayable(card, gameState.topCard, gameState.forcedSuit, gameState.pendingDraw, gameState.jokerPendingDraw)) {
      return;
    }
    
    playCardSound();
    
    // Créer le nouvel état du jeu
    const newPlayerHand = gameState.playerHand.filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];
    
    const newState: GameState = {
      ...gameState,
      playerHand: newPlayerHand,
      discardPile: newDiscardPile,
      topCard: card,
      currentPlayer: 'ai',
      forcedSuit: null,
      gameMessage: "L'IA réfléchit...",
      isAiThinking: true,
    };
    
    setGameState(newState);
    
    // Vérifier si le joueur a gagné
    if (newPlayerHand.length === 0) {
      setWinner('player');
      return;
    }
    
    // Tour de l'IA après un délai
    setTimeout(() => {
      playAiTurn(newState);
    }, 1000);
  };

  const playAiTurn = (state: GameState) => {
    // Logique simple de l'IA : jouer la première carte jouable
    const playableCard = state.aiHand.find(card => 
      isPlayable(card, state.topCard, state.forcedSuit, state.pendingDraw, state.jokerPendingDraw)
    );
    
    if (playableCard) {
      const newAiHand = state.aiHand.filter(c => c.id !== playableCard.id);
      const newDiscardPile = [...state.discardPile, playableCard];
      
      const newState: GameState = {
        ...state,
        aiHand: newAiHand,
        discardPile: newDiscardPile,
        topCard: playableCard,
        currentPlayer: 'player',
        isAiThinking: false,
        gameMessage: "À votre tour !",
      };
      
      setGameState(newState);
      
      // Vérifier si l'IA a gagné
      if (newAiHand.length === 0) {
        setWinner('ai');
      }
    } else {
      // L'IA pioche
      if (state.deck.length > 0) {
        const drawnCard = state.deck[0];
        const newDeck = state.deck.slice(1);
        const newAiHand = [...state.aiHand, drawnCard];
        
        const newState: GameState = {
          ...state,
          aiHand: newAiHand,
          deck: newDeck,
          currentPlayer: 'player',
          isAiThinking: false,
          gameMessage: "L'IA a pioché. À votre tour !",
        };
        
        setGameState(newState);
      } else {
        setGameState({
          ...state,
          currentPlayer: 'player',
          isAiThinking: false,
          gameMessage: "Plus de cartes. À votre tour !",
        });
      }
    }
  };

  const handlePlayAgain = () => {
    setWinner(null);
    const newGame = createInitialGameState(difficulty);
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
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/50 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <span className="text-blue-400 font-bold"></span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Joueur</p>
              <p className="text-yellow-400 font-black text-lg">Toi</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile'}
            </span>
            <p className="text-white/60 text-xs mt-1">Wild Card</p>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-white font-bold text-sm">Adversaire</p>
              <p className="text-red-400 font-black text-lg">IA</p>
            </div>
            <div className="bg-red-500/20 p-2 rounded-lg">
              <span className="text-red-400 font-bold"></span>
            </div>
          </div>
        </div>

        {/* Zone de jeu */}
        <div className="space-y-8">
          {/* Main de l'IA */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50">
            <h3 className="text-white font-bold mb-4 text-center">
              IA - {gameState.aiHand.length} cartes
            </h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.aiHand.map((card, index) => (
                <PlayingCard key={card.id || index} isFaceDown />
              ))}
            </div>
          </div>

          {/* Zone centrale (carte jouée) */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-yellow-400/50 min-h-[200px] flex items-center justify-center">
            <div className="flex gap-8 items-center">
              <PlayingCard card={gameState.topCard} />
            </div>
          </div>

          {/* Main du joueur */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50">
            <h3 className="text-white font-bold mb-4 text-center">
              Ta main - {gameState.playerHand.length} cartes
            </h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.playerHand.map((card, index) => {
                const playable = gameState.currentPlayer === 'player' && 
                  isPlayable(card, gameState.topCard, gameState.forcedSuit, gameState.pendingDraw, gameState.jokerPendingDraw);
                
                return (
                  <PlayingCard 
                    key={card.id || index}
                    card={card}
                    isPlayable={playable}
                    onPlay={handlePlayCard}
                  />
                );
              })}
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
            userId={userId ?? undefined}
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