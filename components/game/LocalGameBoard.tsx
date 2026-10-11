'use client';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LocalGameState, GameCard, Suit, SUITS_FR } from '@/lib/game-types';
import { PlayingCard } from './PlayingCard';
import { isPlayable, getLocalWinner, replenishLocalDeckFromDiscard, drawCards } from '@/lib/game-logic';
import { SuitChoiceDialog } from './SuitChoiceDialog';
import { GameOverDisplay } from './GameOverDisplay';
import { PassTurnDialog } from './PassTurnDialog';
import { Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';

export function LocalGameBoard({ initialGameState }: { initialGameState: LocalGameState }) {
  const [gameState, setGameState] = useState<LocalGameState>(initialGameState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { players, topCard, forcedSuit, currentPlayerIndex, winner, isSuitPickerOpen, gameMessage, canPlayerEndTurn, pendingDraw, isPassingTurn } = gameState;
  const currentPlayer = players[currentPlayerIndex];

  useEffect(() => {
    if (gameMessage?.includes("erreur") || gameMessage?.includes("problème")) {
      toast({ title: 'Avertissement de jeu', description: gameMessage, variant: 'destructive' });
    }
  }, [gameMessage, toast]);

  const onAction = (action: any) => {
    startTransition(() => {
      setGameState(prevState => {
        let newState = { ...prevState };
        switch (action.type) {
          case 'NEW_GAME': return initialGameState;
          case 'PLAY_CARD': {
            const cardIndex = currentPlayer.hand.findIndex(c => c.id === action.card.id);
            if (cardIndex === -1) return newState;
            const playedCard = currentPlayer.hand[cardIndex];
            newState.players[currentPlayerIndex].hand.splice(cardIndex, 1);
            newState.discardPile.unshift(playedCard);
            newState.topCard = playedCard;
            newState.forcedSuit = null;
            const gameWinner = getLocalWinner(newState);
            if (gameWinner) { newState.winner = gameWinner; newState.gameMessage = `${gameWinner.name} a gagné !`; return newState; }
            if (playedCard.isJoker || playedCard.rank === 'Jack') { newState.isSuitPickerOpen = true; newState.gameMessage = `${currentPlayer.name}, choisissez une couleur.`; return newState; }
            if (playedCard.rank === '10') { newState.gameMessage = `${currentPlayer.name} a joué un 10. Rejouez !`; newState.canPlayerEndTurn = true; newState.pendingDraw = 0; return newState; }
            if (playedCard.rank === '7') { newState.pendingDraw = (newState.pendingDraw || 0) + 2; } else { newState.pendingDraw = 0; }
            newState.isPassingTurn = true;
            return newState;
          }
          case 'DRAW_CARD': {
            let cardsToDraw = (newState.pendingDraw > 0) ? newState.pendingDraw : 1;
            if (newState.deck.length < cardsToDraw) newState = replenishLocalDeckFromDiscard(newState);
            if (newState.deck.length === 0) { newState.gameMessage = "La pioche est vide !"; newState.isPassingTurn = true; return newState; }
            cardsToDraw = Math.min(cardsToDraw, newState.deck.length);
            const { drawnCards, remainingDeck } = drawCards(newState.deck, cardsToDraw);
            newState.players[currentPlayerIndex].hand.push(...drawnCards);
            newState.deck = remainingDeck;
            if (newState.pendingDraw > 0) { newState.gameMessage = `${currentPlayer.name} a pioché ${cardsToDraw} cartes. À vous de jouer.`; newState.pendingDraw = 0; return newState; }
            newState.isPassingTurn = true;
            return newState;
          }
          case 'SET_SUIT': {
            newState.forcedSuit = action.suit;
            newState.isSuitPickerOpen = false;
            const lastPlayedCard = newState.discardPile[0];
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            const nextPlayer = players[nextPlayerIndex];
            if (lastPlayedCard.isJoker) {
              let cardsToDraw = 5;
              if (newState.deck.length < cardsToDraw) { newState = replenishLocalDeckFromDiscard(newState); cardsToDraw = Math.min(cardsToDraw, newState.deck.length); }
              const { drawnCards, remainingDeck } = drawCards(newState.deck, cardsToDraw);
              newState.players[nextPlayerIndex].hand.push(...drawnCards);
              newState.deck = remainingDeck;
              newState.gameMessage = `Vous avez choisi ${SUITS_FR[action.suit]}. ${nextPlayer.name} pioche ${cardsToDraw} cartes.`;
            } else { newState.gameMessage = `Vous avez choisi ${SUITS_FR[action.suit]}.`; }
            newState.isPassingTurn = true;
            return newState;
          }
          case 'PASS_TURN': {
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            newState.currentPlayerIndex = nextPlayerIndex;
            newState.gameMessage = `C'est au tour de ${players[nextPlayerIndex].name}.`;
            newState.isPassingTurn = false;
            newState.canPlayerEndTurn = false;
            return newState;
          }
          default: return newState;
        }
      });
    });
  };

  const handlePlayCard = (card: GameCard) => onAction({ type: 'PLAY_CARD', card });
  const handleDrawCard = () => onAction({ type: 'DRAW_CARD' });
  const handleSuitChoice = (suit: Suit) => onAction({ type: 'SET_SUIT', suit });
  const handlePlayAgain = () => onAction({ type: 'NEW_GAME' });
  const handlePassTurn = () => onAction({ type: 'PASS_TURN' });
  const handleEndTurn = () => onAction({ type: 'PASS_TURN' });

  const isPlayerTurn = !isPending && !winner;
  const canPlayerPlaySeven = currentPlayer.hand.some(c => c.rank === '7');
  const drawButtonDisabled = !isPlayerTurn || canPlayerEndTurn || (pendingDraw > 0 && canPlayerPlaySeven);
  const sortedPlayerHand = [...currentPlayer.hand].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-between items-center p-4 overflow-hidden">
      {winner && <GameOverDisplay winner={{name: winner.name}} onPlayAgain={handlePlayAgain} />}
      <SuitChoiceDialog isOpen={isSuitPickerOpen} onSuitChoose={handleSuitChoice} />
      <PassTurnDialog isOpen={isPassingTurn && !winner} onPassTurn={handlePassTurn} nextPlayerName={players[(currentPlayerIndex + 1) % players.length].name} />
      
      <div className="w-full flex-shrink-0 flex justify-around items-center h-40">
        {players.map((player, index) => {
          if (index === currentPlayerIndex) return null;
          return (
            <div key={player.id} className="flex flex-col items-center gap-2">
              <div className="flex -space-x-4">{player.hand.map((_, cardIndex) => <PlayingCard key={cardIndex} isFaceDown />)}</div>
              <Badge>{player.name} ({player.hand.length})</Badge>
            </div>
          )
        })}
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
        <div className="mb-2"><Badge variant="secondary" className="text-lg flex items-center gap-2"><User /> {currentPlayer.name}</Badge></div>
        <div className="flex justify-center items-end flex-wrap gap-2 max-w-5xl p-4 min-h-[150px] md:min-h-[170px] bg-primary/10 rounded-lg">
          {sortedPlayerHand.map((card) => <PlayingCard key={card.id} card={card} isPlayable={isPlayable(card, topCard, forcedSuit, pendingDraw) && isPlayerTurn} onPlay={handlePlayCard} />)}
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
