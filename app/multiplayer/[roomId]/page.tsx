'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { PlayingCard } from '@/components/game/PlayingCard';
import { GameCard } from '@/lib/game-types';

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
  const [gameStarted, setGameStarted] = useState(false);
  const [myHand, setMyHand] = useState<GameCard[]>([]);
  const [opponentHandCount, setOpponentHandCount] = useState(0);
  const [topCard, setTopCard] = useState<GameCard | null>(null);
  const [deckCount, setDeckCount] = useState(0);
  const [message, setMessage] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);

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
      
      // Charger l'état du jeu
      if (data.game_state) {
        const state = data.game_state;
        if (p1) {
          setMyHand(state.player1_hand || []);
          setOpponentHandCount(state.player2_hand?.length || 0);
        } else {
          setMyHand(state.player2_hand || []);
          setOpponentHandCount(state.player1_hand?.length || 0);
        }
        setTopCard(state.top_card || null);
        setDeckCount(state.deck?.length || 0);
        setMessage(state.message || '');
        setIsMyTurn(state.current_turn === (p1 ? 1 : 2) && state.status === 'playing');
        setGameStarted(state.status === 'playing');
        setIsReady(p1 ? state.player1_ready : state.player2_ready);
        setOpponentReady(p1 ? state.player2_ready : state.player1_ready);
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
          
          if (newRoom.game_state) {
            const state = newRoom.game_state;
            if (isPlayer1) {
              setMyHand(state.player1_hand || []);
              setOpponentHandCount(state.player2_hand?.length || 0);
              setIsReady(state.player1_ready || false);
              setOpponentReady(state.player2_ready || false);
            } else {
              setMyHand(state.player2_hand || []);
              setOpponentHandCount(state.player1_hand?.length || 0);
              setIsReady(state.player2_ready || false);
              setOpponentReady(state.player1_ready || false);
            }
            setTopCard(state.top_card || null);
            setDeckCount(state.deck?.length || 0);
            setMessage(state.message || '');
            setIsMyTurn(state.current_turn === (isPlayer1 ? 1 : 2) && state.status === 'playing');
            if (state.status === 'playing') setGameStarted(true);
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

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    const currentState = room.game_state || {
      status: 'waiting',
      player1_ready: false,
      player2_ready: false,
      message: 'En attente des joueurs...',
      player1_hand: [],
      player2_hand: [],
      deck: [],
      discard_pile: [],
      top_card: null,
      current_turn: 1,
    };

    const updateData = {
      ...currentState,
      ...(isPlayer1 ? { player1_ready: newReadyState } : { player2_ready: newReadyState }),
    };

    const p1Ready = isPlayer1 ? newReadyState : currentState.player1_ready;
    const p2Ready = !isPlayer1 ? newReadyState : currentState.player2_ready;

    if (p1Ready && p2Ready) {
      // Distribuer les cartes au démarrage
      const deck = createShuffledDeck();
      const p1Hand = deck.splice(0, 7);
      const p2Hand = deck.splice(0, 7);
      const topCard = deck.shift();
      
      updateData.status = 'playing';
      updateData.message = 'La partie commence ! Tour du Joueur 1';
      updateData.player1_hand = p1Hand;
      updateData.player2_hand = p2Hand;
      updateData.deck = deck;
      updateData.discard_pile = topCard ? [topCard] : [];
      updateData.top_card = topCard;
      updateData.current_turn = 1;
    } else {
      updateData.status = 'waiting';
      updateData.message = 'En attente de l\'adversaire...';
    }

    await supabase
      .from('match_rooms')
      .update({ game_state: updateData })
      .eq('id', roomId);
  };

  // Créer un deck mélangé
  function createShuffledDeck(): GameCard[] {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
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
    
    // Mélanger
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

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
          <p className="text-white font-bold text-sm md:text-base">{message}</p>
        </div>

        {!gameStarted ? (
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
        ) : (
          /* Plateau de jeu */
          <div className="space-y-4">
            {/* Main adverse (face cachée) */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold border-2 border-white">
                    {opponentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{opponentName}</p>
                    <p className="text-yellow-400 text-xs">{opponentHandCount} cartes</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-1 flex-wrap">
                {Array.from({ length: opponentHandCount }).map((_, i) => (
                  <PlayingCard key={i} isFaceDown className="w-12 h-16 md:w-16 md:h-24" />
                ))}
              </div>
            </div>

            {/* Zone centrale */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50 min-h-[180px] flex items-center justify-center gap-8">
              <div className="flex flex-col items-center">
                <p className="text-white text-xs font-bold mb-2">DÉFAUSSE</p>
                {topCard ? (
                  <PlayingCard card={topCard} className="w-20 h-28 md:w-24 md:h-32" />
                ) : (
                  <div className="w-20 h-28 md:w-24 md:h-32 bg-gray-700 rounded-xl border-2 border-gray-500"></div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <p className="text-white text-xs font-bold mb-2">PIOCHE ({deckCount})</p>
                <PlayingCard isFaceDown className="w-20 h-28 md:w-24 md:h-32" />
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
                {myHand.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    className="w-14 h-20 md:w-20 md:h-28"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}