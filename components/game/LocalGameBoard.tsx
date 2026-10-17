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
    <div className="relative h-screen w-screen flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0a5c36_0%,_#064e2b_50%,_#032e1a_100%)]">
      {/* Texture du tapis */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`,
      }}></div>
      
      {/* Bordure dorée de la table */}
      <div className="absolute inset-2 md:inset-4 border-4 md:border-8 border-amber-900/40 rounded-2xl md:rounded-[3rem] pointer-events-none shadow-2xl"></div>
      <div className="absolute inset-3 md:inset-6 border border-amber-700/30 md:border-2 rounded-xl md:rounded-[2.8rem] pointer-events-none"></div>

      {winner && <GameOverDisplay winner={{name: winner.name}} onPlayAgain={handlePlayAgain} />}
      <SuitChoiceDialog isOpen={isSuitPickerOpen} onSuitChoose={handleSuitChoice} />
      <PassTurnDialog isOpen={isPassingTurn && !winner} onPassTurn={handlePassTurn} nextPlayerName={players[(currentPlayerIndex + 1) % players.length].name} />
      
      {/*  ZONE HAUTE : Adversaires (compacte sur mobile) */}
      <div className="relative z-10 flex-shrink-0 px-2 py-2 md:py-4">
        <div className="flex justify-around items-center gap-2">
          {players.map((player, index) => {
            if (index === currentPlayerIndex) return null;
            return (
              <div key={player.id} className="flex flex-col items-center gap-1">
                <div className="flex -space-x-2 md:-space-x-4 overflow-hidden">
                  {player.hand.slice(0, 7).map((_, cardIndex) => (
                    <PlayingCard 
                      key={cardIndex} 
                      isFaceDown 
                      className="w-8 h-12 md:w-14 md:h-20" 
                    />
                  ))}
                  {player.hand.length > 7 && (
                    <div className="w-8 h-12 md:w-14 md:h-20 flex items-center justify-center bg-amber-700 rounded text-white text-xs font-bold">
                      +{player.hand.length - 7}
                    </div>
                  )}
                </div>
                <Badge className="text-[10px] md:text-sm bg-amber-600 hover:bg-amber-700 border border-amber-800 px-2 py-0.5">
                  {player.name} ({player.hand.length})
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎯 ZONE CENTRALE : Défausse + Pioche + Message (compacte sur mobile) */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-2 min-h-0">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 w-full">
          
          {/* Carte défaussée + Pioche côte à côte */}
          <div className="flex items-center justify-center gap-3 md:gap-6 flex-shrink-0">
            {/* Défausse */}
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <div className="relative">
                <PlayingCard 
                  card={topCard} 
                  className="w-16 h-24 md:w-24 md:h-32" 
                />
                {pendingDraw > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs md:text-lg rounded-full h-5 w-5 md:h-8 md:w-8 flex items-center justify-center animate-bounce shadow-lg">
                    +{pendingDraw}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] md:text-sm font-bold text-amber-100 bg-green-900/60 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-amber-700/40 whitespace-nowrap">
                Défausse
              </span>
            </div>

            {/* Pioche */}
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <button 
                onClick={() => isPlayerTurn && handleDrawCard()} 
                disabled={drawButtonDisabled} 
                className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95 shadow-xl"
              >
                <PlayingCard 
                  isFaceDown 
                  className="w-16 h-24 md:w-24 md:h-32" 
                />
              </button>
              <span className="text-[10px] md:text-sm font-bold text-amber-100 bg-green-900/60 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-amber-700/40 whitespace-nowrap">
                Pioche ({gameState.deck.length})
              </span>
            </div>
          </div>

          {/* Message de jeu (compact sur mobile) */}
          <div className="w-full md:w-56 text-center p-2 md:p-5 rounded-lg md:rounded-xl bg-gradient-to-br from-green-900/80 to-green-950/90 shadow-2xl border border-amber-700/50 md:border-2 backdrop-blur-sm flex-shrink-0">
            {isPending && <Loader2 className="animate-spin h-4 w-4 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 text-amber-400" />}
            <p className="font-bold text-xs md:text-base min-h-[24px] md:min-h-[48px] text-amber-50 flex items-center justify-center leading-tight px-2">
              {isPending ? "Traitement..." : gameMessage}
            </p>
            {forcedSuit && (
              <p className="text-[10px] md:text-sm text-amber-300 font-bold mt-1 md:mt-2 bg-green-950/60 px-2 py-0.5 md:py-1 rounded">
                Couleur : {SUITS_FR[forcedSuit]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🎯 ZONE BASSE : Main du joueur (SCROLL HORIZONTAL sur mobile) */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center pb-2 md:pb-4 px-2">
        {/* Nom du joueur */}
        <div className="mb-1 md:mb-2">
          <Badge variant="secondary" className="text-xs md:text-lg flex items-center gap-1 md:gap-2 bg-amber-600 text-white border border-amber-800 md:border-2 px-2 md:px-4 py-1 md:py-2">
            <User className="w-3 h-3 md:w-4 md:h-4" /> {currentPlayer.name}
          </Badge>
        </div>

        {/* Main du joueur avec SCROLL HORIZONTAL */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-green-900/30">
          <div className="flex justify-start md:justify-center items-end gap-1 md:gap-2 px-2 min-w-max mx-auto">
            {sortedPlayerHand.map((card) => (
              <PlayingCard 
                key={card.id} 
                card={card} 
                isPlayable={isPlayable(card, topCard, forcedSuit, pendingDraw) && isPlayerTurn} 
                onPlay={handlePlayCard}
                className="w-14 h-20 md:w-20 md:h-28 flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
          <Button 
            onClick={handleDrawCard} 
            disabled={drawButtonDisabled}
            size="sm"
            className="bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold border-b-2 md:border-b-4 border-amber-900 shadow-lg text-xs md:text-base px-3 md:px-6 py-2 md:py-3"
          >
            {pendingDraw > 0 ? `Piocher ${pendingDraw}` : 'Piocher'}
          </Button>
          
          {canPlayerEndTurn && (
            <Button 
              onClick={handleEndTurn} 
              disabled={!isPlayerTurn} 
              variant="secondary"
              size="sm"
              className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold border-b-2 md:border-b-4 border-blue-900 shadow-lg text-xs md:text-base px-3 md:px-6 py-2 md:py-3"
            >
              Terminer
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                size="sm"
                className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold border-b-2 md:border-b-4 border-red-900 shadow-lg text-xs md:text-base px-3 md:px-6 py-2 md:py-3"
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