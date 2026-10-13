'use server';

import { GameCard, GameState, Suit, SUITS_FR } from '@/lib/game-types';
import { createInitialGameState, drawCards, getWinner, replenishDeckFromDiscard, isPlayable } from '@/lib/game-logic';
import { getAiMove } from '@/lib/ai-logic';

type PlayerAction =
  | { type: 'PLAY_CARD'; card: GameCard }
  | { type: 'DRAW_CARD' }
  | { type: 'SET_SUIT'; suit: Suit }
  | { type: 'END_TURN' }
  | { type: 'NEW_GAME'; difficulty?: 'easy' | 'medium' | 'hard' };

export async function handlePlayerAction(
  currentState: GameState,
  action: PlayerAction
): Promise<GameState> {
  let newState: GameState = JSON.parse(JSON.stringify(currentState));
  newState.canPlayerEndTurn = false;

  if (action.type === 'NEW_GAME') {
    return createInitialGameState(action.difficulty || currentState.difficulty);
  }

  if (newState.winner) return newState;

  switch (action.type) {
    case 'PLAY_CARD': {
      const cardIndex = newState.playerHand.findIndex(c => c.id === action.card.id);
      if (cardIndex > -1) {
        const [playedCard] = newState.playerHand.splice(cardIndex, 1);
        newState.discardPile.unshift(playedCard);
        newState.topCard = playedCard;
        newState.winner = getWinner(newState);
        newState.extraTurn = false;

        if (newState.winner) {
          newState.gameMessage = "Bravo ! Vous avez gagné !";
          return newState;
        }

        newState.forcedSuit = null;

        // JOKER : 5 cartes OBLIGATOIRES, pas de contre possible
        if (playedCard.isJoker) {
          newState.isSuitPickerOpen = true;
          newState.gameMessage = 'Joker ! Choisissez une couleur. L\'IA devra piocher 5 cartes.';
          newState.currentPlayer = 'player';
          return newState;
        }

        // VALET : changement de couleur
        if (playedCard.rank === 'Jack') {
          newState.isSuitPickerOpen = true;
          newState.gameMessage = 'Choisissez une couleur.';
          newState.currentPlayer = 'player';
          return newState;
        }

        // 10 : on rejoue
        if (playedCard.rank === '10') {
          newState.gameMessage = "Vous avez joué un 10. Rejouez !";
          newState.currentPlayer = 'player';
          newState.canPlayerEndTurn = true;
          newState.extraTurn = true;
          return newState;
        }

        // 7 : cumule avec les 7 précédents (mais PAS avec un Joker)
        if (playedCard.rank === '7') {
          // Si le pendingDraw précédent venait d'un 7, on additionne
          // Si c'était un Joker, on repart à 0 et on commence un nouveau compteur
          if (newState.jokerPendingDraw) {
            newState.pendingDraw = 2; // Nouveau compteur après un Joker
            newState.jokerPendingDraw = false;
          } else {
            newState.pendingDraw = (newState.pendingDraw || 0) + 2; // Cumul des 7
          }
          newState.currentPlayer = 'ai';
          newState.gameMessage = `7 ! L'IA doit piocher ${newState.pendingDraw} ou répondre avec un 7.`;
          return runAiTurn(newState);
        }

        // Carte normale : on réinitialise tout
        newState.pendingDraw = 0;
        newState.jokerPendingDraw = false;
        newState.currentPlayer = 'ai';
        return runAiTurn(newState);
      }
      break;
    }

    case 'DRAW_CARD': {
      newState.extraTurn = false;

      // Si on doit piocher à cause d'un Joker, on pioche OBLIGATOIREMENT les 5 cartes
      if (newState.jokerPendingDraw) {
        let cardsToDraw = newState.pendingDraw; // 5 cartes
        if (newState.deck.length < cardsToDraw) {
          newState = replenishDeckFromDiscard(newState);
        }
        cardsToDraw = Math.min(cardsToDraw, newState.deck.length);

        if (cardsToDraw > 0) {
          const { drawnCards, remainingDeck } = drawCards(newState.deck, cardsToDraw);
          newState.playerHand.push(...drawnCards);
          newState.deck = remainingDeck;
        }

        newState.gameMessage = `Vous avez pioché ${cardsToDraw} cartes (Joker). À vous de jouer la couleur imposée.`;
        newState.pendingDraw = 0;
        newState.jokerPendingDraw = false;
        newState.currentPlayer = 'player';
        return newState;
      }

      // Si on doit piocher à cause d'un 7
      if (newState.pendingDraw > 0) {
        let cardsToDraw = newState.pendingDraw;
        if (newState.deck.length < cardsToDraw) {
          newState = replenishDeckFromDiscard(newState);
        }
        cardsToDraw = Math.min(cardsToDraw, newState.deck.length);

        if (cardsToDraw > 0) {
          const { drawnCards, remainingDeck } = drawCards(newState.deck, cardsToDraw);
          newState.playerHand.push(...drawnCards);
          newState.deck = remainingDeck;
        }

        newState.gameMessage = `Vous avez pioché ${cardsToDraw} cartes (7 cumulés).`;
        newState.pendingDraw = 0;
        newState.jokerPendingDraw = false;
        newState.currentPlayer = 'player';
        return newState;
      }

      // Pioche normale
      if (newState.deck.length === 0) newState = replenishDeckFromDiscard(newState);

      if (newState.deck.length > 0) {
        const { drawnCards, remainingDeck } = drawCards(newState.deck, 1);
        const drawnCard = drawnCards[0];
        newState.playerHand.push(drawnCard);
        newState.deck = remainingDeck;

        if (isPlayable(drawnCard, newState.topCard, newState.forcedSuit, 0, newState.jokerPendingDraw)) {
          newState.gameMessage = `Pioché ${drawnCard.rank} ! Jouez-le ou passez.`;
          newState.canPlayerEndTurn = true;
          newState.currentPlayer = 'player';
          return newState;
        } else {
          newState.gameMessage = "Pas de chance. Au tour de l'IA.";
          newState.currentPlayer = 'ai';
          newState.pendingDraw = 0;
          newState.jokerPendingDraw = false;
          return runAiTurn(newState);
        }
      }
      break;
    }

    case 'END_TURN': {
      newState.canPlayerEndTurn = false;
      newState.extraTurn = false;
      newState.currentPlayer = 'ai';
      return runAiTurn(newState);
    }

    case 'SET_SUIT': {
      newState.forcedSuit = action.suit;
      newState.isSuitPickerOpen = false;
      const lastPlayedCard = newState.discardPile[0];

      // Si c'était un Joker, on marque jokerPendingDraw = true
      if (lastPlayedCard.isJoker) {
        newState.pendingDraw = 5;
        newState.jokerPendingDraw = true;
        newState.gameMessage = `Couleur : ${SUITS_FR[action.suit]}. L'IA doit piocher 5 cartes OBLIGATOIREMENT !`;
      } else {
        newState.jokerPendingDraw = false;
        newState.gameMessage = `Couleur : ${SUITS_FR[action.suit]}.`;
      }

      newState.currentPlayer = 'ai';
      return runAiTurn(newState);
    }
  }

  return newState;
}

async function runAiTurn(state: GameState): Promise<GameState> {
  let newState = { ...state };

  let aiTurns = 0;
  const maxAiTurns = 10;

  while (aiTurns < maxAiTurns && !newState.winner && newState.currentPlayer === 'ai') {
    newState.gameMessage = "L'IA réfléchit...";

    if (newState.deck.length === 0) {
      newState = replenishDeckFromDiscard(newState);
      if (newState.deck.length === 0) {
        newState.currentPlayer = 'player';
        newState.gameMessage = "La pioche est vide ! À votre tour !";
        break;
      }
    }

    // CORRECTION : si jokerPendingDraw, l'IA pioche OBLIGATOIREMENT les 5 cartes
    if (newState.jokerPendingDraw) {
      let cardsToDraw = newState.pendingDraw; // 5
      if (newState.deck.length < cardsToDraw) {
        newState = replenishDeckFromDiscard(newState);
      }
      cardsToDraw = Math.min(cardsToDraw, newState.deck.length);

      if (cardsToDraw > 0) {
        const { drawnCards, remainingDeck } = drawCards(newState.deck, cardsToDraw);
        newState.aiHand.push(...drawnCards);
        newState.deck = remainingDeck;
      }

      newState.pendingDraw = 0;
      newState.jokerPendingDraw = false;
      newState.gameMessage = `L'IA a pioché ${cardsToDraw} cartes (Joker). À son tour de jouer la couleur imposée.`;
      // L'IA continue son tour, elle doit jouer la couleur imposée
      aiTurns++;
      continue;
    }

    // Si pendingDraw vient d'un 7, l'IA peut contrer avec un 7 ou piocher
    if (newState.pendingDraw > 0 && !newState.jokerPendingDraw) {
      const canPlaySeven = newState.aiHand.some(card =>
        card.rank === '7' && isPlayable(card, newState.topCard, newState.forcedSuit, newState.pendingDraw, false)
      );

      if (!canPlaySeven) {
        // L'IA ne peut pas contrer, elle pioche tout
        let cardsToDraw = newState.pendingDraw;
        if (newState.deck.length < cardsToDraw) {
          newState = replenishDeckFromDiscard(newState);
        }
        cardsToDraw = Math.min(cardsToDraw, newState.deck.length);

        if (cardsToDraw > 0) {
          const { drawnCards, remainingDeck } = drawCards(newState.deck, cardsToDraw);
          newState.aiHand.push(...drawnCards);
          newState.deck = remainingDeck;
        }

        newState.pendingDraw = 0;
        newState.gameMessage = `L'IA a pioché ${cardsToDraw} cartes (7 cumulés). À son tour.`;
        newState.currentPlayer = 'player';
        newState.extraTurn = false;
        break;
      }
      // Sinon, l'IA va jouer un 7 (géré par getAiMove)
    }

    const aiMove = getAiMove(newState);

    if (aiMove.drawCard) {
      const { drawnCards, remainingDeck } = drawCards(newState.deck, 1);
      newState.aiHand.push(drawnCards[0]);
      newState.deck = remainingDeck;
      newState.gameMessage = "L'IA a pioché et passe son tour.";
      newState.currentPlayer = 'player';
      newState.extraTurn = false;
      break;
    }

    if (aiMove.cardToPlay) {
      const cardIndex = newState.aiHand.findIndex(c => c.id === aiMove.cardToPlay!.id);
      if (cardIndex > -1) {
        const [playedCard] = newState.aiHand.splice(cardIndex, 1);
        newState.discardPile.unshift(playedCard);
        newState.topCard = playedCard;

        const playedCardName = playedCard.isJoker ? "Joker" : `${playedCard.rank} de ${SUITS_FR[playedCard.suit!]}`;
        newState.winner = getWinner(newState);

        if (newState.winner) {
          newState.gameMessage = `L'IA a joué ${playedCardName} et a gagné !`;
          break;
        }

        newState.forcedSuit = null;
        let turnEnds = true;

        // JOKER de l'IA
        if (playedCard.isJoker) {
          if (aiMove.newForcedSuit) {
            newState.forcedSuit = aiMove.newForcedSuit;
            newState.pendingDraw = 5;
            newState.jokerPendingDraw = true;
            newState.gameMessage = `L'IA a joué un Joker et choisi ${SUITS_FR[aiMove.newForcedSuit]}. Vous devez piocher 5 cartes OBLIGATOIREMENT !`;
          }
        }
        // VALET de l'IA
        else if (playedCard.rank === 'Jack') {
          if (aiMove.newForcedSuit) {
            newState.forcedSuit = aiMove.newForcedSuit;
            newState.jokerPendingDraw = false;
            newState.gameMessage = `L'IA a joué un Valet et a choisi ${SUITS_FR[aiMove.newForcedSuit]}.`;
          }
        }
        // 10 de l'IA
        else if (playedCard.rank === '10') {
          newState.gameMessage = `L'IA a joué un 10. Elle rejoue !`;
          newState.extraTurn = true;
          turnEnds = false;
        }
        // 7 de l'IA : cumule avec les 7 précédents
        else if (playedCard.rank === '7') {
          if (newState.jokerPendingDraw) {
            newState.pendingDraw = 2;
            newState.jokerPendingDraw = false;
          } else {
            newState.pendingDraw = (newState.pendingDraw || 0) + 2;
          }
          newState.gameMessage = `L'IA a joué un 7. Piochez ${newState.pendingDraw} ou jouez un 7 !`;
        }
        // Carte normale
        else {
          newState.pendingDraw = 0;
          newState.jokerPendingDraw = false;
          newState.gameMessage = `L'IA a joué ${playedCardName}. À vous !`;
        }

        if (turnEnds) {
          newState.currentPlayer = 'player';
          newState.extraTurn = false;
          break;
        }
      }
    }

    aiTurns++;
  }

  return newState;
}