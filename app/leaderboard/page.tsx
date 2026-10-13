'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, Medal, ArrowLeft, User } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  pseudo: string;
  avatar_url: string;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      // Récupérer l'utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }

      // Charger le classement
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('wins', { ascending: false })
        .order('win_rate', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur leaderboard:', error);
      } else if (data) {
        setLeaderboard(data);
      }
      setLoading(false);
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-2xl font-bold">Chargement du classement...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Retour au menu
          </Link>
          <h1 className="text-4xl font-black text-yellow-400" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
             CLASSEMENT
          </h1>
          <div className="w-32"></div>
        </div>

        {/* Liste des joueurs */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-yellow-400">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">Aucune partie jouée pour le moment</p>
              <p className="text-gray-500 text-sm mt-2">Sois le premier à jouer !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((player, index) => {
                const isCurrentUser = currentUserId === player.id;
                const rank = index + 1;
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      rank === 1
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-500 shadow-lg'
                        : rank === 2
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400'
                        : rank === 3
                        ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400'
                        : isCurrentUser
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Rang */}
                    <div className="flex-shrink-0 w-12 text-center">
                      {rank === 1 ? (
                        <Trophy className="w-8 h-8 text-yellow-600 mx-auto" />
                      ) : rank === 2 ? (
                        <Medal className="w-8 h-8 text-gray-600 mx-auto" />
                      ) : rank === 3 ? (
                        <Medal className="w-8 h-8 text-orange-600 mx-auto" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-500">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.pseudo}
                          className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Infos joueur */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {player.pseudo}
                          {isCurrentUser && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full ml-2">
                              TOI
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span className="font-semibold">{player.total_games} parties</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{player.wins}</div>
                        <div className="text-xs text-gray-500 font-semibold">Victoires</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{player.losses}</div>
                        <div className="text-xs text-gray-500 font-semibold">Défaites</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {player.win_rate || 0}%
                        </div>
                        <div className="text-xs text-gray-500 font-semibold">Taux de victoire</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}