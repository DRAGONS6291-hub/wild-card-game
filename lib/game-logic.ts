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

export const createInitialGameState = (difficulty: Difficulty = 'medium'): GameState => {
  let deck = shuffleDeck(createDeck());
  const { playerHand, aiHand, remainingDeck } = dealHands(deck, 7);
  let topCard: GameCard;
  let deckAfterTopCard: GameCard[];
  const idx = remainingDeck.findIndex(card => !card.isJoker && !['Jack', '7', '10'].includes(card.rank));
  if (idx !== -1) {
    topCard = remainingDeck[idx];
    deckAfterTopCard = [...remainingDeck.slice(0, idx), ...remainingDeck.slice(idx + 1)];
  } else {
    return createInitialGameState(difficulty);
  }
  return {
    playerHand, aiHand, deck: deckAfterTopCard, discardPile: [topCard], topCard,
    currentPlayer: 'player', forcedSuit: null, winner: null, isAiThinking: false,
    gameMessage: "À votre tour ! Jouez une carte ou piochez.",
    isSuitPickerOpen: false, canPlayerEndTurn: false, pendingDraw: 0, extraTurn: false, difficulty,
    jokerPendingDraw: false, // NOUVEAU
  };
};

export const createInitialLocalGameState = (playerNames: string[]): LocalGameState => {
  const playerCount = playerNames.length;
  let deck = shuffleDeck(createDeck());
  const players: LocalPlayer[] = playerNames.map((name, index) => ({ id: `player-${index}`, name, hand: [] }));
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < playerCount; j++) {
      players[j].hand.push(deck.pop()!);
    }
  }
  let topCard: GameCard | undefined;
  let validStartIndex = -1;
  do {
    validStartIndex = deck.findIndex(card => !card.isJoker && !['Jack', '7', '10'].includes(card.rank));
    if (validStartIndex !== -1) {
      topCard = deck.splice(validStartIndex, 1)[0];
    } else {
      deck = shuffleDeck(createDeck());
      for (let j = 0; j < playerCount; j++) { players[j].hand = []; }
      for (let i = 0; i < 7; i++) { for (let j = 0; j < playerCount; j++) { players[j].hand.push(deck.pop()!); } }
    }
  } while (!topCard);
  return {
    players, deck, discardPile: [topCard!], topCard: topCard!,
    currentPlayerIndex: 0, forcedSuit: null, winner: null,
    gameMessage: `C'est au tour de ${players[0].name} !`,
    isSuitPickerOpen: false, canPlayerEndTurn: false, pendingDraw: 0, isPassingTurn: false,
  };
};

// CORRECTION : on ne peut pas jouer un 7 sur un Joker (jokerPendingDraw = true)
export const isPlayable = (card: GameCard, topCard: GameCard, forcedSuit: Suit | null, pendingDraw?: number, jokerPendingDraw?: boolean): boolean => {
  // Si on doit piocher à cause d'un Joker, on ne peut PAS contrer avec un 7
  if (jokerPendingDraw) {
    return false; // Aucune carte n'est jouable, il faut piocher
  }
  // Si on doit piocher à cause d'un 7, on peut contrer avec un autre 7
  if (pendingDraw && pendingDraw > 0) {
    return card.rank === '7';
  }
  if (card.isJoker) return true;
  if (card.rank === 'Jack') return true;
  const effectiveTopSuit = topCard.isJoker ? forcedSuit : topCard.suit;
  if (forcedSuit) return card.suit === forcedSuit;
  return card.suit === effectiveTopSuit || card.rank === topCard.rank;
};

export const drawCards = (deck: GameCard[], count: number) => ({
  drawnCards: deck.slice(0, count),
  remainingDeck: deck.slice(count),
});

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