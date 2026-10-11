'use client';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GameState, GameCard, Suit, SUITS_FR, RANKS } from '@/lib/game-types';
import { PlayingCard } from './PlayingCard';
import { isPlayable } from '@/lib/game-logic';
import { handlePlayerAction } from '@/app/game/actions';
import { SuitChoiceDialog } from './SuitChoiceDialog';
import { GameOverDisplay } from './GameOverDisplay';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';

const rankOrder = [...RANKS, 'Joker'].reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {} as Record<string, number>);

export function GameBoard({ initialGameState }: { initialGameState: GameState }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (gameState.gameMessage?.includes("erreur") || gameState.gameMessage?.includes("problème")) {
      toast({ title: 'Avertissement de jeu', description: gameState.gameMessage, variant: 'destructive' });
    }
  }, [gameState.gameMessage, toast]);

  const onAction = (action: Parameters<typeof handlePlayerAction>[1]) => {
    startTransition(async () => {
      const newState = await handlePlayerAction(gameState, action);
      setGameState(newState);
    });
  };

  const handlePlayCard = (card: GameCard) => onAction({ type: 'PLAY_CARD', card });
  const handleDrawCard = () => onAction({ type: 'DRAW_CARD' });
  const handleEndTurn = () => onAction({ type: 'END_TURN' });
  const handleSuitChoice = (suit: Suit) => onAction({ type: 'SET_SUIT', suit });
  const handlePlayAgain = () => onAction({ type: 'NEW_GAME' });

  const { playerHand, aiHand, topCard, forcedSuit, currentPlayer, winner, isSuitPickerOpen, gameMessage, canPlayerEndTurn, pendingDraw } = gameState;
  const isPlayerTurn = currentPlayer === 'player' && !isPending && !winner;
  const sortedPlayerHand = [...playerHand].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank]);
  const canPlayerPlaySeven = playerHand.some(c => c.rank === '7');
  const drawButtonDisabled = !isPlayerTurn || canPlayerEndTurn || (pendingDraw > 0 && canPlayerPlaySeven);

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-between items-center p-4 overflow-hidden">
      {winner && <GameOverDisplay winner={winner} onPlayAgain={handlePlayAgain} />}
      <SuitChoiceDialog isOpen={isSuitPickerOpen} onSuitChoose={handleSuitChoice} />
      
      <div className="w-full flex-shrink-0 flex justify-center items-center h-40">
        <div className="flex -space-x-12 md:-space-x-16">
          {aiHand.map((_, index) => <PlayingCard key={index} isFaceDown />)}
        </div>
        {aiHand.length > 0 && <span className="ml-4 self-center text-lg font-bold bg-black/20 dark:bg-white/20 px-3 py-1 rounded-full">{aiHand.length}</span>}
      </div>

      <div className="flex-shrink-0 flex items-center justify-center gap-4 md:gap-8 my-4 py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative"><PlayingCard card={topCard} />{pendingDraw > 0 && <Badge variant="destructive" className="absolute -top-3 -right-3 text-lg rounded-full h-8 w-8 flex items-center justify-center animate-bounce">+{pendingDraw}</Badge>}</div>
          <span className="text-sm font-semibold">Défausse</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => isPlayerTurn && handleDrawCard()} disabled={drawButtonDisabled} className="cursor-pointer disabled:cursor-not-allowed"><PlayingCard isFaceDown /></button>
          <span className="text-sm font-semibold">Pioche ({gameState.deck.length})</span>
        </div>
        <div className="w-48 text-center p-4 rounded-lg bg-background/80 shadow-md border-2 border-primary/20 backdrop-blur-sm">
          {isPending && <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-primary" />}
          <p className="font-semibold text-base min-h-[48px]">{isPending ? "Traitement..." : gameMessage}</p>
          {forcedSuit && <p className="text-sm text-muted-foreground font-bold">Imposé : {SUITS_FR[forcedSuit]}</p>}
        </div>
      </div>

      <div className="flex-grow w-full flex flex-col justify-end items-center">
        <div className="flex justify-center items-end flex-wrap gap-2 max-w-5xl p-4 min-h-[150px] md:min-h-[170px]">
          {sortedPlayerHand.map((card) => (
            <PlayingCard key={card.id} card={card} isPlayable={isPlayable(card, topCard, forcedSuit, pendingDraw) && isPlayerTurn} onPlay={handlePlayCard} />
          ))}
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={handleDrawCard} disabled={drawButtonDisabled}>{pendingDraw > 0 ? `Piocher ${pendingDraw} cartes` : 'Piocher une carte'}</Button>
          {canPlayerEndTurn && <Button onClick={handleEndTurn} disabled={!isPlayerTurn} variant="secondary">Terminer le tour</Button>}
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">Quitter</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr de vouloir quitter ?</AlertDialogTitle><AlertDialogDescription>La partie en cours sera perdue.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Non</AlertDialogCancel><AlertDialogAction asChild><Link href="/menu">Oui</Link></AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
