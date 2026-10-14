'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PlayingCard } from '@/components/game/PlayingCard';
import { GameCard, Suit, SUITS_FR } from '@/lib/game-types';

interface GameState {
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
}

export default function MultiplayerRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string;
  const { profile, userId } = useAuth();
  
  const [room, setRoom] = useState<any>(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opponentName, setOpponentName] = useState('Adversaire');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState<GameCard | null>(null);
  const [actionLocked, setActionLocked] = useState(false);

  // Créer un deck mélangé
  function createShuffledDeck(): GameCard[] {
    const suits: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const deck: GameCard[] = [];
    let id = 0;
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ id: `card-${id++}`, suit, rank, isJoker: false });
      }
    }
    deck.push({ id: `card-${id++}`, suit: 'Hearts', rank: 'Joker', isJoker: true });
    deck.push({ id: `card-${id++}`, suit: 'Hearts', rank: 'Joker', isJoker: true });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // Vérifier si une carte est jouable
  function isCardPlayable(card: GameCard, topCard: GameCard | null, forcedSuit: Suit | null): boolean {
    if (!topCard) return true;
    if (card.isJoker) return true;
    if (forcedSuit && card.suit === forcedSuit) return true;
    if (card.suit === topCard.suit) return true;
    if (card.rank === topCard.rank) return true;
    return false;
  }

  // Charger la salle
  useEffect(() => {
    if (!roomId || !userId) return;

    const loadRoom = async () => {
      const { data, error } = await supabase
        .from('match_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !data) {
        router.push('/multiplayer');
        return;
      }

      setRoom(data);
      const p1 = data.player1_id === userId;
      setIsPlayer1(p1);
      
      const opponentId = p1 ? data.player2_id : data.player1_id;
      if (opponentId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('pseudo')
          .eq('id', opponentId)
          .single();
        if (profileData) setOpponentName(profileData.pseudo);
      }
      
      if (data.game_state) {
        setGameState(data.game_state);
        setIsReady(p1 ? data.game_state.player1_ready : data.game_state.player2_ready);
        setOpponentReady(p1 ? data.game_state.player2_ready : data.game_state.player1_ready);
      }
      
      setLoading(false);
    };

    loadRoom();
  }, [roomId, userId, router]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newRoom = payload.new;
          setRoom(newRoom);
          setGameState(newRoom.game_state);
          
          if (newRoom.game_state) {
            const p1 = isPlayer1;
            setIsReady(p1 ? newRoom.game_state.player1_ready : newRoom.game_state.player2_ready);
            setOpponentReady(p1 ? newRoom.game_state.player2_ready : newRoom.game_state.player1_ready);
            setActionLocked(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isPlayer1]);

  // Gérer le bouton "Prêt"
  const handleReady = async () => {
    if (!room) return;
    setActionLocked(true);

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    const currentState = room.game_state || {
      status: 'waiting',
      player1_ready: false,
      player2_ready: false,
      message: 'En attente...',
      player1_hand: [],
      player2_hand: [],
      deck: [],
      discard_pile: [],
      top_card: null,
      current_turn: 1,
      forced_suit: null,
      pending_draw: 0,
      winner: null,
    };

    const updateData = {
      ...currentState,
      ...(isPlayer1 ? { player1_ready: newReadyState } : { player2_ready: newReadyState }),
    };

    const p1Ready = isPlayer1 ? newReadyState : currentState.player1_ready;
    const p2Ready = !isPlayer1 ? newReadyState : currentState.player2_ready;

    if (p1Ready && p2Ready) {
      const deck = createShuffledDeck();
      const p1Hand = deck.splice(0, 7);
      const p2Hand = deck.splice(0, 7);
      const topCard = deck.shift()!;
      
      updateData.status = 'playing';
      updateData.message = 'La partie commence ! Tour du Joueur 1';
      updateData.player1_hand = p1Hand;
      updateData.player2_hand = p2Hand;
      updateData.deck = deck;
      updateData.discard_pile = [topCard];
      updateData.top_card = topCard;
      updateData.current_turn = 1;
      updateData.forced_suit = null;
      updateData.pending_draw = 0;
      updateData.winner = null;
    } else {
      updateData.status = 'waiting';
      updateData.message = 'En attente de l\'adversaire...';
    }

    await supabase.from('match_rooms').update({ game_state: updateData }).eq('id', roomId);
  };

  // Jouer une carte
  const handlePlayCard = async (card: GameCard) => {
    if (!gameState || actionLocked) return;
    
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myId) return;
    if (!isCardPlayable(card, gameState.top_card, gameState.forced_suit)) return;
    
    setActionLocked(true);

    const myHand = isPlayer1 ? [...gameState.player1_hand] : [...gameState.player2_hand];
    const cardIndex = myHand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    
    myHand.splice(cardIndex, 1);
    
    const newDiscard = [...gameState.discard_pile, card];
    const nextTurn: 1 | 2 = myId === 1 ? 2 : 1;
    
    let newMessage = `Joueur ${myId} joue ${card.rank}`;
    let newPendingDraw = gameState.pending_draw;
    let newForcedSuit = gameState.forced_suit;
    let newCurrentTurn = nextTurn;
    let skipNextTurn = false;
    
    // Cartes spéciales
    if (card.rank === '7') {
      newPendingDraw += 2;
      newMessage += ' (+2 cartes à l\'adversaire)';
    } else if (card.rank === '10') {
      skipNextTurn = true;
      newMessage += ' (tour de l\'adversaire passé)';
    } else if (card.isJoker || card.rank === 'Jack') {
      // Demander la couleur
      setPendingCard(card);
      setShowSuitPicker(true);
      // On sauvegarde l'état partiel
      const partialState = {
        ...gameState,
        ...(isPlayer1 ? { player1_hand: myHand } : { player2_hand: myHand }),
        discard_pile: newDiscard,
        top_card: card,
        message: newMessage + ' - Choix de couleur...',
      };
      await supabase.from('match_rooms').update({ game_state: partialState }).eq('id', roomId);
      return; // On attend le choix de couleur
    }
    
    // Vérifier victoire
    let winner = gameState.winner;
    let status = gameState.status;
    if (myHand.length === 0) {
      winner = myId;
      status = 'finished';
      newMessage = `🎉 Joueur ${myId} a gagné !`;
    }
    
    if (skipNextTurn) {
      newCurrentTurn = myId; // On rejoue
    }
    
    const newState: GameState = {
      ...gameState,
      ...(isPlayer1 ? { player1_hand: myHand } : { player2_hand: myHand }),
      discard_pile: newDiscard,
      top_card: card,
      current_turn: winner ? gameState.current_turn : newCurrentTurn,
      forced_suit: newForcedSuit,
      pending_draw: newPendingDraw,
      winner,
      status,
      message: newMessage,
    };
    
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  // Choisir une couleur
  const handleChooseSuit = async (suit: Suit) => {
    if (!gameState || !pendingCard) return;
    setShowSuitPicker(false);
    
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    const nextTurn: 1 | 2 = myId === 1 ? 2 : 1;
    
    const newState: GameState = {
      ...gameState,
      forced_suit: suit,
      current_turn: nextTurn,
      message: `Joueur ${myId} choisit ${SUITS_FR[suit]}`,
    };
    
    setPendingCard(null);
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  // Piocher une carte
  const handleDraw = async () => {
    if (!gameState || actionLocked) return;
    
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myId) return;
    
    setActionLocked(true);
    
    const cardsToDraw = gameState.pending_draw > 0 ? gameState.pending_draw : 1;
    let newDeck = [...gameState.deck];
    let newDiscard = [...gameState.discard_pile];
    
    // Si pas assez de cartes, on recycle la défausse
    if (newDeck.length < cardsToDraw) {
      const lastCard = newDiscard[newDiscard.length - 1];
      const toShuffle = newDiscard.slice(0, -1);
      for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
      }
      newDeck = [...newDeck, ...toShuffle];
      newDiscard = [lastCard];
    }
    
    const drawnCards = newDeck.splice(0, cardsToDraw);
    const myHand = isPlayer1 ? [...gameState.player1_hand] : [...gameState.player2_hand];
    myHand.push(...drawnCards);
    
    const nextTurn: 1 | 2 = myId === 1 ? 2 : 1;
    
    const newState: GameState = {
      ...gameState,
      ...(isPlayer1 ? { player1_hand: myHand } : { player2_hand: myHand }),
      deck: newDeck,
      discard_pile: newDiscard,
      pending_draw: 0,
      current_turn: nextTurn,
      message: `Joueur ${myId} pioche ${cardsToDraw} carte(s)`,
    };
    
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  // Nouvelle partie
  const handleNewGame = async () => {
    if (!room) return;
    setActionLocked(true);
    
    const deck = createShuffledDeck();
    const p1Hand = deck.splice(0, 7);
    const p2Hand = deck.splice(0, 7);
    const topCard = deck.shift()!;
    
    const newState: GameState = {
      status: 'playing',
      player1_ready: true,
      player2_ready: true,
      current_turn: 1,
      player1_hand: p1Hand,
      player2_hand: p2Hand,
      deck,
      discard_pile: [topCard],
      top_card: topCard,
      forced_suit: null,
      pending_draw: 0,
      winner: null,
      message: 'Nouvelle partie ! Tour du Joueur 1',
    };
    
    await supabase.from('match_rooms').update({ 
      game_state: newState,
      status: 'playing',
      winner_id: null,
    }).eq('id', roomId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-xl font-bold">Salle introuvable</p>
      </div>
    );
  }

  const myId: 1 | 2 = isPlayer1 ? 1 : 2;
  const myHand = gameState ? (isPlayer1 ? gameState.player1_hand : gameState.player2_hand) : [];
  const opponentHand = gameState ? (isPlayer1 ? gameState.player2_hand : gameState.player1_hand) : [];
  const isMyTurn = gameState?.current_turn === myId && gameState?.status === 'playing';

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-4">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400">
            <ArrowLeft className="w-5 h-5" /> Quitter
          </Link>
          <h1 className="text-xl md:text-2xl font-black text-yellow-400">⚔️ MULTIJOUER</h1>
          <div className="w-20"></div>
        </div>

        {/* Message */}
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 mb-4 text-center border-2 border-yellow-400/50">
          <p className="text-white font-bold text-sm md:text-base">{gameState?.message || 'Chargement...'}</p>
          {gameState?.forced_suit && (
            <p className="text-yellow-400 text-xs mt-1">
              Couleur imposée : {SUITS_FR[gameState.forced_suit]}
            </p>
          )}
          {gameState?.pending_draw > 0 && (
            <p className="text-red-400 text-xs mt-1">
              +{gameState.pending_draw} cartes à piocher !
            </p>
          )}
        </div>

        {!gameState || gameState.status === 'waiting' ? (
          /* Écran d'attente */
          <div className="bg-white/95 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${isReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white">
                  {profile?.pseudo?.charAt(0).toUpperCase() || '?'}
                </div>
                <p className="font-bold text-gray-800">{profile?.pseudo || 'Toi'}</p>
                <p className="text-sm text-gray-500 mb-3">{isReady ? '✅ Prêt' : '❌ Pas prêt'}</p>
                <Button onClick={handleReady} className={isReady ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}>
                  {isReady ? 'Annuler' : 'Je suis prêt !'}
                </Button>
              </div>

              <div className="text-4xl font-black text-yellow-500">VS</div>

              <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${opponentReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white">
                  <Users className="w-10 h-10" />
                </div>
                <p className="font-bold text-gray-800">{opponentName}</p>
                <p className="text-sm text-gray-500 mb-3">{opponentReady ? '✅ Prêt' : '⏳ En attente...'}</p>
                <div className="w-32 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-bold">
                  {opponentReady ? 'Prêt' : 'Attente'}
                </div>
              </div>
            </div>
          </div>
        ) : gameState.status === 'finished' ? (
          /* Écran de fin */
          <div className="bg-white/95 rounded-2xl p-8 shadow-2xl border-2 border-yellow-400 text-center">
            <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-black mb-4">
              {gameState.winner === myId ? '🎉 Tu as gagné !' : '😢 Tu as perdu...'}
            </h2>
            <p className="text-gray-600 mb-6">
              Vainqueur : Joueur {gameState.winner}
            </p>
            <Button onClick={handleNewGame} className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black font-black border-b-4 border-yellow-800 py-6 text-lg">
              <Sparkles className="w-5 h-5 mr-2" /> Nouvelle partie
            </Button>
          </div>
        ) : (
          /* Plateau de jeu */
          <div className="space-y-4">
            {/* Main adverse */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold border-2 border-white">
                    {opponentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{opponentName}</p>
                    <p className="text-yellow-400 text-xs">{opponentHand.length} cartes</p>
                  </div>
                </div>
                {gameState.current_turn !== myId && (
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    Son tour
                  </span>
                )}
              </div>
              <div className="flex justify-center gap-1 flex-wrap">
                {opponentHand.map((card, i) => (
                  <PlayingCard key={card.id || i} isFaceDown className="w-12 h-16 md:w-16 md:h-24" />
                ))}
              </div>
            </div>

            {/* Zone centrale */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50 min-h-[180px] flex items-center justify-center gap-8">
              <div className="flex flex-col items-center">
                <p className="text-white text-xs font-bold mb-2">DÉFAUSSE</p>
                {gameState.top_card ? (
                  <PlayingCard card={gameState.top_card} className="w-20 h-28 md:w-24 md:h-32" />
                ) : (
                  <div className="w-20 h-28 md:w-24 md:h-32 bg-gray-700 rounded-xl border-2 border-gray-500"></div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <p className="text-white text-xs font-bold mb-2">PIOCHE ({gameState.deck.length})</p>
                <button 
                  onClick={handleDraw}
                  disabled={!isMyTurn}
                  className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105"
                >
                  <PlayingCard isFaceDown className="w-20 h-28 md:w-24 md:h-32" />
                </button>
              </div>
            </div>

            {/* Ma main */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-white">
                    {profile?.pseudo?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{profile?.pseudo || 'Toi'}</p>
                    <p className="text-yellow-400 text-xs">{myHand.length} cartes</p>
                  </div>
                </div>
                {isMyTurn && (
                  <span className="bg-green-400 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    Ton tour !
                  </span>
                )}
              </div>
              <div className="flex justify-center gap-1 flex-wrap">
                {myHand.map((card) => {
                  const playable = isMyTurn && isCardPlayable(card, gameState.top_card, gameState.forced_suit);
                  return (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      isPlayable={playable}
                      onPlay={handlePlayCard}
                      className="w-14 h-20 md:w-20 md:h-28"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sélecteur de couleur */}
        {showSuitPicker && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-4">Choisis une couleur</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['Hearts', 'Diamonds', 'Clubs', 'Spades'] as Suit[]).map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleChooseSuit(suit)}
                    className={`p-4 rounded-xl font-bold text-white border-4 transition-transform hover:scale-105 ${
                      suit === 'Hearts' ? 'bg-red-500 border-red-700' :
                      suit === 'Diamonds' ? 'bg-blue-500 border-blue-700' :
                      suit === 'Clubs' ? 'bg-green-600 border-green-800' :
                      'bg-gray-800 border-gray-900'
                    }`}
                  >
                    {SUITS_FR[suit]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}