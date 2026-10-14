'use client';
import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GameState, GameCard, Suit, SUITS_FR, RANKS } from '@/lib/game-types';
import { PlayingCard } from './PlayingCard';
import { isPlayable } from '@/lib/game-logic';
import { handlePlayerAction } from '@/app/game/actions';
import { SuitChoiceDialog } from './SuitChoiceDialog';
import { GameOverDisplay } from './GameOverDisplay';
import { Loader2, Trophy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useSound } from '@/hooks/useSound';

// 🌟 IMPORTS POUR LE SYSTÈME XP / SUCCÈS
import { calculateXpReward, getLevelInfo } from '@/lib/level-system';
import { checkAndUnlockAchievements } from '@/lib/achievements';

const rankOrder = [...RANKS, 'Joker'].reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {} as Record<string, number>);

const AVATARS = {
  ai: 'https://i.pravatar.cc/150?img=32',
};

export function GameBoard({ initialGameState }: { initialGameState: GameState }) {
  const { profile, userId } = useAuth();
  // ✅ CORRECTION : utiliser les bons noms de fonctions son
  const { playCard, playVictory, playDefeat } = useSound();
  
  const playerName = profile?.pseudo || 'TOI';
  const playerAvatar = profile?.avatar_url || 'https://i.pravatar.cc/150?img=12';

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isPending, startTransition] = useTransition();
  const [gameTime, setGameTime] = useState(0);
  const [autoDrawMessage, setAutoDrawMessage] = useState<string | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const { toast } = useToast();

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const timer = setInterval(() => setGameTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gameState.gameMessage?.includes("erreur") || gameState.gameMessage?.includes("problème")) {
      toast({ title: 'Avertissement', description: gameState.gameMessage, variant: 'destructive' });
    }
  }, [gameState.gameMessage, toast]);

  // 🌟 MODIFIÉ : Sauvegarde du score + XP + Succès + son de fin de partie
  useEffect(() => {
    if (gameState.winner && profile && userId && !scoreSaved) {
      const saveScoreAndXp = async () => {
        const isWin = gameState.winner === 'player';
        const result = isWin ? 'win' : 'loss';
        const cardsRemaining = isWin ? 0 : gameState.playerHand.length;
        const difficulty = gameState.difficulty || 'medium';

        // 1. Sauvegarder le score
        const { error: scoreError } = await supabase
          .from('scores')
          .insert({
            user_id: userId,
            pseudo: profile.pseudo,
            difficulty: difficulty,
            result: result,
            cards_remaining: cardsRemaining,
          });

        if (scoreError) {
          console.error('Erreur sauvegarde score:', scoreError);
          toast({ title: 'Erreur', description: 'Impossible de sauvegarder le score.', variant: 'destructive' });
        } else {
          // 2. Calculer et mettre à jour l'XP et le niveau
          const xpReward = calculateXpReward(isWin, difficulty);
          const currentXp = profile.xp || 0;
          const newTotalXp = currentXp + xpReward;
          const levelInfo = getLevelInfo(newTotalXp);
          const newLevel = levelInfo.level;

          await supabase
            .from('profiles')
            .update({ xp: newTotalXp, level: newLevel })
            .eq('id', userId);

          // 3. Récupérer les stats actuelles pour les succès
          const { data: leaderboardData } = await supabase
            .from('leaderboard')
            .select('wins, total_games')
            .eq('id', userId)
            .single();
            
          const currentWins = leaderboardData?.wins || 0;
          const currentTotalGames = leaderboardData?.total_games || 0;

          // 4. Vérifier et débloquer les succès
          const newlyUnlocked = await checkAndUnlockAchievements(userId, {
            wins: isWin ? currentWins + 1 : currentWins,
            totalGames: currentTotalGames + 1,
            level: newLevel,
            totalXp: newTotalXp,
            wonOnHard: isWin && difficulty === 'hard',
          });

          setScoreSaved(true);
          if (isWin) {
            playVictory();
          } else {
            playDefeat();
          }
          
          // 5. Notification si succès débloqué
          if (newlyUnlocked.length > 0) {
            toast({ 
              title: '🏆 Succès débloqué !', 
              description: `Tu as débloqué ${newlyUnlocked.length} nouveau(x) succès !`,
              variant: 'default'
            });
          }
        }
      };
      saveScoreAndXp();
    }
  }, [gameState.winner, profile, userId, scoreSaved, gameState.playerHand.length, gameState.difficulty, toast, playVictory, playDefeat]);

  // Pioche automatique
  useEffect(() => {
    const { currentPlayer, winner, jokerPendingDraw, pendingDraw, playerHand } = gameState;
    
    if (currentPlayer !== 'player' || winner || isPending) {
      setAutoDrawMessage(null);
      return;
    }

    if (jokerPendingDraw && pendingDraw > 0) {
      setAutoDrawMessage(` Pioche automatique de ${pendingDraw} cartes (Joker)...`);
      const timeout = setTimeout(() => {
        const currentState = gameStateRef.current;
        if (currentState.jokerPendingDraw && currentState.pendingDraw > 0 && currentState.currentPlayer === 'player') {
          startTransition(async () => {
            const newState = await handlePlayerAction(currentState, { type: 'DRAW_CARD' });
            setGameState(newState);
            setAutoDrawMessage(null);
          });
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (pendingDraw > 0 && !jokerPendingDraw) {
      const hasSeven = playerHand.some(c => c.rank === '7');
      if (!hasSeven) {
        setAutoDrawMessage(`🎴 Pioche automatique de ${pendingDraw} cartes (7 cumulés)...`);
        const timeout = setTimeout(() => {
          const currentState = gameStateRef.current;
          if (currentState.pendingDraw > 0 && !currentState.jokerPendingDraw && currentState.currentPlayer === 'player') {
            const stillNoSeven = currentState.playerHand.some(c => c.rank === '7');
            if (!stillNoSeven) {
              startTransition(async () => {
                const newState = await handlePlayerAction(currentState, { type: 'DRAW_CARD' });
                setGameState(newState);
                setAutoDrawMessage(null);
              });
            }
          }
        }, 1500);
        return () => clearTimeout(timeout);
      } else {
        setAutoDrawMessage(null);
      }
    } else {
      setAutoDrawMessage(null);
    }
  }, [gameState.currentPlayer, gameState.winner, gameState.jokerPendingDraw, gameState.pendingDraw, gameState.playerHand, isPending]);

  const onAction = (action: Parameters<typeof handlePlayerAction>[1]) => {
    startTransition(async () => {
      const newState = await handlePlayerAction(gameState, action);
      setGameState(newState);
      if (action.type === 'NEW_GAME') {
        setScoreSaved(false);
      }
    });
  };

  // ✅ CORRECTION : playCard au lieu de playCardPlay
  const handlePlayCard = (card: GameCard) => {
    playCard();
    onAction({ type: 'PLAY_CARD', card });
  };
  
  // ✅ CORRECTION : playCard au lieu de playCardDraw
  const handleDrawCard = () => {
    playCard();
    onAction({ type: 'DRAW_CARD' });
  };
  
  const handleEndTurn = () => onAction({ type: 'END_TURN' });
  const handleSuitChoice = (suit: Suit) => onAction({ type: 'SET_SUIT', suit });
  const handlePlayAgain = () => onAction({ type: 'NEW_GAME' });

  const { playerHand, aiHand, topCard, forcedSuit, currentPlayer, winner, isSuitPickerOpen, gameMessage, canPlayerEndTurn, pendingDraw, jokerPendingDraw } = gameState;
  const isPlayerTurn = currentPlayer === 'player' && !isPending && !winner;
  const sortedPlayerHand = [...playerHand].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);
  const canPlayerPlaySeven = playerHand.some(c => c.rank === '7');
  
  const mustAutoDraw = (jokerPendingDraw && pendingDraw > 0) || (pendingDraw > 0 && !jokerPendingDraw && !canPlayerPlaySeven);
  const drawButtonDisabled = !isPlayerTurn || canPlayerEndTurn || mustAutoDraw;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,215,0,0.05) 20px, rgba(255,215,0,0.05) 40px)`,
      }}></div>

      {winner && (
        <GameOverDisplay 
          winner={winner} 
          onPlayAgain={handlePlayAgain} 
          difficulty={gameState.difficulty || 'medium'}
          userId={userId ?? undefined}
          currentStats={{
            wins: 0,
            totalGames: 0,
            xp: profile?.xp || 0,
            level: profile?.level || 1,
          }}
        />
      )}
      
      <SuitChoiceDialog 
        isOpen={isSuitPickerOpen} 
        onSuitChoose={handleSuitChoice}
        playerHand={playerHand}
      />

      {/* TIMER */}
      <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-sm text-yellow-400 font-bold text-2xl px-4 py-2 rounded-lg border-2 border-yellow-400/50 shadow-lg">
        ⏱️ {formatTime(gameTime)}
      </div>

      {/* QUITTER */}
      <div className="absolute top-6 right-6 z-20">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 border-b-4 border-red-900 font-bold shadow-lg">
              Quitter
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Quitter la partie ?</AlertDialogTitle>
              <AlertDialogDescription>La partie en cours sera perdue.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Non</AlertDialogCancel>
              <AlertDialogAction asChild><Link href="/menu">Oui</Link></AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* IA EN HAUT */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
        <div className="relative mb-2">
          <div className={`w-20 h-20 rounded-full border-4 ${currentPlayer === 'ai' ? 'border-yellow-400 animate-pulse' : 'border-white/50'} overflow-hidden shadow-2xl bg-gray-800`}>
            <img src={AVATARS.ai} alt="IA" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap">
            IA
          </div>
          {currentPlayer === 'ai' && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-lg">
              <Trophy className="w-4 h-4 text-red-700" />
            </div>
          )}
        </div>
        <div className="flex -space-x-8">
          {aiHand.map((_, index) => (
            <div key={index} style={{ transform: `rotate(${(index - aiHand.length/2) * 3}deg)` }}>
              <PlayingCard isFaceDown className="w-14 h-20 md:w-16 md:h-24" />
            </div>
          ))}
        </div>
        <div className="mt-2 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full border border-yellow-400/50">
          {aiHand.length} cartes
        </div>
      </div>

      {/* ZONE CENTRALE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-8">
        <div className="flex flex-col items-center">
          <div className="relative">
            <PlayingCard card={topCard} className="w-28 h-40 md:w-32 md:h-44 shadow-2xl" />
            {pendingDraw > 0 && (
              <div className="absolute -top-3 -right-3 bg-red-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center border-2 border-white animate-bounce shadow-lg text-lg">
                +{pendingDraw}
              </div>
            )}
          </div>
          <span className="mt-2 text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">DÉFAUSSE</span>
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={() => isPlayerTurn && handleDrawCard()} 
            disabled={drawButtonDisabled}
            className="cursor-pointer disabled:cursor-not-allowed transition-transform hover:scale-110 active:scale-95"
          >
            <PlayingCard isFaceDown className="w-28 h-40 md:w-32 md:h-44 shadow-2xl" />
          </button>
          <span className="mt-2 text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">PIOCHE ({gameState.deck.length})</span>
        </div>
      </div>

      {/* BULLE DE MESSAGE */}
      <div className="absolute top-1/3 right-8 z-10 max-w-xs">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl rounded-br-none p-4 shadow-2xl border-2 border-yellow-400 relative">
          <MessageCircle className="absolute -top-2 -left-2 w-5 h-5 text-yellow-500 fill-yellow-500" />
          <p className="text-gray-800 font-semibold text-sm">
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" /> L'IA réfléchit...
              </span>
            ) : gameMessage}
          </p>
          {forcedSuit && (
            <p className="text-xs text-red-600 font-bold mt-2 bg-yellow-100 px-2 py-1 rounded">
              Couleur : {SUITS_FR[forcedSuit]}
            </p>
          )}
        </div>
      </div>

      {/* INDICATEUR DE PIOCHE AUTOMATIQUE */}
      {autoDrawMessage && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-8 py-4 rounded-full border-4 border-yellow-400 shadow-2xl animate-pulse text-lg">
          {autoDrawMessage}
        </div>
      )}

      {/* JOUEUR EN BAS */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-4">
        <div className="relative mb-2">
          <div className={`w-20 h-20 rounded-full border-4 ${isPlayerTurn ? 'border-yellow-400 animate-pulse' : 'border-white/50'} overflow-hidden shadow-2xl bg-gray-800`}>
            <img src={playerAvatar} alt={playerName} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap">
            {playerName}
          </div>
          {isPlayerTurn && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-lg animate-pulse">
              <Trophy className="w-4 h-4 text-red-700" />
            </div>
          )}
        </div>

        <div className="flex justify-center items-end -space-x-6 md:-space-x-8 px-4">
          {sortedPlayerHand.map((card, index) => (
            <div 
              key={card.id} 
              style={{ 
                transform: `rotate(${(index - sortedPlayerHand.length/2) * 4}deg) translateY(${Math.abs(index - sortedPlayerHand.length/2) * 2}px)`,
                zIndex: index
              }}
            >
              <PlayingCard 
                card={card} 
                isPlayable={isPlayable(card, topCard, forcedSuit, pendingDraw, jokerPendingDraw) && isPlayerTurn} 
                onPlay={handlePlayCard}
                className="w-16 h-24 md:w-20 md:h-28"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <Button 
            onClick={handleDrawCard} 
            disabled={drawButtonDisabled}
            className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-4 border-yellow-800 shadow-lg text-lg px-8 py-6"
          >
            {pendingDraw > 0 ? `Piocher ${pendingDraw}` : ' Piocher'}
          </Button>
          {canPlayerEndTurn && (
            <Button 
              onClick={handleEndTurn} 
              disabled={!isPlayerTurn}
              className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold border-b-4 border-blue-900 shadow-lg"
            >
              Passer le tour
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}