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
import { Loader2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useSound } from '@/hooks/useSound';
import { calculateXpReward, getLevelInfo } from '@/lib/level-system';

const rankOrder = [...RANKS, 'Joker'].reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {} as Record<string, number>);
const AVATARS = { ai: 'https://i.pravatar.cc/150?img=32' };

export function GameBoard({ initialGameState }: { initialGameState: GameState }) {
  const { profile, userId } = useAuth();
  const { playCard, playVictory, playDefeat } = useSound();
  const playerName = profile?.pseudo || 'TOI';
  const playerAvatar = profile?.avatar_url || 'https://i.pravatar.cc/150?img=12';

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isPending, startTransition] = useTransition();
  const [gameTime, setGameTime] = useState(0);
  const [autoDrawMessage, setAutoDrawMessage] = useState<string | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const { toast } = useToast();

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  // ✅ Remet scoreSaved à false quand une nouvelle partie commence
  useEffect(() => {
    if (!gameState.winner && scoreSaved) {
      setScoreSaved(false);
    }
  }, [gameState.winner, scoreSaved]);
  useEffect(() => { const timer = setInterval(() => setGameTime(t => t + 1), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (gameState.gameMessage?.includes("erreur") || gameState.gameMessage?.includes("problème")) {
      toast({ title: 'Avertissement', description: gameState.gameMessage, variant: 'destructive' });
    }
  }, [gameState.gameMessage, toast]);

  useEffect(() => {
    if (gameState.winner && profile && userId && !scoreSaved) {
      const saveScoreAndXp = async () => {
        const isWin = gameState.winner === 'player';
        const result = isWin ? 'win' : 'loss';
        const cardsRemaining = isWin ? 0 : gameState.playerHand.length;
        const difficulty = gameState.difficulty || 'medium';
        
        const { error: scoreError } = await supabase.from('scores').insert({ 
          user_id: userId, 
          pseudo: profile.pseudo, 
          difficulty, 
          result, 
          cards_remaining: cardsRemaining 
        });
        
        if (scoreError) {
          toast({ title: 'Erreur', description: 'Impossible de sauvegarder le score.', variant: 'destructive' });
        } else {
          const xpReward = calculateXpReward(isWin, difficulty);
          const newTotalXp = Math.max(0, (profile.xp || 0) + xpReward);
          const newLevel = getLevelInfo(newTotalXp).level;
          
          await supabase.from('profiles').update({ xp: newTotalXp, level: newLevel }).eq('id', userId);
          
          const { data: leaderboardData } = await supabase.from('leaderboard').select('wins, total_games').eq('id', userId).single();
          
          let newlyUnlocked: string[] = [];
          try {
            const achievementsModule = await import('@/lib/achievements');
            if (achievementsModule.checkAndUnlockAchievements) {
              newlyUnlocked = await achievementsModule.checkAndUnlockAchievements(userId, {
                wins: isWin ? (leaderboardData?.wins || 0) + 1 : (leaderboardData?.wins || 0),
                totalGames: (leaderboardData?.total_games || 0) + 1,
                level: newLevel, 
                totalXp: newTotalXp, 
                wonOnHard: isWin && difficulty === 'hard',
              });
            }
          } catch (e) {
            console.log('Système de succès non disponible:', e);
          }

          setScoreSaved(true);
          isWin ? playVictory() : playDefeat();
          
          if (newlyUnlocked && newlyUnlocked.length > 0) {
            toast({ title: '🏆 Succès débloqué !', description: `Tu as débloqué ${newlyUnlocked.length} nouveau(x) succès !` });
          }
        }
      };
      saveScoreAndXp();
    }
  }, [gameState.winner, profile, userId, scoreSaved, gameState.playerHand.length, gameState.difficulty, toast, playVictory, playDefeat, gameKey]);

  useEffect(() => {
    const { currentPlayer, winner, jokerPendingDraw, pendingDraw, playerHand } = gameState;
    if (currentPlayer !== 'player' || winner || isPending) { setAutoDrawMessage(null); return; }
    if (jokerPendingDraw && pendingDraw > 0) {
      setAutoDrawMessage(`Pioche auto: ${pendingDraw} cartes (Joker)`);
      const timeout = setTimeout(() => {
        const currentState = gameStateRef.current;
        if (currentState.jokerPendingDraw && currentState.pendingDraw > 0 && currentState.currentPlayer === 'player') {
          startTransition(async () => {
            const newState = await handlePlayerAction(currentState, { type: 'DRAW_CARD' });
            setGameState(newState); setAutoDrawMessage(null);
          });
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
    if (pendingDraw > 0 && !jokerPendingDraw) {
      const hasSeven = playerHand.some(c => c.rank === '7');
      if (!hasSeven) {
        setAutoDrawMessage(`Pioche auto: ${pendingDraw} cartes (7 cumulés)`);
        const timeout = setTimeout(() => {
          const currentState = gameStateRef.current;
          if (currentState.pendingDraw > 0 && !currentState.jokerPendingDraw && currentState.currentPlayer === 'player') {
            if (!currentState.playerHand.some(c => c.rank === '7')) {
              startTransition(async () => {
                const newState = await handlePlayerAction(currentState, { type: 'DRAW_CARD' });
                setGameState(newState); setAutoDrawMessage(null);
              });
            }
          }
        }, 1500);
        return () => clearTimeout(timeout);
      } else { setAutoDrawMessage(null); }
    } else { setAutoDrawMessage(null); }
  }, [gameState.currentPlayer, gameState.winner, gameState.jokerPendingDraw, gameState.pendingDraw, gameState.playerHand, isPending]);

  const onAction = (action: Parameters<typeof handlePlayerAction>[1]) => {
    startTransition(async () => {
      const newState = await handlePlayerAction(gameState, action);
      setGameState(newState);
      if (action.type === 'NEW_GAME') setScoreSaved(false);
    });
  };

  const handlePlayCard = (card: GameCard) => { playCard(); onAction({ type: 'PLAY_CARD', card }); };
  const handleDrawCard = () => { playCard(); onAction({ type: 'DRAW_CARD' }); };
  const handleEndTurn = () => onAction({ type: 'END_TURN' });
  const handleSuitChoice = (suit: Suit) => onAction({ type: 'SET_SUIT', suit });
  const handlePlayAgain = () => {
    setGameKey(k => k + 1);
    onAction({ type: 'NEW_GAME' });
  };

  const { playerHand, aiHand, topCard, forcedSuit, currentPlayer, winner, isSuitPickerOpen, gameMessage, canPlayerEndTurn, pendingDraw, jokerPendingDraw } = gameState;
  const isPlayerTurn = currentPlayer === 'player' && !isPending && !winner;
  const sortedPlayerHand = [...playerHand].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);
  const canPlayerPlaySeven = playerHand.some(c => c.rank === '7');
  const mustAutoDraw = (jokerPendingDraw && pendingDraw > 0) || (pendingDraw > 0 && !jokerPendingDraw && !canPlayerPlaySeven);
  const drawButtonDisabled = !isPlayerTurn || canPlayerEndTurn || mustAutoDraw;
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const getInstructionMessage = () => {
    if (winner) return null;
    if (autoDrawMessage) return ` ${autoDrawMessage}`;
    if (jokerPendingDraw && pendingDraw > 0) return `️ Pioche ${pendingDraw} cartes (Joker)`;
    if (pendingDraw > 0) {
      if (canPlayerPlaySeven) return `⚠️ Joue un 7 ou pioche ${pendingDraw} cartes`;
      return `️ Pioche ${pendingDraw} cartes automatiquement`;
    }
    if (forcedSuit) return ` Joue une carte de ${SUITS_FR[forcedSuit]}`;
    if (isPending) return `⏳ L'IA réfléchit...`;
    if (isPlayerTurn) return `▶️ À ton tour ! Joue une carte ou pioche`;
    return null;
  };

  const instructionMessage = getInstructionMessage();

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-1 md:inset-4 border-2 md:border-8 border-yellow-400/60 rounded-2xl md:rounded-3xl pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,215,0,0.05) 20px, rgba(255,215,0,0.05) 40px)` }}></div>

      {winner && <GameOverDisplay winner={winner} onPlayAgain={handlePlayAgain} difficulty={gameState.difficulty || 'medium'} userId={userId ?? undefined} currentStats={{ wins: 0, totalGames: 0, xp: profile?.xp || 0, level: profile?.level || 1 }} />}
      <SuitChoiceDialog isOpen={isSuitPickerOpen} onSuitChoose={handleSuitChoice} playerHand={playerHand} />

      {/*  ZONE 1 : Timer et bouton Quitter (en haut) */}
      <div className="relative z-20 flex-shrink-0 flex justify-between items-center p-2 md:p-4">
        <div className="bg-black/60 backdrop-blur-sm text-yellow-400 font-bold text-sm md:text-xl px-2 md:px-4 py-1 md:py-2 rounded-lg border border-yellow-400/50 shadow-lg">
          ⏱️ {formatTime(gameTime)}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 border-b-2 md:border-b-4 border-red-900 font-bold shadow-lg text-xs md:text-base px-2 md:px-4 py-1 md:py-2">
              Quitter
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Quitter la partie ?</AlertDialogTitle><AlertDialogDescription>La partie en cours sera perdue.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Non</AlertDialogCancel><AlertDialogAction asChild><Link href="/menu">Oui</Link></AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/*  ZONE 2 : IA (adversaire en haut) */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center px-2 py-1 md:py-2">
        <div className="relative mb-1">
          <div className={`w-12 h-12 md:w-20 md:h-20 rounded-full border-2 md:border-4 ${currentPlayer === 'ai' ? 'border-yellow-400 animate-pulse' : 'border-white/50'} overflow-hidden shadow-2xl bg-gray-800`}>
            <img src={AVATARS.ai} alt="IA" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white shadow-lg whitespace-nowrap">IA</div>
          {currentPlayer === 'ai' && <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 md:p-1 shadow-lg"><Trophy className="w-3 h-3 md:w-4 md:h-4 text-red-700" /></div>}
        </div>
        <div className="flex -space-x-4 md:-space-x-8 overflow-hidden">
          {aiHand.slice(0, 8).map((_, index) => (
            <div key={index} style={{ transform: `rotate(${(index - Math.min(aiHand.length, 8)/2) * 3}deg)` }}>
              <PlayingCard isFaceDown className="w-9 h-12 md:w-16 md:h-24" />
            </div>
          ))}
        </div>
        <div className="mt-1 bg-black/60 text-white text-[10px] md:text-sm font-bold px-2 md:px-3 py-0.5 rounded-full border border-yellow-400/50">
          {aiHand.length} cartes
        </div>
      </div>

      {/*  ZONE 3 : Défausse + Pioche (centre) */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-2 min-h-0">
        <div className="flex items-center justify-center gap-2 md:gap-8">
          {/* Défausse */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <PlayingCard card={topCard} className="w-16 h-24 md:w-32 md:h-44 shadow-2xl" />
              {pendingDraw > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white font-bold rounded-full w-6 h-6 md:w-10 md:h-10 flex items-center justify-center border border-white animate-bounce shadow-lg text-xs md:text-lg">
                  +{pendingDraw}
                </div>
              )}
            </div>
            <span className="mt-1 text-white text-[9px] md:text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full">DÉFAUSSE</span>
          </div>

          {/* Pioche */}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => isPlayerTurn && handleDrawCard()} 
              disabled={drawButtonDisabled} 
              className="cursor-pointer disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
            >
              <PlayingCard isFaceDown className="w-16 h-24 md:w-32 md:h-44 shadow-2xl" />
            </button>
            <span className="mt-1 text-white text-[9px] md:text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full">
              PIOCHE ({gameState.deck.length})
            </span>
          </div>
        </div>
      </div>

      {/*  ZONE 4 : Avatar joueur + Message (entre défausse et cartes) */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center px-2 py-1">
        <div className="flex items-center gap-2 mb-1 w-full max-w-md justify-center">
          <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full border-2 md:border-4 ${isPlayerTurn ? 'border-yellow-400 animate-pulse' : 'border-white/50'} overflow-hidden shadow-2xl bg-gray-800 flex-shrink-0`}>
            <img src={playerAvatar} alt={playerName} className="w-full h-full object-cover" />
          </div>
          <div className="bg-blue-600 text-white text-xs md:text-base font-bold px-3 md:px-4 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap">
            {playerName}
          </div>
          {isPlayerTurn && <div className="bg-yellow-400 rounded-full p-0.5 md:p-1 shadow-lg"><Trophy className="w-3 h-3 md:w-5 md:h-5 text-red-700" /></div>}
        </div>

        {instructionMessage && (
          <div className="w-full max-w-md bg-gray-700/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-500 shadow-lg">
            <p className="text-white text-[10px] md:text-sm font-bold text-center">
              {instructionMessage}
            </p>
          </div>
        )}
      </div>

      {/*  ZONE 5 : Main du joueur (en bas, avec scroll) */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center pb-2 px-2">
        <div className="w-full overflow-x-auto pb-2">
          <div className="flex justify-start items-end gap-1 px-1 min-w-max">
            {sortedPlayerHand.map((card) => {
              const playable = isPlayable(card, topCard, forcedSuit, pendingDraw, jokerPendingDraw) && isPlayerTurn;
              return (
                <div key={card.id} className="flex-shrink-0">
                  <PlayingCard 
                    card={card} 
                    isPlayable={playable} 
                    onPlay={handlePlayCard} 
                    className="w-11 h-16 md:w-20 md:h-28" 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          <Button 
            onClick={handleDrawCard} 
            disabled={drawButtonDisabled} 
            size="sm"
            className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-2 md:border-b-4 border-yellow-800 shadow-lg text-xs md:text-lg px-3 md:px-8 py-1 md:py-3"
          >
            {pendingDraw > 0 ? `Piocher ${pendingDraw}` : 'Piocher'}
          </Button>
          {canPlayerEndTurn && (
            <Button 
              onClick={handleEndTurn} 
              disabled={!isPlayerTurn} 
              size="sm"
              className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold border-b-2 md:border-b-4 border-blue-900 shadow-lg text-xs md:text-base px-3 md:px-6 py-1 md:py-2"
            >
              Passer le tour
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}