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
    <div className="relative min-h-screen flex flex-col items-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0a5c36_0%,_#064e2b_50%,_#032e1a_100%)]">
      {/* Texture du tapis */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`,
      }}></div>
      
      {/* Bordure dorée de la table */}
      <div className="absolute inset-4 border-8 border-amber-900/40 rounded-[3rem] pointer-events-none shadow-2xl"></div>
      <div className="absolute inset-6 border-2 border-amber-700/30 rounded-[2.8rem] pointer-events-none"></div>

      {winner && <GameOverDisplay winner={{name: winner.name}} onPlayAgain={handlePlayAgain} />}
      <SuitChoiceDialog isOpen={isSuitPickerOpen} onSuitChoose={handleSuitChoice} />
      <PassTurnDialog isOpen={isPassingTurn && !winner} onPassTurn={handlePassTurn} nextPlayerName={players[(currentPlayerIndex + 1) % players.length].name} />
      
      {/* Autres joueurs - zone haute */}
      <div className="relative z-10 w-full flex-shrink-0 flex justify-around items-center py-4">
        {players.map((player, index) => {
          if (index === currentPlayerIndex) return null;
          return (
            <div key={player.id} className="flex flex-col items-center gap-2">
              <div className="flex -space-x-4">{player.hand.map((_, cardIndex) => <PlayingCard key={cardIndex} isFaceDown />)}</div>
              <Badge className="bg-amber-600 hover:bg-amber-700 border-2 border-amber-800">{player.name} ({player.hand.length})</Badge>
            </div>
          )
        })}
      </div>

      {/* Zone centrale - prend tout l'espace disponible et centre son contenu */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <div className="flex items-center justify-center gap-6 md:gap-10">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <PlayingCard card={topCard} />
              {pendingDraw > 0 && (
                <Badge variant="destructive" className="absolute -top-3 -right-3 text-lg rounded-full h-8 w-8 flex items-center justify-center animate-bounce shadow-lg">
                  +{pendingDraw}
                </Badge>
              )}
            </div>
            <span className="text-sm font-bold text-amber-100 bg-green-900/60 px-3 py-1 rounded-full border border-amber-700/40">Défausse</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => isPlayerTurn && handleDrawCard()} 
              disabled={drawButtonDisabled} 
              className="cursor-pointer disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95 shadow-xl"
            >
              <PlayingCard isFaceDown />
            </button>
            <span className="text-sm font-bold text-amber-100 bg-green-900/60 px-3 py-1 rounded-full border border-amber-700/40">Pioche ({gameState.deck.length})</span>
          </div>
          <div className="w-56 text-center p-5 rounded-xl bg-gradient-to-br from-green-900/80 to-green-950/90 shadow-2xl border-2 border-amber-700/50 backdrop-blur-sm">
            {isPending && <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-amber-400" />}
            <p className="font-bold text-base min-h-[48px] text-amber-50 flex items-center justify-center">
              {isPending ? "Traitement..." : gameMessage}
            </p>
            {forcedSuit && (
              <p className="text-sm text-amber-300 font-bold mt-2 bg-green-950/60 px-2 py-1 rounded">
                Couleur imposée : {SUITS_FR[forcedSuit]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main du joueur - zone basse */}
      <div className="relative z-10 w-full flex-shrink-0 flex flex-col items-center pb-4">
        <div className="mb-3">
          <Badge variant="secondary" className="text-lg flex items-center gap-2 bg-amber-600 text-white border-2 border-amber-800 px-4 py-2">
            <User /> {currentPlayer.name}
          </Badge>
        </div>
        <div className="flex justify-center items-end flex-wrap gap-2 max-w-5xl p-4 min-h-[150px] md:min-h-[170px]">
          {sortedPlayerHand.map((card) => (
            <PlayingCard 
              key={card.id} 
              card={card} 
              isPlayable={isPlayable(card, topCard, forcedSuit, pendingDraw) && isPlayerTurn} 
              onPlay={handlePlayCard} 
            />
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <Button 
            onClick={handleDrawCard} 
            disabled={drawButtonDisabled}
            className="bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold border-b-4 border-amber-900 shadow-lg"
          >
            {pendingDraw > 0 ? `Piocher ${pendingDraw} cartes` : 'Piocher une carte'}
          </Button>
          {canPlayerEndTurn && (
            <Button 
              onClick={handleEndTurn} 
              disabled={!isPlayerTurn} 
              variant="secondary"
              className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold border-b-4 border-blue-900 shadow-lg"
            >
              Terminer le tour
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold border-b-4 border-red-900 shadow-lg"
              >
                Quitter
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir quitter ?</AlertDialogTitle>
                <AlertDialogDescription>La partie en cours sera perdue.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Non</AlertDialogCancel>
                <AlertDialogAction asChild><Link href="/menu">Oui</Link></AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}