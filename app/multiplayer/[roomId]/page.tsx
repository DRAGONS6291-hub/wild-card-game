'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Loader2, Sword } from 'lucide-react';
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

  // 1. Charger les infos de la salle au démarrage
  useEffect(() => {
    if (!roomId || !userId) return;

    const loadRoom = async () => {
      const { data, error } = await supabase
        .from('match_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !data) {
        console.error('Salle introuvable');
        router.push('/multiplayer');
        return;
      }

      setRoom(data);
      setIsPlayer1(data.player1_id === userId);
      setLoading(false);
    };

    loadRoom();
  }, [roomId, userId, router]);

  // 2. Écouter les changements en temps réel (Realtime)
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
          
          // Vérifier si l'adversaire est prêt (via le game_state)
          if (newRoom.game_state) {
            const state = newRoom.game_state;
            if (isPlayer1) {
              setOpponentReady(state.player2_ready || false);
            } else {
              setOpponentReady(state.player1_ready || false);
            }

            // Si les deux sont prêts, on pourrait lancer le jeu ici
            if (state.status === 'playing') {
              // TODO: Rediriger vers l'interface de jeu réelle
              console.log('La partie commence !');
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
    if (!room || !userId) return;

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    // Mettre à jour l'état du jeu dans la base de données
    const currentState = room.game_state || {};
    const updateData = isPlayer1 
      ? { ...currentState, player1_ready: newReadyState }
      : { ...currentState, player2_ready: newReadyState };

    // Si les deux sont prêts, on passe en mode "playing"
    const player1Ready = isPlayer1 ? newReadyState : currentState.player1_ready;
    const player2Ready = !isPlayer1 ? newReadyState : currentState.player2_ready;

    if (player1Ready && player2Ready) {
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

  const opponentName = isPlayer1 ? 'Joueur 2' : (room.player1_pseudo || 'Joueur 1'); // On affichera le vrai pseudo plus tard

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto pt-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/multiplayer" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Quitter
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-yellow-400" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
            SALLE DE JEU
          </h1>
          <div className="w-20"></div>
        </div>

        {/* Contenu de la salle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-yellow-400 text-center space-y-8">
          
          {/* Statut de la partie */}
          <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
            <p className="text-lg font-bold text-gray-800">
              {room.game_state?.status === 'playing' ? '🎮 La partie est en cours !' : '⏳ En attente des joueurs...'}
            </p>
          </div>

          {/* Les 2 joueurs */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Toi */}
            <div className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${isReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white shadow-lg">
                {profile?.pseudo?.charAt(0).toUpperCase() || 'J1'}
              </div>
              <p className="font-bold text-gray-800">{profile?.pseudo || 'Toi'}</p>
              <p className="text-sm text-gray-500 mb-3">{isReady ? '✅ Prêt' : '❌ Pas prêt'}</p>
              <Button 
                onClick={handleReady}
                className={isReady ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-500 hover:bg-green-600'}
              >
                {isReady ? 'Annuler' : 'Je suis prêt !'}
              </Button>
            </div>

            {/* VS */}
            <div className="text-4xl font-black text-yellow-500" style={{ WebkitTextStroke: '1px #9A3412' }}>VS</div>

            {/* Adversaire */}
            <div className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${opponentReady ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300'}`}>
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-bold mb-3 border-4 border-white shadow-lg animate-pulse">
                <Users className="w-10 h-10" />
              </div>
              <p className="font-bold text-gray-800">Adversaire</p>
              <p className="text-sm text-gray-500 mb-3">{opponentReady ? '✅ Prêt' : '⏳ En attente...'}</p>
              <div className="w-32 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-bold">
                {opponentReady ? 'Prêt' : 'Attente'}
              </div>
            </div>
          </div>

          {/* Message d'info */}
          {room.game_state?.status === 'playing' && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 animate-pulse">
              <p className="text-yellow-800 font-bold text-lg">
                🚀 Redirection vers le plateau de jeu... (Bientôt disponible)
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => router.push('/menu')}
            className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50"
          >
            Quitter la salle
          </Button>
        </div>
      </div>
    </div>
  );
}