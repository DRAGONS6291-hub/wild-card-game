'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Sword, Loader2, Trophy, X } from 'lucide-react';
import Link from 'next/link';

export default function MultiplayerPage() {
  const router = useRouter();
  const { profile, userId } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [matchedPlayer, setMatchedPlayer] = useState<any>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Timer pour afficher le temps de recherche
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Écouter les changements dans la file d'attente
  useEffect(() => {
    if (!userId || !isSearching) return;

    // S'abonner aux changements de la file
    const channel = supabase
      .channel('matchmaking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matchmaking_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          
          if (newStatus === 'matched') {
            // Match trouvé !
            setMatchedPlayer(payload.new.matched_with);
            setRoomId(payload.new.room_id);
            setIsSearching(false);
            setSearchTime(0);
            
            // Rediriger vers la salle après 2 secondes
            setTimeout(() => {
              if (payload.new.room_id) {
                router.push(`/multiplayer/${payload.new.room_id}`);
              }
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isSearching, router]);

  // Fonction pour rejoindre la file d'attente
  const handleSearch = async () => {
    if (!userId || !profile) return;

    setIsSearching(true);
    setSearchTime(0);
    setMatchedPlayer(null);
    setRoomId(null);

    try {
      // Ajouter à la file d'attente
      const { error } = await supabase
        .from('matchmaking_queue')
        .upsert({
          user_id: userId,
          level: profile.level || 1,
          status: 'searching',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erreur ajout à la file:', error);
        setIsSearching(false);
        return;
      }

      // Lancer le processus de matching côté client
      await findMatch();
    } catch (error) {
      console.error('Erreur recherche:', error);
      setIsSearching(false);
    }
  };

  // Fonction pour trouver un match
  const findMatch = async () => {
    if (!userId || !profile) return;

    const userLevel = profile.level || 1;
    let levelRange = 2; // Chercher des joueurs de niveau ±2
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Chercher un adversaire disponible
      const { data: opponent, error } = await supabase
        .from('matchmaking_queue')
        .select('user_id, level')
        .eq('status', 'searching')
        .neq('user_id', userId)
        .gte('level', userLevel - levelRange)
        .lte('level', userLevel + levelRange)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !opponent) {
        // Pas trouvé, attendre 2 secondes et réessayer avec un range plus large
        await new Promise((resolve) => setTimeout(resolve, 2000));
        levelRange = Math.min(levelRange + 2, 10); // Max ±10 niveaux
        continue;
      }

      // Match trouvé ! Créer la salle
      await createMatchRoom(opponent.user_id);
      return;
    }

    // Si pas trouvé après plusieurs tentatives, élargir encore
    await findMatchWithWiderRange();
  };

  const findMatchWithWiderRange = async () => {
    if (!userId) return;

    // Prendre le premier joueur disponible peu importe le niveau
    const { data: opponent } = await supabase
      .from('matchmaking_queue')
      .select('user_id')
      .eq('status', 'searching')
      .neq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (opponent) {
      await createMatchRoom(opponent.user_id);
    } else {
      // Personne d'autre, annuler la recherche après 60s
      setIsSearching(false);
    }
  };

  const createMatchRoom = async (opponentId: string) => {
    if (!userId) return;

    // Créer la salle de match
    const { data: room, error: roomError } = await supabase
      .from('match_rooms')
      .insert({
        player1_id: userId,
        player2_id: opponentId,
        status: 'waiting',
      })
      .select()
      .single();

    if (roomError || !room) {
      console.error('Erreur création salle:', roomError);
      return;
    }

    // Mettre à jour les 2 joueurs dans la file
    await supabase
      .from('matchmaking_queue')
      .update({
        status: 'matched',
        matched_with: opponentId,
        room_id: room.id,
        matched_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    await supabase
      .from('matchmaking_queue')
      .update({
        status: 'matched',
        matched_with: userId,
        room_id: room.id,
        matched_at: new Date().toISOString(),
      })
      .eq('user_id', opponentId);
  };

  // Annuler la recherche
  const handleCancel = async () => {
    if (!userId) return;

    await supabase
      .from('matchmaking_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);

    setIsSearching(false);
    setSearchTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto pt-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/menu" 
            className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Retour
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-yellow-400" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
            MULTIJOUER
          </h1>
          <div className="w-20"></div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-yellow-400">
          {!isSearching && !matchedPlayer ? (
            /* Écran initial - Bouton rechercher */
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-full shadow-2xl">
                  <Sword className="w-16 h-16 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800">
                Rechercher un adversaire
              </h2>

              <p className="text-gray-600">
                Trouve un joueur en ligne et affronte-le en temps réel !
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>Appariement basé sur ton niveau</span>
              </div>

              <Button
                onClick={handleSearch}
                className="w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black border-b-4 border-green-800 shadow-lg text-xl py-6"
              >
                <Sword className="w-6 h-6 mr-2" />
                Rechercher un adversaire
              </Button>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">Ou crée une salle privée</p>
                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:bg-gray-100"
                >
                  Créer une salle privée
                </Button>
              </div>
            </div>
          ) : isSearching ? (
            /* Animation de recherche style Clash of Clan */
            <div className="text-center space-y-6 py-8">
              <div className="relative">
                {/* Cercle animé */}
                <div className="w-32 h-32 mx-auto relative">
                  <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 border-4 border-yellow-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sword className="w-12 h-12 text-yellow-600 animate-bounce" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Recherche d'un adversaire...
                </h2>
                <p className="text-gray-600">
                  Temps écoulé : <span className="font-bold text-yellow-600">{formatTime(searchTime)}</span>
                </p>
              </div>

              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">Recherche de joueurs disponibles...</span>
                </div>
              </div>

              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler la recherche
              </Button>
            </div>
          ) : (
            /* Match trouvé ! */
            <div className="text-center space-y-6 py-8">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-full shadow-2xl mx-auto w-32 h-32 flex items-center justify-center animate-bounce">
                <Trophy className="w-16 h-16 text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-green-600 mb-2">
                  Match trouvé ! 
                </h2>
                <p className="text-gray-600">
                  Redirection vers la salle de jeu...
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-400">
                <p className="text-green-800 font-semibold">
                  Préparation de la partie...
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="text-gray-600 font-semibold">Chargement...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}