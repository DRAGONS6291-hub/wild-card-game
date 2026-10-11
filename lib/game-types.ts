export const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'] as const;

export const SUITS_FR: Record<Suit, string> = {
  Hearts: 'Cœurs',
  Diamonds: 'Carreaux',
  Clubs: 'Trèfles',
  Spades: 'Piques',
};

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isJoker?: false;
}

export interface JokerCard {
  id: string;
  suit: undefined;
  rank: 'Joker';
  isJoker: true;
}

export type GameCard = Card | JokerCard;
export type Player = 'player' | 'ai';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  playerHand: GameCard[];
  aiHand: GameCard[];
  deck: GameCard[];
  discardPile: GameCard[];
  currentPlayer: Player;
  topCard: GameCard;
  forcedSuit: Suit | null;
  winner: Player | null;
  isAiThinking: boolean;
  gameMessage: string | null;
  isSuitPickerOpen: boolean;
  canPlayerEndTurn: boolean;
  pendingDraw: number;
  extraTurn: boolean;
  difficulty: Difficulty;
}

export interface LocalPlayer {
  id: string;
  name: string;
  hand: GameCard[];
}

export interface LocalGameState {
  players: LocalPlayer[];
  deck: GameCard[];
  discardPile: GameCard[];
  topCard: GameCard;
  currentPlayerIndex: number;
  forcedSuit: Suit | null;
  winner: LocalPlayer | null;
  gameMessage: string | null;
  isSuitPickerOpen: boolean;
  canPlayerEndTurn: boolean;
  pendingDraw: number;
  isPassingTurn: boolean;
}