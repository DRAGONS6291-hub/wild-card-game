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

        if (playedCard.isJoker || playedCard.rank === 'Jack') {
          newState.isSuitPickerOpen = true;
          newState.gameMessage = 'Choisissez une couleur.';
          newState.currentPlayer = 'player';
          return newState;
        }

        if (playedCard.rank === '10') {
          newState.gameMessage = "Vous avez joué un 10. Rejouez !";
          newState.currentPlayer = 'player';
          newState.canPlayerEndTurn = true;
          newState.extraTurn = true;
          return newState;
        }

        if (playedCard.rank === '7') {
          newState.pendingDraw = (newState.pendingDraw || 0) + 2;
          newState.currentPlayer = 'ai';
          newState.gameMessage = `7 ! L'IA doit piocher ou répondre.`;
          return runAiTurn(newState);
        }

        newState.currentPlayer = 'ai';
        return runAiTurn(newState);
      }
      break;
    }

    case 'DRAW_CARD': {
      newState.extraTurn = false;

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

        newState.gameMessage = `Vous avez pioché ${cardsToDraw} cartes.`;
        newState.pendingDraw = 0;
        newState.currentPlayer = 'player';
        return newState;
      }

      if (newState.deck.length === 0) newState = replenishDeckFromDiscard(newState);

      if (newState.deck.length > 0) {
        const { drawnCards, remainingDeck } = drawCards(newState.deck, 1);
        const drawnCard = drawnCards[0];
        newState.playerHand.push(drawnCard);
        newState.deck = remainingDeck;

        if (isPlayable(drawnCard, newState.topCard, newState.forcedSuit, 0)) {
          newState.gameMessage = `Pioché ${drawnCard.rank} ! Jouez-le ou passez.`;
          newState.canPlayerEndTurn = true;
          newState.currentPlayer = 'player';
          return newState;
        } else {
          newState.gameMessage = "Pas de chance. Au tour de l'IA.";
          newState.currentPlayer = 'ai';
          newState.pendingDraw = 0;
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

      if (lastPlayedCard.isJoker) {
        newState.pendingDraw = 5;
        newState.gameMessage = `Couleur : ${SUITS_FR[action.suit]}. L'IA doit piocher 5 cartes !`;
      } else {
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

  // Boucle pour que l'IA joue plusieurs tours si nécessaire (ex: après un 10)
  let aiTurns = 0;
  const maxAiTurns = 10; // Sécurité pour éviter les boucles infinies

  while (aiTurns < maxAiTurns && !newState.winner && newState.currentPlayer === 'ai') {
    newState.gameMessage = "L'IA réfléchit...";

    // Recharger la pioche si vide
    if (newState.deck.length === 0) {
      newState = replenishDeckFromDiscard(newState);
      if (newState.deck.length === 0) {
        newState.currentPlayer = 'player';
        newState.gameMessage = "La pioche est vide ! À votre tour !";
        break;
      }
    }

    // Gérer le pendingDraw (cartes à piocher)
    if (newState.pendingDraw > 0) {
      const canPlaySeven = newState.aiHand.some(card =>
        card.rank === '7' && isPlayable(card, newState.topCard, newState.forcedSuit, newState.pendingDraw)
      );

      if (!canPlaySeven) {
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
        newState.gameMessage = `L'IA a pioché ${cardsToDraw} cartes.`;
        newState.currentPlayer = 'player';
        break;
      }
    }

    // Obtenir le mouvement de l'IA
    const aiMove = getAiMove(newState);

    if (aiMove.drawCard) {
      // L'IA pioche
      const { drawnCards, remainingDeck } = drawCards(newState.deck, 1);
      newState.aiHand.push(drawnCards[0]);
      newState.deck = remainingDeck;
      newState.gameMessage = "L'IA a pioché et passe son tour.";
      newState.currentPlayer = 'player';
      newState.extraTurn = false;
      break;
    }

    if (aiMove.cardToPlay) {
      // L'IA joue une carte
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

        if (playedCard.isJoker || playedCard.rank === 'Jack') {
          if (aiMove.newForcedSuit) {
            newState.forcedSuit = aiMove.newForcedSuit;
            if (playedCard.isJoker) {
              newState.pendingDraw = 5;
              newState.gameMessage = `L'IA a joué un Joker et choisi ${SUITS_FR[aiMove.newForcedSuit]}. Piochez 5 cartes !`;
            } else {
              newState.gameMessage = `L'IA a joué un Valet et a choisi ${SUITS_FR[aiMove.newForcedSuit]}.`;
            }
          }
        } else if (playedCard.rank === '10') {
          newState.gameMessage = `L'IA a joué un 10. Rejoue !`;
          newState.extraTurn = true;
          turnEnds = false;
        } else if (playedCard.rank === '7') {
          newState.pendingDraw = (newState.pendingDraw || 0) + 2;
          newState.gameMessage = `L'IA a joué un 7. Piochez ${newState.pendingDraw} ou jouez un 7 !`;
        } else {
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