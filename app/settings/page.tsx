'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Trophy, Target, Activity, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, userId } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // On utilise la vue 'leaderboard' qu'on a déjà créée, filtrée sur l'utilisateur
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setStats({
          total: data.total_games || 0,
          wins: data.wins || 0,
          losses: data.losses || 0,
          winRate: data.win_rate || 0,
        });
      } else {
        // Si aucune donnée (0 partie jouée), on met tout à 0
        setStats({ total: 0, wins: 0, losses: 0, winRate: 0 });
      }
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-2xl font-bold">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl mx-auto pt-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Retour au menu
          </Link>
          <h1 className="text-3xl font-black text-yellow-400" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
            MES STATISTIQUES
          </h1>
          <div className="w-32"></div>
        </div>

        {/* Résumé du profil */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-yellow-400 mb-6 flex items-center gap-6">
          <img 
            src={profile?.avatar_url || 'https://i.pravatar.cc/150?img=12'} 
            alt="Avatar" 
            className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg object-cover"
          />
          <div>
            <h2 className="text-3xl font-black text-gray-800">{profile?.pseudo || 'Joueur'}</h2>
            <p className="text-gray-600 font-semibold flex items-center gap-2">
              <User className="w-4 h-4" /> Âge : {profile?.age || 'Non renseigné'} ans
            </p>
          </div>
        </div>

        {/* Grille des statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total parties */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-400 shadow-lg text-center">
            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-4xl font-black text-gray-800">{stats.total}</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Parties jouées</div>
          </div>

          {/* Victoires */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border-2 border-green-400 shadow-lg text-center">
            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-4xl font-black text-green-600">{stats.wins}</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Victoires</div>
          </div>

          {/* Défaites */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400 shadow-lg text-center">
            <Target className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-4xl font-black text-red-600">{stats.losses}</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Défaites</div>
          </div>

          {/* Taux de victoire */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400 shadow-lg text-center">
            <div className="w-8 h-8 text-yellow-500 mx-auto mb-2 font-black text-2xl flex items-center justify-center">%</div>
            <div className="text-4xl font-black text-yellow-600">{stats.winRate}%</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Taux de réussite</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/profile" className="w-full md:w-auto">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-lg border-b-4 border-blue-700 shadow-lg">
              Modifier mon profil
            </Button>
          </Link>
          
          <Button 
            onClick={handleLogout}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg border-b-4 border-red-800 shadow-lg flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}