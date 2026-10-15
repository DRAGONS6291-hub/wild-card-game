import { GameCard, GameState, Player, SUITS, RANKS, Suit, LocalGameState, LocalPlayer, Difficulty } from './game-types';

export const createDeck = (): GameCard[] => {
  const deck: GameCard[] = [];
  for (let i = 0; i < 2; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ id: `deck-${i}-${suit}-${rank}`, suit, rank });
      }
    }
    deck.push({ id: `deck-${i}-joker-1`, rank: 'Joker', suit: undefined, isJoker: true });
    deck.push({ id: `deck-${i}-joker-2`, rank: 'Joker', suit: undefined, isJoker: true });
  }
  return deck;
};

export const shuffleDeck = (deck: GameCard[]): GameCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealHands = (deck: GameCard[], numCards: number) => {
  const playerHand = deck.slice(0, numCards);
  const aiHand = deck.slice(numCards, numCards * 2);
  const remainingDeck = deck.slice(numCards * 2);
  return { playerHand, aiHand, remainingDeck };
};

export const replenishDeckFromDiscard = (state: GameState): GameState => {
  const { discardPile, topCard } = state;
  if (discardPile.length <= 1) return state;
  return { ...state, deck: shuffleDeck(discardPile.slice(1)), discardPile: [topCard] };
};

export const drawCards = (deck: GameCard[], count: number) => ({
  drawnCards: deck.slice(0, count),
  remainingDeck: deck.slice(count),
});

// ✅ MODIFIÉ : Applique la règle de démarrage (7 ou Joker)
export const createInitialGameState = (difficulty: Difficulty = 'medium'): GameState => {
  let deck = shuffleDeck(createDeck());
  const { playerHand, aiHand, remainingDeck } = dealHands(deck, 7);
  
  // On prend la première carte du paquet restant comme carte de départ
  let topCard = remainingDeck[0];
  let deckAfterTopCard = remainingDeck.slice(1);
  
  let gameMessage = "À votre tour ! Jouez une carte ou piochez.";
  let pendingDraw = 0;
  let jokerPendingDraw = false;

  // ✅ RÈGLE DE DÉMARRAGE : 7 ou Joker
  if (topCard.rank === '7') {
    const playerHasSeven = playerHand.some(c => c.rank === '7');
    if (playerHasSeven) {
      gameMessage = 'La partie commence ! Un 7 est retourné. Vous avez un 7 pour contrer !';
    } else {
      // Pioche automatique de 2 cartes pour le joueur
      const drawn = drawCards(deckAfterTopCard, 2);
      playerHand.push(...drawn.drawnCards);
      deckAfterTopCard = drawn.remainingDeck;
      gameMessage = 'La partie commence ! Un 7 est retourné. Vous piochez automatiquement 2 cartes !';
    }
  } else if (topCard.isJoker) {
    // Pioche automatique de 5 cartes pour le joueur
    const drawn = drawCards(deckAfterTopCard, 5);
    playerHand.push(...drawn.drawnCards);
    deckAfterTopCard = drawn.remainingDeck;
    gameMessage = 'La partie commence ! Un Joker est retourné. Vous piochez automatiquement 5 cartes !';
    jokerPendingDraw = true; // Empêche de jouer tant qu'on n'a pas pioché (géré par isPlayable)
  }

  return {
    playerHand, aiHand, deck: deckAfterTopCard, discardPile: [topCard], topCard,
    currentPlayer: 'player', forcedSuit: null, winner: null, isAiThinking: false,
    gameMessage,
    isSuitPickerOpen: false, canPlayerEndTurn: false, pendingDraw, extraTurn: false, difficulty,
    jokerPendingDraw,
  };
};

// ✅ MODIFIÉ : Applique la règle de démarrage pour le mode Local
export const createInitialLocalGameState = (playerNames: string[]): LocalGameState => {
  const playerCount = playerNames.length;
  let deck = shuffleDeck(createDeck());
  const players: LocalPlayer[] = playerNames.map((name, index) => ({ id: `player-${index}`, name, hand: [] }));
  
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < playerCount; j++) {
      players[j].hand.push(deck.pop()!);
    }
  }
  
  // On prend la première carte comme carte de départ
  let topCard = deck.pop()!;
  let gameMessage = `C'est au tour de ${players[0].name} !`;
  let pendingDraw = 0;

  // ✅ RÈGLE DE DÉMARRAGE : 7 ou Joker pour le Joueur 1 (index 0)
  if (topCard.rank === '7') {
    const player1HasSeven = players[0].hand.some(c => c.rank === '7');
    if (player1HasSeven) {
      gameMessage = `La partie commence ! Un 7 est retourné. ${players[0].name} a un 7 pour contrer !`;
    } else {
      // Pioche automatique de 2 cartes pour le Joueur 1
      const drawn = drawCards(deck, 2);
      players[0].hand.push(...drawn.drawnCards);
      deck = drawn.remainingDeck;
      gameMessage = `La partie commence ! Un 7 est retourné. ${players[0].name} pioche automatiquement 2 cartes !`;
    }
  } else if (topCard.isJoker) {
    // Pioche automatique de 5 cartes pour le Joueur 1
    const drawn = drawCards(deck, 5);
    players[0].hand.push(...drawn.drawnCards);
    deck = drawn.remainingDeck;
    gameMessage = `La partie commence ! Un Joker est retourné. ${players[0].name} pioche automatiquement 5 cartes !`;
    pendingDraw = 5;
  }

  return {
    players, deck, discardPile: [topCard], topCard,
    currentPlayerIndex: 0, forcedSuit: null, winner: null,
    gameMessage,
    isSuitPickerOpen: false, canPlayerEndTurn: false, pendingDraw, isPassingTurn: false,
  };
};

// CORRECTION : on ne peut pas jouer un 7 sur un Joker (jokerPendingDraw = true)
export const isPlayable = (card: GameCard, topCard: GameCard, forcedSuit: Suit | null, pendingDraw?: number, jokerPendingDraw?: boolean): boolean => {
  if (jokerPendingDraw) {
    return false; // Aucune carte n'est jouable, il faut piocher
  }
  if (pendingDraw && pendingDraw > 0) {
    return card.rank === '7';
  }
  if (card.isJoker) return true;
  if (card.rank === 'Jack') return true;
  const effectiveTopSuit = topCard.isJoker ? forcedSuit : topCard.suit;
  if (forcedSuit) return card.suit === forcedSuit;
  return card.suit === effectiveTopSuit || card.rank === topCard.rank;
};

export const getWinner = (state: GameState): Player | null => {
  if (state.playerHand.length === 0) return 'player';
  if (state.aiHand.length === 0) return 'ai';
  return null;
};

export const getLocalWinner = (state: LocalGameState): LocalPlayer | null => {
  return state.players.find(p => p.hand.length === 0) || null;
};

export const replenishLocalDeckFromDiscard = (state: LocalGameState): LocalGameState => {
  if (state.discardPile.length <= 1) return state;
  return { ...state, deck: shuffleDeck(state.discardPile.slice(1)), discardPile: [state.topCard] };
};