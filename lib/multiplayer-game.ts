import { GameCard, Suit, SUITS_FR } from './game-types';

// Créer un deck complet de 54 cartes (52 + 2 jokers)
export function createDeck(): GameCard[] {
  const suits: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
  const deck: GameCard[] = [];
  
  let id = 0;
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `card-${id++}`,
        suit,
        rank,
        isJoker: false,
      });
    }
  }
  // 2 jokers
  deck.push({ id: `card-${id++}`, suit: 'Hearts', rank: 'Joker', isJoker: true });
  deck.push({ id: `card-${id++}`, suit: 'Hearts', rank: 'Joker', isJoker: true });
  
  return deck;
}

// Mélanger un deck (Fisher-Yates)
export function shuffleDeck(deck: GameCard[]): GameCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// État du jeu multijoueur
export interface MultiplayerGameState {
  status: 'waiting' | 'playing' | 'finished';
  player1_ready: boolean;
  player2_ready: boolean;
  current_turn: 1 | 2;
  player1_hand: GameCard[];
  player2_hand: GameCard[];
  deck: GameCard[];
  discard_pile: GameCard[];
  top_card: GameCard | null;
  forced_suit: Suit | null;
  pending_draw: number;
  winner: 1 | 2 | null;
  message: string;
  last_action_at: string;
}

// Créer l'état initial du jeu
export function createMultiplayerGameState(): MultiplayerGameState {
  const deck = shuffleDeck(createDeck());
  const player1_hand = deck.splice(0, 7);
  const player2_hand = deck.splice(0, 7);
  const top_card = deck.shift() || null;
  
  return {
    status: 'waiting',
    player1_ready: false,
    player2_ready: false,
    current_turn: 1,
    player1_hand,
    player2_hand,
    deck,
    discard_pile: top_card ? [top_card] : [],
    top_card,
    forced_suit: null,
    pending_draw: 0,
    winner: null,
    message: 'En attente des joueurs...',
    last_action_at: new Date().toISOString(),
  };
}

// Vérifier si une carte est jouable
export function isCardPlayable(
  card: GameCard,
  topCard: GameCard | null,
  forcedSuit: Suit | null,
  pendingDraw: number
): boolean {
  if (!topCard) return true;
  if (card.isJoker) return true;
  if (forcedSuit && card.suit === forcedSuit) return true;
  if (card.suit === topCard.suit) return true;
  if (card.rank === topCard.rank) return true;
  return false;
}

// Appliquer un coup (jouer une carte)
export function applyPlayCard(
  state: MultiplayerGameState,
  playerId: 1 | 2,
  cardId: string
): MultiplayerGameState {
  const hand = playerId === 1 ? state.player1_hand : state.player2_hand;
  const cardIndex = hand.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) return state;
  
  const card = hand[cardIndex];
  
  // Vérifier si jouable
  if (!isCardPlayable(card, state.top_card, state.forced_suit, state.pending_draw)) {
    return { ...state, message: 'Carte non jouable !' };
  }
  
  // Retirer la carte de la main
  const newHand = hand.filter(c => c.id !== cardId);
  
  // Ajouter à la défausse
  const newDiscardPile = [...state.discard_pile, card];
  
  // Calculer le prochain tour
  const nextTurn: 1 | 2 = playerId === 1 ? 2 : 1;
  
  // Gérer les cartes spéciales
  let newPendingDraw = state.pending_draw;
  let newForcedSuit = state.forced_suit;
  let newMessage = `Joueur ${playerId} a joué ${card.rank} de ${card.suit}`;
  
  if (card.rank === '7') {
    newPendingDraw += 2;
    newMessage += ' (+2 cartes à piocher pour l\'adversaire)';
  } else if (card.rank === '10') {
    // Le 10 fait sauter le tour de l'adversaire
    newMessage += ' (tour de l\'adversaire sauté)';
  } else if (card.rank === 'Jack' || card.isJoker) {
    // Doit choisir une couleur - on met un placeholder
    newForcedSuit = null;
    newMessage += ' - Choisissez une couleur';
  }
  
  // Vérifier la victoire
  let winner = state.winner;
  let status = state.status;
  if (newHand.length === 0) {
    winner = playerId;
    status = 'finished';
    newMessage = `🎉 Joueur ${playerId} a gagné !`;
  }
  
  return {
    ...state,
    player1_hand: playerId === 1 ? newHand : state.player1_hand,
    player2_hand: playerId === 2 ? newHand : state.player2_hand,
    discard_pile: newDiscardPile,
    top_card: card,
    current_turn: winner ? state.current_turn : nextTurn,
    forced_suit: newForcedSuit,
    pending_draw: newPendingDraw,
    winner,
    status,
    message: newMessage,
    last_action_at: new Date().toISOString(),
  };
}

// Appliquer une pioche
export function applyDrawCard(
  state: MultiplayerGameState,
  playerId: 1 | 2
): MultiplayerGameState {
  if (state.deck.length === 0) {
    // Recréer un deck si vide (mélanger la défausse sauf la dernière carte)
    if (state.discard_pile.length <= 1) {
      return { ...state, message: 'Plus de cartes à piocher !' };
    }
    const lastCard = state.discard_pile[state.discard_pile.length - 1];
    const newDeck = shuffleDeck(state.discard_pile.slice(0, -1));
    const newDiscardPile = [lastCard];
    
    const drawnCards = newDeck.splice(0, state.pending_draw > 0 ? state.pendingDraw : 1);
    const hand = playerId === 1 ? state.player1_hand : state.player2_hand;
    const newHand = [...hand, ...drawnCards];
    
    return {
      ...state,
      deck: newDeck,
      discard_pile: newDiscardPile,
      player1_hand: playerId === 1 ? newHand : state.player1_hand,
      player2_hand: playerId === 2 ? newHand : state.player2_hand,
      pending_draw: 0,
      current_turn: playerId === 1 ? 2 : 1,
      message: `Joueur ${playerId} a pioché ${drawnCards.length} carte(s)`,
      last_action_at: new Date().toISOString(),
    };
  }
  
  // Piocher normalement
  const cardsToDraw = state.pending_draw > 0 ? state.pending_draw : 1;
  const drawnCards = state.deck.splice(0, cardsToDraw);
  const hand = playerId === 1 ? state.player1_hand : state.player2_hand;
  const newHand = [...hand, ...drawnCards];
  
  return {
    ...state,
    deck: state.deck,
    player1_hand: playerId === 1 ? newHand : state.player1_hand,
    player2_hand: playerId === 2 ? newHand : state.player2_hand,
    pending_draw: 0,
    current_turn: playerId === 1 ? 2 : 1,
    message: `Joueur ${playerId} a pioché ${cardsToDraw} carte(s)`,
    last_action_at: new Date().toISOString(),
  };
}

// Choisir une couleur (après Joker ou Valet)
export function applyChooseSuit(
  state: MultiplayerGameState,
  playerId: 1 | 2,
  suit: Suit
): MultiplayerGameState {
  return {
    ...state,
    forced_suit: suit,
    current_turn: playerId === 1 ? 2 : 1,
    message: `Joueur ${playerId} a choisi ${SUITS_FR[suit]}`,
    last_action_at: new Date().toISOString(),
  };
}