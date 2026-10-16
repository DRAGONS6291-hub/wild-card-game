'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Trophy, Sparkles, Home, SkipForward } from 'lucide-react';
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
  just_drew: boolean;
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
  const [opponentAvatar, setOpponentAvatar] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState<GameCard | null>(null);
  const [actionLocked, setActionLocked] = useState(false);

  const playerAvatar = profile?.avatar_url || `https://i.pravatar.cc/150?u=${userId}`;

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

  // ✅ RÈGLES COMPLÈTES DU WILD CARD
  function isCardPlayable(card: GameCard, topCard: GameCard | null, forcedSuit: Suit | null, pendingDraw: number = 0): boolean {
    // Règle 1 : Si on doit piocher (cumul de 7), on ne peut jouer que des 7
    if (pendingDraw > 0) return card.rank === '7';
    
    if (!topCard) return true;
    
    // Règle 2 : Joker et Valet sont toujours jouables (cartes wild)
    if (card.isJoker || card.rank === 'Jack') return true;
    
    const cardRank = String(card.rank || '').trim();
    const topRank = String(topCard.rank || '').trim();
    const cardSuit = String(card.suit || '').trim();
    const topSuit = String(topCard.suit || '').trim();
    
    // Règle 3 : Si une couleur est imposée, on peut jouer cette couleur OU le même rang
    if (forcedSuit) {
      return card.suit === forcedSuit || cardRank === topRank;
    }
    
    // Règle 4 : Sinon, même couleur OU même rang que la carte du dessus
    return cardSuit === topSuit || cardRank === topRank;
  }

  function drawCardsAutomatic(deck: GameCard[], discardPile: GameCard[], count: number): { newDeck: GameCard[]; newDiscard: GameCard[]; drawnCards: GameCard[] } {
    let newDeck = [...deck];
    let newDiscard = [...discardPile];
    if (newDeck.length < count) {
      const lastCard = newDiscard[newDiscard.length - 1];
      const toShuffle = newDiscard.slice(0, -1);
      for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
      }
      newDeck = [...newDeck, ...toShuffle];
      newDiscard = [lastCard];
    }
    const drawnCards = newDeck.splice(0, count);
    return { newDeck, newDiscard, drawnCards };
  }

  useEffect(() => {
    if (!roomId || !userId) return;
    const loadRoom = async () => {
      const { data, error } = await supabase.from('match_rooms').select('*').eq('id', roomId).single();
      if (error || !data) { router.push('/multiplayer'); return; }
      setRoom(data);
      const p1 = data.player1_id === userId;
      setIsPlayer1(p1);
      const opponentId = p1 ? data.player2_id : data.player1_id;
      if (opponentId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('pseudo, avatar_url')
          .eq('id', opponentId)
          .single();
        if (profileData) {
          setOpponentName(profileData.pseudo);
          setOpponentAvatar(profileData.avatar_url || `https://i.pravatar.cc/150?u=${opponentId}`);
        }
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

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const newRoom = payload.new;
        setRoom(newRoom);
        setGameState(newRoom.game_state);
        if (newRoom.game_state) {
          const p1 = isPlayer1;
          setIsReady(p1 ? newRoom.game_state.player1_ready : newRoom.game_state.player2_ready);
          setOpponentReady(p1 ? newRoom.game_state.player2_ready : newRoom.game_state.player1_ready);
          setActionLocked(false);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, isPlayer1]);

  const handleReady = async () => {
    if (!room) return;
    setActionLocked(true);
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    const currentState = room.game_state || { status: 'waiting', player1_ready: false, player2_ready: false, message: 'En attente...', player1_hand: [], player2_hand: [], deck: [], discard_pile: [], top_card: null, current_turn: 1, forced_suit: null, pending_draw: 0, winner: null, just_drew: false };
    const updateData = { ...currentState, ...(isPlayer1 ? { player1_ready: newReadyState } : { player2_ready: newReadyState }) };
    const p1Ready = isPlayer1 ? newReadyState : currentState.player1_ready;
    const p2Ready = !isPlayer1 ? newReadyState : currentState.player2_ready;
    if (p1Ready && p2Ready) {
      const deck = createShuffledDeck();
      const p1Hand = deck.splice(0, 7);
      const p2Hand = deck.splice(0, 7);
      const topCard = deck.shift()!;
      
      updateData.status = 'playing';
      updateData.player1_hand = p1Hand;
      updateData.player2_hand = p2Hand;
      updateData.deck = deck;
      updateData.discard_pile = [topCard];
      updateData.top_card = topCard;
      updateData.current_turn = 1;
      updateData.forced_suit = null;
      updateData.pending_draw = 0;
      updateData.winner = null;
      updateData.just_drew = false;
      
      let startMessage = 'La partie commence ! Tour du Joueur 1';
      if (topCard.rank === '7') {
        const player1HasSeven = p1Hand.some(c => c.rank === '7');
        if (player1HasSeven) {
          startMessage = `La partie commence ! Un 7 est retourné. Joueur 1 a un 7 pour contrer !`;
          updateData.pending_draw = 2;
        } else {
          const { newDeck, newDiscard, drawnCards } = drawCardsAutomatic(deck, [topCard], 2);
          p1Hand.push(...drawnCards);
          updateData.player1_hand = p1Hand;
          updateData.deck = newDeck;
          updateData.discard_pile = newDiscard;
          startMessage = `La partie commence ! Un 7 est retourné. Joueur 1 pioche automatiquement 2 cartes !`;
        }
      } else if (topCard.isJoker) {
        const { newDeck, newDiscard, drawnCards } = drawCardsAutomatic(deck, [topCard], 5);
        p1Hand.push(...drawnCards);
        updateData.player1_hand = p1Hand;
        updateData.deck = newDeck;
        updateData.discard_pile = newDiscard;
        startMessage = `La partie commence ! Un Joker est retourné. Joueur 1 pioche automatiquement 5 cartes !`;
      }
      updateData.message = startMessage;
    } else {
      updateData.status = 'waiting';
      updateData.message = 'En attente de l\'adversaire...';
    }
    await supabase.from('match_rooms').update({ game_state: updateData }).eq('id', roomId);
  };

  const handlePlayCard = async (card: GameCard) => {
    if (!gameState || actionLocked) return;
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myId) return;
    const playable = isCardPlayable(card, gameState.top_card, gameState.forced_suit, gameState.pending_draw);
    if (!playable) return;
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

    // Règle du 7 : cumul +2, tour passe à l'adversaire
    if (card.rank === '7') {
      newPendingDraw += 2;
      newMessage = `7 joué ! +${newPendingDraw} cartes à piocher. ${opponentName} doit jouer un 7 ou piocher !`;
      newCurrentTurn = nextTurn;
      
      const newState: GameState = {
        ...gameState,
        ...(isPlayer1 ? { player1_hand: myHand } : { player2_hand: myHand }),
        discard_pile: newDiscard,
        top_card: card,
        current_turn: newCurrentTurn,
        forced_suit: newForcedSuit,
        pending_draw: newPendingDraw,
        winner: gameState.winner,
        status: gameState.status,
        message: newMessage,
        just_drew: false,
      };
      await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
      return;
    }
    
    // Règle du 10 : tour de l'adversaire sauté
    if (card.rank === '10') {
      newMessage = '10 joué ! Tour de l\'adversaire sauté. Vous pouvez rejouer ou passer votre tour.';
      newCurrentTurn = myId;
    }
    
    // Règle du Valet/Joker : choix de couleur
    if (card.rank === 'Jack' || card.isJoker) {
      setPendingCard(card);
      setShowSuitPicker(true);
      const partialState = {
        ...gameState,
        ...(isPlayer1 ? { player1_hand: myHand } : { player2_hand: myHand }),
        discard_pile: newDiscard,
        top_card: card,
        pending_draw: newPendingDraw,
        message: newMessage + ' - Choisis une couleur...',
        just_drew: false,
      };
      await supabase.from('match_rooms').update({ game_state: partialState }).eq('id', roomId);
      return;
    }

    // Victoire
    let winner = gameState.winner;
    let status = gameState.status;
    if (myHand.length === 0) {
      winner = myId;
      status = 'finished';
      newMessage = `🎉 Joueur ${myId} a gagné !`;
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
      just_drew: false,
    };
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  const handleChooseSuit = async (suit: Suit) => {
    if (!gameState || !pendingCard) return;
    setShowSuitPicker(false);
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    const nextTurn: 1 | 2 = myId === 1 ? 2 : 1;
    const myHand = isPlayer1 ? [...gameState.player1_hand] : [...gameState.player2_hand];
    const opponentHand = isPlayer1 ? [...gameState.player2_hand] : [...gameState.player1_hand];
    let newMessage = `Joueur ${myId} choisit ${SUITS_FR[suit]}`;
    let newDeck = gameState.deck;
    let newDiscard = gameState.discard_pile;

    // Règle du Joker : adversaire pioche 5 cartes
    if (pendingCard.isJoker) {
      const drawResult = drawCardsAutomatic(gameState.deck, gameState.discard_pile, 5);
      opponentHand.push(...drawResult.drawnCards);
      newDeck = drawResult.newDeck;
      newDiscard = drawResult.newDiscard;
      newMessage += `. ${opponentName} pioche automatiquement 5 cartes !`;
    }

    const newState: GameState = {
      ...gameState,
      ...(isPlayer1 ? { player1_hand: myHand, player2_hand: opponentHand } : { player1_hand: opponentHand, player2_hand: myHand }),
      deck: newDeck,
      discard_pile: newDiscard,
      forced_suit: suit,
      current_turn: nextTurn,
      pending_draw: 0,
      message: newMessage,
      just_drew: false,
    };
    setPendingCard(null);
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  const handleDraw = async () => {
    if (!gameState || actionLocked) return;
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myId) return;
    setActionLocked(true);
    
    const cardsToDraw = gameState.pending_draw > 0 ? gameState.pending_draw : 1;
    const { newDeck, newDiscard, drawnCards } = drawCardsAutomatic(gameState.deck, gameState.discard_pile, cardsToDraw);
    const myHand = isPlayer1 ? [...gameState.player1_hand] : [...gameState.player2_hand];
    myHand.push(...drawnCards);
    
    // Après pioche, le joueur garde la main
    const newState: GameState = {
      ...gameState,
      ...(isPlayer1 ? { player1_hand: myHand } : { player2_hand: myHand }),
      deck: newDeck,
      discard_pile: newDiscard,
      pending_draw: 0,
      message: `Joueur ${myId} pioche ${cardsToDraw} carte(s). Joue une carte ou passe ton tour.`,
      just_drew: true,
      current_turn: myId,
    };
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  const handlePassTurn = async () => {
    if (!gameState || actionLocked) return;
    const myId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myId) return;
    setActionLocked(true);
    const nextTurn: 1 | 2 = myId === 1 ? 2 : 1;
    const newState: GameState = {
      ...gameState,
      current_turn: nextTurn,
      message: `Joueur ${myId} passe son tour. Au tour du Joueur ${nextTurn} !`,
      just_drew: false,
    };
    await supabase.from('match_rooms').update({ game_state: newState }).eq('id', roomId);
  };

  const handleNewGame = async () => {
    if (!room) return;
    setActionLocked(true);
    const deck = createShuffledDeck();
    const p1Hand = deck.splice(0, 7);
    const p2Hand = deck.splice(0, 7);
    const topCard = deck.shift()!;
    let startMessage = 'Nouvelle partie ! Tour du Joueur 1';
    let pendingDraw = 0;
    let currentDeck = deck;
    if (topCard.rank === '7') {
      const player1HasSeven = p1Hand.some(c => c.rank === '7');
      if (player1HasSeven) {
        startMessage = `Nouvelle partie ! Un 7 est retourné. Joueur 1 a un 7 pour contrer !`;
        pendingDraw = 2;
      } else {
        const { newDeck, newDiscard, drawnCards } = drawCardsAutomatic(deck, [topCard], 2);
        p1Hand.push(...drawnCards);
        startMessage = `Nouvelle partie ! Un 7 est retourné. Joueur 1 pioche automatiquement 2 cartes !`;
        currentDeck = newDeck;
      }
    } else if (topCard.isJoker) {
      const { newDeck, newDiscard, drawnCards } = drawCardsAutomatic(deck, [topCard], 5);
      p1Hand.push(...drawnCards);
      startMessage = `Nouvelle partie ! Un Joker est retourné. Joueur 1 pioche automatiquement 5 cartes !`;
      currentDeck = newDeck;
    }
    const newState: GameState = {
      status: 'playing',
      player1_ready: true,
      player2_ready: true,
      current_turn: 1,
      player1_hand: p1Hand,
      player2_hand: p2Hand,
      deck: currentDeck,
      discard_pile: [topCard],
      top_card: topCard,
      forced_suit: null,
      pending_draw: pendingDraw,
      winner: null,
      message: startMessage,
      just_drew: false,
    };
    await supabase.from('match_rooms').update({ game_state: newState, status: 'playing', winner_id: null }).eq('id', roomId);
  };

  const handleQuit = () => { router.push('/menu'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]"><Loader2 className="w-12 h-12 text-yellow-400 animate-spin" /></div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]"><p className="text-white text-xl font-bold">Salle introuvable</p></div>;

  const myId: 1 | 2 = isPlayer1 ? 1 : 2;
  const myHand = gameState ? (isPlayer1 ? gameState.player1_hand : gameState.player2_hand) : [];
  const opponentHand = gameState ? (isPlayer1 ? gameState.player2_hand : gameState.player1_hand) : [];
  const isMyTurn = gameState?.current_turn === myId && gameState?.status === 'playing';
  const justDrew = gameState?.just_drew && isMyTurn;

  // ✅ MESSAGES CLAIRS SELON LA SITUATION
  const getInstructionMessage = () => {
    if (!isMyTurn) return "Attends ton tour...";
    if (gameState?.pending_draw && gameState.pending_draw > 0) {
      const hasSeven = myHand.some(c => c.rank === '7');
      if (hasSeven) return `Joue un 7 ou pioche ${gameState.pending_draw} cartes`;
      return `Pioche ${gameState.pending_draw} cartes`;
    }
    // ✅ Quand une couleur est imposée, on indique les deux options
    if (gameState?.forced_suit) {
      return `Joue ${SUITS_FR[gameState.forced_suit]} ou un même rang`;
    }
    if (justDrew) return "Joue une carte ou passe ton tour";
    return "Joue une carte ou pioche";
  };

  const canPassTurn = isMyTurn && (gameState?.message?.includes('Tour de l\'adversaire sauté') || justDrew);

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-4">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400"><ArrowLeft className="w-5 h-5" /> Quitter</Link>
          <h1 className="text-xl md:text-2xl font-black text-yellow-400">⚔️ MULTIJOUER</h1>
          <div className="w-20"></div>
        </div>
        
        {!gameState || gameState.status === 'waiting' ? (
          <div className="bg-white/95 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${isReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-gray-200 mb-3">
                  <img src={playerAvatar} alt={profile?.pseudo || 'Toi'} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-gray-800">{profile?.pseudo || 'Toi'}</p>
                <p className="text-sm text-gray-500 mb-3">{isReady ? '✅ Prêt' : '❌ Pas prêt'}</p>
                <Button onClick={handleReady} className={isReady ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}>{isReady ? 'Annuler' : 'Je suis prêt !'}</Button>
              </div>
              <div className="text-4xl font-black text-yellow-500">VS</div>
              <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${opponentReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-gray-200 mb-3">
                  <img src={opponentAvatar} alt={opponentName} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-gray-800">{opponentName}</p>
                <p className="text-sm text-gray-500 mb-3">{opponentReady ? '✅ Prêt' : '⏳ En attente...'}</p>
                <div className="w-32 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-bold">{opponentReady ? 'Prêt' : 'Attente'}</div>
              </div>
            </div>
          </div>
        ) : gameState.status === 'finished' ? (
          <div className="bg-white/95 rounded-2xl p-8 shadow-2xl border-2 border-yellow-400 text-center">
            <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-black mb-4">{gameState.winner === myId ? '🎉 Tu as gagné !' : ' Tu as perdu...'}</h2>
            <p className="text-gray-600 mb-6">Vainqueur : Joueur {gameState.winner}</p>
            <div className="space-y-3 max-w-md mx-auto">
              <Button onClick={handleNewGame} className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-4 border-yellow-800 py-6 text-lg w-full"><Sparkles className="w-5 h-5 mr-2" /> Nouvelle partie</Button>
              <Button onClick={handleQuit} variant="outline" className="w-full py-6 text-lg font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"><Home className="w-5 h-5 mr-2" /> Retour au menu</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg bg-gray-200 flex-shrink-0">
                    <img src={opponentAvatar} alt={opponentName} className="w-full h-full object-cover" />
                  </div>
                  <div><p className="text-white font-bold text-sm">{opponentName}</p><p className="text-yellow-400 text-xs">{opponentHand.length} cartes</p></div>
                </div>
                {gameState.current_turn !== myId && <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">Son tour</span>}
              </div>
              <div className="flex justify-center gap-1 flex-wrap">{opponentHand.map((card, i) => <PlayingCard key={card.id || i} isFaceDown className="w-12 h-16 md:w-16 md:h-24" />)}</div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50 min-h-[180px] flex items-center justify-center gap-8">
              <div className="flex flex-col items-center"><p className="text-white text-xs font-bold mb-2">DÉFAUSSE</p>{gameState.top_card ? <PlayingCard card={gameState.top_card} className="w-20 h-28 md:w-24 md:h-32" /> : <div className="w-20 h-28 md:w-24 md:h-32 bg-gray-700 rounded-xl border-2 border-gray-500"></div>}</div>
              <div className="flex flex-col items-center"><p className="text-white text-xs font-bold mb-2">PIOCHE ({gameState.deck.length})</p><button onClick={handleDraw} disabled={!isMyTurn || justDrew} className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105"><PlayingCard isFaceDown className="w-20 h-28 md:w-24 md:h-32" /></button></div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg bg-gray-200 flex-shrink-0">
                    <img src={playerAvatar} alt={profile?.pseudo || 'Toi'} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-base truncate">{profile?.pseudo || 'Toi'}</p>
                    <p className="text-yellow-400 text-sm font-semibold">{myHand.length} cartes</p>
                    <div className="mt-2 bg-gray-700/90 border border-gray-500 rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-white text-sm font-bold">{getInstructionMessage()}</p>
                    </div>
                    {canPassTurn && (
                      <Button 
                        onClick={handlePassTurn}
                        className="mt-2 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold border-b-4 border-orange-800 py-2 px-4 text-sm"
                      >
                        <SkipForward className="w-4 h-4 mr-2" /> Passer mon tour
                      </Button>
                    )}
                  </div>
                </div>
                {isMyTurn && <span className="bg-green-400 text-black text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex-shrink-0">Ton tour !</span>}
              </div>
              
              <div className="flex justify-center gap-1 flex-wrap mb-3">
                {myHand.map((card) => {
                  const playable = isMyTurn && isCardPlayable(card, gameState.top_card, gameState.forced_suit, gameState.pending_draw);
                  return <PlayingCard key={card.id} card={card} isPlayable={playable} onPlay={handlePlayCard} className="w-14 h-20 md:w-20 md:h-28" />;
                })}
              </div>
            </div>
          </div>
        )}
        
        {showSuitPicker && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-center mb-4">Choisis une couleur</h3>
              <p className="text-sm text-gray-600 text-center mb-4">{pendingCard?.isJoker ? "L'adversaire recevra 5 cartes !" : "L'adversaire devra jouer cette couleur !"}</p>
              <div className="grid grid-cols-2 gap-3">{(['Hearts', 'Diamonds', 'Clubs', 'Spades'] as Suit[]).map((suit) => { const count = myHand.filter(card => card.suit === suit).length; return (<button key={suit} onClick={() => handleChooseSuit(suit)} className={`p-4 rounded-xl font-bold text-white border-4 transition-transform hover:scale-105 relative ${suit === 'Hearts' ? 'bg-red-500 border-red-700' : suit === 'Diamonds' ? 'bg-blue-500 border-blue-700' : suit === 'Clubs' ? 'bg-green-600 border-green-800' : 'bg-gray-800 border-gray-900'}`}><div className="text-lg">{SUITS_FR[suit]}</div><div className="text-sm mt-1 opacity-90">{count} carte{count !== 1 ? 's' : ''}</div></button>); })}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}