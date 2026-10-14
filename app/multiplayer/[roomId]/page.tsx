'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Trophy } from 'lucide-react';
import Link from 'next/link';

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
        console.error('Salle introuvable:', error);
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
              setIsReady(state.player1_ready || false);
              setOpponentReady(state.player2_ready || false);
              if (state.status === 'playing') setGameStarted(true);
            } else {
              setIsReady(state.player2_ready || false);
              setOpponentReady(state.player1_ready || false);
              if (state.status === 'playing') setGameStarted(true);
            }
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

    // Récupérer l'état actuel ou créer un nouveau
    const currentState = room.game_state || {
      status: 'waiting',
      player1_ready: false,
      player2_ready: false,
      message: 'En attente des joueurs...',
    };

    const updateData = {
      ...currentState,
      ...(isPlayer1 ? { player1_ready: newReadyState } : { player2_ready: newReadyState }),
    };

    const p1Ready = isPlayer1 ? newReadyState : currentState.player1_ready;
    const p2Ready = !isPlayer1 ? newReadyState : currentState.player2_ready;

    if (p1Ready && p2Ready) {
      updateData.status = 'playing';
      updateData.message = 'La partie commence !';
    } else {
      updateData.status = 'waiting';
      updateData.message = 'En attente de l\'adversaire...';
    }

    await supabase
      .from('match_rooms')
      .update({ game_state: updateData })
      .eq('id', roomId);
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

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400">
            <ArrowLeft className="w-5 h-5" /> Quitter
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-yellow-400">
            SALLE DE JEU
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="bg-white/95 rounded-2xl p-6 shadow-2xl border-2 border-yellow-400 text-center space-y-8">
          
          {!gameStarted ? (
            <>
              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-lg font-bold text-gray-800">
                  ⏳ En attente des joueurs...
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${isReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white">
                    {profile?.pseudo?.charAt(0).toUpperCase() || 'J1'}
                  </div>
                  <p className="font-bold text-gray-800">{profile?.pseudo || 'Toi'}</p>
                  <p className="text-sm text-gray-500 mb-3">{isReady ? '✅ Prêt' : '❌ Pas prêt'}</p>
                  <Button 
                    onClick={handleReady}
                    className={isReady ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}
                  >
                    {isReady ? 'Annuler' : 'Je suis prêt !'}
                  </Button>
                </div>

                <div className="text-4xl font-black text-yellow-500">VS</div>

                <div className={`flex flex-col items-center p-6 rounded-xl border-2 ${opponentReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white">
                    <Users className="w-10 h-10" />
                  </div>
                  <p className="font-bold text-gray-800">{opponentName}</p>
                  <p className="text-sm text-gray-500 mb-3">{opponentReady ? '✅ Prêt' : ' En attente...'}</p>
                  <div className="w-32 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-bold">
                    {opponentReady ? 'Prêt' : 'Attente'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Écran de jeu simplifié */
            <div className="space-y-6">
              <div className="bg-green-100 border-2 border-green-400 rounded-xl p-6">
                <Trophy className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h2 className="text-2xl font-black text-green-800 mb-2">
                  🎮 La partie commence !
                </h2>
                <p className="text-gray-600 mb-4">
                  Toi ({profile?.pseudo}) VS {opponentName}
                </p>
                <p className="text-sm text-gray-500">
                  Le vrai plateau de jeu sera ajouté prochainement.
                  <br />
                  Pour l'instant, le multijoueur temps réel fonctionne ! ✅
                </p>
              </div>

              <Button
                onClick={() => router.push('/menu')}
                variant="outline"
                className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50"
              >
                Retour au menu
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}