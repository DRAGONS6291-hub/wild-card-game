'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { SoundButton } from '@/components/ui/SoundButton';
import { SoundLink } from '@/components/ui/SoundLink';
import { BannerAd } from '@/components/ads/BannerAd';
import { Play, Trophy, User, Settings, LogOut, Heart, Club, Diamond, Sword, BookOpen } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const { profile, userId } = useAuth();
  const [stats, setStats] = useState({ wins: 0, total: 0 });

  useEffect(() => {
    if (!userId) {
      router.push('/auth');
      return;
    }

    const loadStats = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('wins, total_games')
        .eq('id', userId)
        .single();
      
      if (data) {
        setStats({ wins: data.wins || 0, total: data.total_games || 0 });
      }
    };
    loadStats();
  }, [userId, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handlePlay = (difficulty: string) => {
    router.push(`/game?difficulty=${difficulty}`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center -space-x-6 mb-4">
            <div className="bg-white/90 p-2 rounded-lg border-2 border-white w-16 h-24 flex items-center justify-center shadow-xl transform -rotate-12">
              <Heart className="w-10 h-10 text-red-500" fill="currentColor" />
            </div>
            <div className="bg-white/90 p-3 rounded-lg border-2 border-white w-20 h-28 flex items-center justify-center shadow-2xl z-10">
              <Club className="w-14 h-14 text-green-700" fill="currentColor" />
            </div>
            <div className="bg-white/90 p-2 rounded-lg border-2 border-white w-16 h-24 flex items-center justify-center shadow-xl transform rotate-12">
              <Diamond className="w-10 h-10 text-blue-600" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-yellow-400" style={{ WebkitTextStroke: '3px #9A3412', textShadow: '4px 4px 0px #9A3412' }}>
            WILD CARD
          </h1>
          {profile && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <img 
                src={profile.avatar_url} 
                alt={profile.pseudo}
                className="w-12 h-12 rounded-full border-2 border-yellow-400 shadow-lg object-cover"
              />
              <p className="text-white font-bold text-xl">Bonjour, {profile.pseudo} !</p>
            </div>
          )}
        </div>

        {/* Stats rapides */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-yellow-400/50">
            <p className="text-yellow-400 text-sm font-bold">Parties jouées</p>
            <p className="text-white text-2xl font-black">{stats.total}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-yellow-400/50">
            <p className="text-yellow-400 text-sm font-bold">Victoires</p>
            <p className="text-white text-2xl font-black">{stats.wins}</p>
          </div>
        </div>

        {/* Menu principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-yellow-400 space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Menu Principal</h2>

          {/* Boutons de difficulté */}
          <div className="space-y-3">
            <SoundButton
              onClick={() => handlePlay('easy')}
              className="w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black border-b-4 border-green-800 shadow-lg text-lg py-5 md:py-6"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" /> Facile
            </SoundButton>

            <SoundButton
              onClick={() => handlePlay('medium')}
              className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-4 border-yellow-800 shadow-lg text-lg py-5 md:py-6"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" /> Moyen
            </SoundButton>

            <SoundButton
              onClick={() => handlePlay('hard')}
              className="w-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black border-b-4 border-red-900 shadow-lg text-lg py-5 md:py-6"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" /> Difficile
            </SoundButton>
          </div>

          {/* Séparateur */}
          <div className="border-t-2 border-gray-300 my-6"></div>

          {/* Autres boutons - Grille responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SoundLink href="/multiplayer" className="w-full">
              <button className="w-full bg-gradient-to-b from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold border-b-4 border-purple-900 shadow-lg py-4 flex items-center justify-center gap-2">
                <Sword className="w-5 h-5" /> Multijoueur
              </button>
            </SoundLink>

            <SoundLink href="/leaderboard" className="w-full">
              <button className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold border-b-4 border-yellow-800 shadow-lg py-4 flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" /> Classement
              </button>
            </SoundLink>

            <SoundLink href="/settings" className="w-full">
              <button className="w-full bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold border-b-4 border-blue-900 shadow-lg py-4 flex items-center justify-center gap-2">
                <Settings className="w-5 h-5" /> Paramètres
              </button>
            </SoundLink>

            {/* ✅ NOUVEAU BOUTON RÈGLES DU JEU */}
            <SoundLink href="/rules" className="w-full">
              <button className="w-full bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-bold border-b-4 border-indigo-900 shadow-lg py-4 flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" /> Règles du jeu
              </button>
            </SoundLink>

            <SoundLink href="/profile" className="w-full">
              <button className="w-full bg-gradient-to-b from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-bold border-b-4 border-pink-900 shadow-lg py-4 flex items-center justify-center gap-2">
                <User className="w-5 h-5" /> Mon Profil
              </button>
            </SoundLink>

            <SoundButton
              onClick={handleLogout}
              className="w-full bg-gradient-to-b from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white font-bold border-b-4 border-gray-900 shadow-lg py-4 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Déconnexion
            </SoundButton>
          </div>
        </div>

        {/* Bannière discrète */}
        <div className="mt-6 p-3 bg-black/40 rounded-xl border border-yellow-400/30 flex flex-col items-center">
          <p className="text-[10px] text-yellow-400/60 font-bold mb-1 uppercase tracking-widest">Sponsorisé</p>
          <BannerAd />
        </div>
      </div>
    </div>
  );
}