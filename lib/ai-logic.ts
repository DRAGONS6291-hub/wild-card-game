import { GameCard, GameState, Suit, SUITS } from './game-types';

function cardToString(card: GameCard): string {
  return card.isJoker ? 'Joker' : `${card.rank} of ${card.suit}`;
}

function stringToCard(cardString: string, hand: GameCard[]): GameCard | undefined {
  return hand.find(c => cardToString(c) === cardString);
}

export function getAiMove(state: GameState): { cardToPlay?: GameCard; drawCard: boolean; newForcedSuit?: Suit } {
  const { aiHand, topCard, forcedSuit, pendingDraw, difficulty } = state;

  // Trouver les cartes jouables
  const playableCards = aiHand.filter(card => {
    if (pendingDraw && pendingDraw > 0) return card.rank === '7';
    if (card.isJoker) return true;
    if (card.rank === 'Jack') return true;
    const effectiveTopSuit = topCard.isJoker ? forcedSuit : topCard.suit;
    if (forcedSuit) return card.suit === forcedSuit;
    return card.suit === effectiveTopSuit || card.rank === topCard.rank;
  });

  // Si aucune carte jouable, piocher
  if (playableCards.length === 0) {
    return { drawCard: true };
  }

  // Stratégie selon la difficulté
  let chosenCard: GameCard;

  if (difficulty === 'easy') {
    // Facile : jouer au hasard
    chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
  } else if (difficulty === 'medium') {
    // Moyen : éviter les cartes spéciales si possible
    const normalCards = playableCards.filter(c => !c.isJoker && c.rank !== 'Jack' && c.rank !== '10' && c.rank !== '7');
    if (normalCards.length > 0) {
      // Jouer la carte avec le plus petit rang
      chosenCard = normalCards.sort((a, b) => {
        const rankOrder: Record<string, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'Jack': 11, 'Queen': 12, 'King': 13, 'Ace': 14 };
        return rankOrder[a.rank] - rankOrder[b.rank];
      })[0];
    } else {
      chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
    }
  } else {
    // Difficile : stratégie avancée
    // 1. Si on peut jouer un 7 pour faire piocher l'adversaire, le faire
    const sevens = playableCards.filter(c => c.rank === '7');
    if (sevens.length > 0 && aiHand.length <= 3) {
      chosenCard = sevens[0];
    }
    // 2. Sinon, jouer les cartes normales en priorité
    else {
      const normalCards = playableCards.filter(c => !c.isJoker && c.rank !== 'Jack');
      if (normalCards.length > 0) {
        // Jouer la carte avec le plus petit rang
        chosenCard = normalCards.sort((a, b) => {
          const rankOrder: Record<string, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'Jack': 11, 'Queen': 12, 'King': 13, 'Ace': 14 };
          return rankOrder[a.rank] - rankOrder[b.rank];
        })[0];
      }
      // 3. En dernier recours, jouer une carte spéciale
      else {
        chosenCard = playableCards[0];
      }
    }
  }

  // Choisir une couleur pour les cartes spéciales
  let newForcedSuit: Suit | undefined;
  if (chosenCard.isJoker || chosenCard.rank === 'Jack') {
    // Choisir la couleur qu'on a le plus en main
    const suitCounts: Record<string, number> = {};
    aiHand.forEach(card => {
      if (!card.isJoker) {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
      }
    });
    const bestSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];
    newForcedSuit = bestSuit ? (bestSuit[0] as Suit) : SUITS[Math.floor(Math.random() * SUITS.length)];
  }

  return { cardToPlay: chosenCard, drawCard: false, newForcedSuit };
}