'use client';
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, Sparkles, Star, Home, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSound } from '@/hooks/useSound';
import { BannerAd } from '@/components/ads/BannerAd';
import { AdsterraBanner } from '@/components/ads/AdsterraBanner';
import { calculateXpReward, getLevelInfo } from '@/lib/level-system';
import { checkAndUnlockAchievements } from '@/lib/achievements';
import { supabase } from '@/lib/supabase';

interface GameOverDisplayProps { 
  winner: string | { name: string }; 
  onPlayAgain: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  userId?: string;
  currentStats?: {
    wins: number;
    totalGames: number;
    xp: number;
    level: number;
  };
}

const ConfettiPiece = ({ id, style }: { id: number; style: React.CSSProperties }) => (
  <div key={id} className="absolute w-2 h-4 rounded-full" style={style}></div>
);

export function GameOverDisplay({ 
  winner, 
  onPlayAgain, 
  difficulty = 'medium',
  userId,
  currentStats
}: GameOverDisplayProps) {
  const router = useRouter();
  const { playVictory, playDefeat, playAchievement } = useSound();
  
  const [xpGained, setXpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  
  // ✅ COMPTE À REBOURS DE 5 SECONDES
  const [waitTime, setWaitTime] = useState(5);

  useEffect(() => {
    let winnerName = '';
    if (typeof winner === 'string') winnerName = winner;
    else if (winner && typeof winner === 'object' && 'name' in winner) winnerName = winner.name;
    
    if (winnerName === 'player') {
      playVictory();
    } else {
      playDefeat();
    }

    // Calculer et appliquer les récompenses
    if (userId && currentStats) {
      const won = winnerName === 'player';
      const xpReward = calculateXpReward(won, difficulty);
      const newXp = Math.max(0, currentStats.xp + xpReward);
      const levelInfo = getLevelInfo(newXp);
      
      setXpGained(xpReward);
      if (levelInfo.level > currentStats.level) {
        setNewLevel(levelInfo.level);
      }

      supabase
        .from('profiles')
        .update({ xp: newXp, level: levelInfo.level })
        .eq('id', userId);

      checkAndUnlockAchievements(userId, {
        wins: won ? currentStats.wins + 1 : currentStats.wins,
        totalGames: currentStats.totalGames + 1,
        level: levelInfo.level,
        totalXp: newXp,
        wonOnHard: won && difficulty === 'hard',
      }).then((newlyUnlocked) => {
        if (newlyUnlocked.length > 0) {
          setUnlockedAchievements(newlyUnlocked);
          if (typeof playAchievement === 'function') playAchievement();
        }
        setShowRewards(true);
      });
    } else {
      setShowRewards(true);
    }
  }, [winner, userId, currentStats, difficulty, playVictory, playDefeat, playAchievement]);

  // ✅ COMPTE À REBOURS AUTOMATIQUE (décrémente chaque seconde)
  useEffect(() => {
    if (waitTime > 0) {
      const timer = setTimeout(() => setWaitTime(waitTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [waitTime]);

  const handlePlayAgain = () => {
    if (waitTime > 0) return; // ✅ Empêche le clic avant la fin du compte à rebours
    onPlayAgain();
  };

  const handleQuit = () => {
    if (waitTime > 0) return; // ✅ Empêche le clic avant la fin du compte à rebours
    router.push('/menu');
  };

  let winnerName = '';
  if (typeof winner === 'string') winnerName = winner;
  else if (winner && typeof winner === 'object' && 'name' in winner) winnerName = winner.name;
  const message = winnerName === 'player' ? 'Félicitations, vous avez gagné !' : `${winnerName} a gagné la partie !`;
  
  const confetti = Array.from({ length: 100 }).map((_, i) => {
    const style: React.CSSProperties = { 
      left: `${Math.random() * 100}%`, 
      animation: `fall ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s infinite`, 
      backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`, 
      opacity: Math.random() * 0.5 + 0.5, 
      transform: `rotate(${Math.random() * 360}deg)` 
    };
    return <ConfettiPiece key={i} id={i} style={style} />;
  });

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in-50">
      <style>{`@keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); } 100% { transform: translateY(110vh) rotate(720deg); } }`}</style>
      {winnerName === 'player' && confetti}
      
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl text-center z-10 max-w-md border-4 border-yellow-400 w-[90%] max-h-[90vh] overflow-y-auto">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl md:text-3xl font-black mb-4 text-gray-800">{message}</h2>
        
        {/* Récompenses XP et succès */}
        {showRewards && (xpGained !== 0 || newLevel || unlockedAchievements.length > 0) && (
          <div className="my-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 space-y-3">
            {xpGained !== 0 && (
              <div className={`flex items-center justify-center gap-2 font-bold ${
                xpGained > 0 ? 'text-purple-700' : 'text-red-600'
              }`}>
                {xpGained > 0 ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>+{xpGained} XP</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">😢</span>
                    <span>{xpGained} XP</span>
                  </>
                )}
              </div>
            )}
            
            {newLevel && (
              <div className="flex items-center justify-center gap-2 text-yellow-600 font-black animate-pulse">
                <Star className="w-5 h-5" fill="currentColor" />
                <span>Niveau {newLevel} atteint !</span>
              </div>
            )}
            
            {unlockedAchievements.length > 0 && (
              <div className="pt-2 border-t border-purple-200">
                <p className="text-xs font-bold text-purple-600 mb-2 uppercase">
                  🏆 Succès débloqué{unlockedAchievements.length > 1 ? 's' : ''} !
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {unlockedAchievements.map(id => (
                    <div key={id} className="text-sm bg-white/70 px-3 py-1 rounded-full">
                      {id === 'first_win' && '🏆 Première Victoire'}
                      {id === 'win_10' && '⚔️ Guerrier'}
                      {id === 'win_50' && ' Champion'}
                      {id === 'win_100' && '🌟 Légende'}
                      {id === 'play_10' && '🎮 Habitué'}
                      {id === 'play_50' && ' Accro'}
                      {id === 'play_100' && '💪 Vétéran'}
                      {id === 'hard_win' && '🧠 Maître Stratège'}
                      {id === 'level_5' && '📈 Niveau 5'}
                      {id === 'level_10' && '🚀 Niveau 10'}
                      {id === 'level_25' && '💎 Niveau 25'}
                      {id === 'xp_1000' && '✨ Millénaire'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ PUB MONETAG (invisible mais nécessaire pour charger le script) */}
        <div className="hidden">
          <BannerAd zoneId="12054544" />
        </div>

        {/* ✅ BANNIÈRE ADSTERRA 300x250 */}
        <div className="my-6 flex justify-center">
          <AdsterraBanner type="banner300x250" />
        </div>

        {/* ✅ BOUTONS D'ACTION AVEC COMPTE À REBOURS */}
        <div className="space-y-3">
          <Button 
            onClick={handlePlayAgain} 
            disabled={waitTime > 0}
            size="lg" 
            className={`w-full py-6 text-lg flex items-center justify-center gap-2 font-black border-b-4 shadow-lg transition-all ${
              waitTime > 0 
                ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black border-yellow-800'
            }`}
          >
            {waitTime > 0 ? (
              <>
                <Clock className="w-5 h-5 animate-pulse" />
                Attendez {waitTime}s...
              </>
            ) : (
              'Rejouer'
            )}
          </Button>

          <Button 
            onClick={handleQuit}
            disabled={waitTime > 0}
            variant="outline"
            size="lg"
            className={`w-full py-6 text-lg font-bold flex items-center justify-center gap-2 transition-all ${
              waitTime > 0
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
            Retour au menu
          </Button>
        </div>
      </div>
    </div>
  );
}