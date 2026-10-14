'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sword, Loader2, Trophy, X, Users } from 'lucide-react';
import Link from 'next/link';

export default function MultiplayerPage() {
  const router = useRouter();
  const { profile, userId } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && !matchFound) {
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching, matchFound]);

  // Écouter Realtime pour être redirigé quand le match est trouvé
  useEffect(() => {
    if (!userId || !isSearching || matchFound) return;

    const channel = supabase
      .channel('matchmaking-listener')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matchmaking_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Realtime reçu:', payload.new);
          
          if (payload.new.status === 'matched' && payload.new.room_id) {
            setMatchFound(true);
            setIsSearching(false);
            setStatusMessage('Adversaire trouvé ! Redirection...');
            
            setTimeout(() => {
              router.push(`/multiplayer/${payload.new.room_id}`);
            }, 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isSearching, matchFound, router]);

  // Lancer la recherche
  const handleSearch = async () => {
    if (!userId || !profile) return;

    setIsSearching(true);
    setMatchFound(false);
    setSearchTime(0);
    setStatusMessage('Recherche d\'un adversaire...');

    // S'ajouter à la file d'attente
    // Le trigger SQL va automatiquement chercher un adversaire
    const { error } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: userId,
        level: profile.level || 1,
        status: 'searching',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Erreur ajout file:', error);
      setStatusMessage('Erreur: ' + error.message);
      setIsSearching(false);
    }
  };

  // Annuler
  const handleCancel = async () => {
    if (!userId) return;
    
    await supabase
      .from('matchmaking_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);
    
    setIsSearching(false);
    setMatchFound(false);
    setSearchTime(0);
    setStatusMessage('');
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
        <div className="flex items-center justify-between mb-8">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Retour
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-yellow-400" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
            MULTIJOUER
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-yellow-400">
          {!isSearching && !matchFound ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-full shadow-2xl">
                  <Sword className="w-16 h-16 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Rechercher un adversaire</h2>
              <p className="text-gray-600">Trouve un joueur en ligne et affronte-le en temps réel !</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>Niveau actuel : <strong>{profile?.level || 1}</strong></span>
              </div>
              <Button
                onClick={handleSearch}
                className="w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black border-b-4 border-green-800 shadow-lg text-xl py-6"
              >
                <Sword className="w-6 h-6 mr-2" />
                Rechercher un adversaire
              </Button>
            </div>
          ) : isSearching && !matchFound ? (
            <div className="text-center space-y-6 py-8">
              <div className="relative">
                <div className="w-32 h-32 mx-auto relative">
                  <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 border-4 border-yellow-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sword className="w-12 h-12 text-yellow-600 animate-bounce" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Recherche d'un adversaire...</h2>
                <p className="text-gray-600">
                  Temps : <span className="font-bold text-yellow-600">{formatTime(searchTime)}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{statusMessage}</p>
              </div>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full border-2 border-red-400 text-red-600 hover:bg-red-50"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-6 py-8">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-full shadow-2xl mx-auto w-32 h-32 flex items-center justify-center animate-bounce">
                <Trophy className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-black text-green-600">Match trouvé !</h2>
              <p className="text-gray-600">{statusMessage}</p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="text-gray-600 font-semibold">Chargement de la salle...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}