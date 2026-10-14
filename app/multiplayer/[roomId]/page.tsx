'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PlayingCard } from '@/components/game/PlayingCard';
import {
  MultiplayerGameState,
  createMultiplayerGameState,
  applyPlayCard,
  applyDrawCard,
  applyChooseSuit,
  isCardPlayable,
} from '@/lib/multiplayer-game';
import { Suit, SUITS_FR } from '@/lib/game-types';

export default function MultiplayerRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string;
  const { profile, userId } = useAuth();
  
  const [room, setRoom] = useState<any>(null);
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingSuitCardId, setPendingSuitCardId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState('Adversaire');

  // 1. Charger la salle
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
      
      // Récupérer le pseudo de l'adversaire
      const opponentId = p1 ? data.player2_id : data.player1_id;
      if (opponentId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('pseudo')
          .eq('id', opponentId)
          .single();
        if (profileData) setOpponentName(profileData.pseudo);
      }
      
      // Charger ou créer l'état du jeu
      if (data.game_state) {
        setGameState(data.game_state);
        if (p1) {
          setIsReady(data.game_state.player1_ready || false);
          setOpponentReady(data.game_state.player2_ready || false);
        } else {
          setIsReady(data.game_state.player2_ready || false);
          setOpponentReady(data.game_state.player1_ready || false);
        }
      } else {
        const newState = createMultiplayerGameState();
        setGameState(newState);
        await supabase
          .from('match_rooms')
          .update({ game_state: newState })
          .eq('id', roomId);
      }
      
      setLoading(false);
    };

    loadRoom();
  }, [roomId, userId, router]);

  // 2. Écouter les changements en temps réel
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
            setGameState(newRoom.game_state);
            if (isPlayer1) {
              setIsReady(newRoom.game_state.player1_ready || false);
              setOpponentReady(newRoom.game_state.player2_ready || false);
            } else {
              setIsReady(newRoom.game_state.player2_ready || false);
              setOpponentReady(newRoom.game_state.player1_ready || false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isPlayer1]);

  // 3. Gérer le bouton "Prêt"
  const handleReady = async () => {
    if (!room || !gameState) return;

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    const updateData = {
      ...gameState,
      ...(isPlayer1 ? { player1_ready: newReadyState } : { player2_ready: newReadyState }),
    };

    const p1Ready = isPlayer1 ? newReadyState : gameState.player1_ready;
    const p2Ready = !isPlayer1 ? newReadyState : gameState.player2_ready;

    if (p1Ready && p2Ready) {
      updateData.status = 'playing';
      updateData.message = 'La partie commence ! Tour du Joueur 1';
    } else {
      updateData.status = 'waiting';
      updateData.message = 'En attente de l\'adversaire...';
    }

    await supabase
      .from('match_rooms')
      .update({ game_state: updateData })
      .eq('id', roomId);
  };

  // 4. Jouer une carte
  const handlePlayCard = async (cardId: string) => {
    if (!gameState || !isPlayer1 && gameState.current_turn !== 2 && !isPlayer1) return;
    
    const myPlayerId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myPlayerId) return;
    
    const hand = isPlayer1 ? gameState.player1_hand : gameState.player2_hand;
    const card = hand.find(c => c.id === cardId);
    if (!card) return;
    
    // Si Joker ou Valet, demander la couleur d'abord
    if (card.isJoker || card.rank === 'Jack') {
      setPendingSuitCardId(cardId);
      setShowSuitPicker(true);
      return;
    }
    
    const newState = applyPlayCard(gameState, myPlayerId, cardId);
    await supabase
      .from('match_rooms')
      .update({ game_state: newState })
      .eq('id', roomId);
  };

  // 5. Choisir une couleur
  const handleChooseSuit = async (suit: Suit) => {
    if (!gameState || !pendingSuitCardId) return;
    
    const myPlayerId: 1 | 2 = isPlayer1 ? 1 : 2;
    const newStateAfterPlay = applyPlayCard(gameState, myPlayerId, pendingSuitCardId);
    const newState = applyChooseSuit(newStateAfterPlay, myPlayerId, suit);
    
    setShowSuitPicker(false);
    setPendingSuitCardId(null);
    
    await supabase
      .from('match_rooms')
      .update({ game_state: newState })
      .eq('id', roomId);
  };

  // 6. Piocher
  const handleDraw = async () => {
    if (!gameState) return;
    const myPlayerId: 1 | 2 = isPlayer1 ? 1 : 2;
    if (gameState.current_turn !== myPlayerId) return;
    
    const newState = applyDrawCard(gameState, myPlayerId);
    await supabase
      .from('match_rooms')
      .update({ game_state: newState })
      .eq('id', roomId);
  };

  // 7. Nouvelle partie
  const handleNewGame = async () => {
    const newState = createMultiplayerGameState();
    newState.status = 'playing';
    newState.player1_ready = true;
    newState.player2_ready = true;
    newState.message = 'Nouvelle partie ! Tour du Joueur 1';
    
    await supabase
      .from('match_rooms')
      .update({ 
        game_state: newState,
        status: 'playing',
        winner_id: null,
      })
      .eq('id', roomId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-xl font-bold">Chargement...</p>
      </div>
    );
  }

  const myPlayerId: 1 | 2 = isPlayer1 ? 1 : 2;
  const myHand = isPlayer1 ? gameState.player1_hand : gameState.player2_hand;
  const opponentHand = isPlayer1 ? gameState.player2_hand : gameState.player1_hand;
  const isMyTurn = gameState.current_turn === myPlayerId && gameState.status === 'playing';

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4 pt-4">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400">
            <ArrowLeft className="w-5 h-5" /> Quitter
          </Link>
          <h1 className="text-xl md:text-2xl font-black text-yellow-400">
            ⚔️ MULTIJOUER
          </h1>
          <div className="w-20"></div>
        </div>

        {/* Message du jeu */}
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 mb-4 text-center border-2 border-yellow-400/50">
          <p className="text-white font-bold text-sm md:text-base">{gameState.message}</p>
          {gameState.forced_suit && (
            <p className="text-yellow-400 text-xs mt-1">
              Couleur imposée : {SUITS_FR[gameState.forced_suit]}
            </p>
          )}
        </div>

        {gameState.status === 'waiting' ? (
          /* Écran d'attente */
          <div className="bg-white/95 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Moi */}
              <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${isReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white shadow-lg">
                  {profile?.pseudo?.charAt(0).toUpperCase() || '?'}
                </div>
                <p className="font-bold text-gray-800">{profile?.pseudo || 'Toi'}</p>
                <p className="text-sm text-gray-500 mb-3">{isReady ? '✅ Prêt' : '❌ Pas prêt'}</p>
                <Button onClick={handleReady} className={isReady ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}>
                  {isReady ? 'Annuler' : 'Je suis prêt !'}
                </Button>
              </div>

              <div className="text-4xl font-black text-yellow-500">VS</div>

              {/* Adversaire */}
              <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${opponentReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white shadow-lg">
                  <Users className="w-10 h-10" />
                </div>
                <p className="font-bold text-gray-800">{opponentName}</p>
                <p className="text-sm text-gray-500 mb-3">{opponentReady ? '✅ Prêt' : ' En attente...'}</p>
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
              {gameState.winner === myPlayerId ? '🎉 Tu as gagné !' : '😢 Tu as perdu...'}
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
            {/* Main de l'adversaire (face cachée) */}
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
                {gameState.current_turn === (isPlayer1 ? 2 : 1) && (
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    Son tour
                  </span>
                )}
              </div>
              <div className="flex justify-center gap-1 flex-wrap">
                {opponentHand.map((card, index) => (
                  <PlayingCard key={card.id || index} isFaceDown className="w-12 h-16 md:w-16 md:h-24" />
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
                  className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  const playable = isMyTurn && isCardPlayable(card, gameState.top_card, gameState.forced_suit, gameState.pending_draw);
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-center mb-4">Choisis une couleur</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['Hearts', 'Diamonds', 'Clubs', 'Spades'] as Suit[]).map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleChooseSuit(suit)}
                    className={`p-4 rounded-xl font-bold text-white border-4 ${
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