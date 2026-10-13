import { supabase } from './supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
}

export interface UserAchievement extends Achievement {
  unlocked_at: string;
}

// Récupérer tous les succès disponibles
export async function getAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('xp_reward', { ascending: false });
  
  if (error) {
    console.error('Erreur chargement succès:', error);
    return [];
  }
  return data || [];
}

// Récupérer les succès débloqués par l'utilisateur
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      achievement_id,
      unlocked_at,
      achievements:achievement_id (
        id, name, description, icon, xp_reward, category
      )
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  
  if (error) {
    console.error('Erreur chargement succès utilisateur:', error);
    return [];
  }
  
  return (data || []).map((ua: any) => ({
    ...ua.achievements,
    unlocked_at: ua.unlocked_at,
  }));
}

// Débloquer un succès (retourne true si nouveau)
export async function unlockAchievement(
  userId: string, 
  achievementId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_achievements')
    .insert({ user_id: userId, achievement_id: achievementId })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') return false; // Déjà débloqué
    console.error('Erreur déblocage succès:', error);
    return false;
  }
  return true;
}

// Vérifier et débloquer les succès basés sur les stats
export async function checkAndUnlockAchievements(
  userId: string,
  stats: { wins: number; totalGames: number; level: number; totalXp: number; wonOnHard: boolean }
): Promise<string[]> {
  const newlyUnlocked: string[] = [];
  
  const checks = [
    { id: 'first_win', condition: stats.wins >= 1 },
    { id: 'win_10', condition: stats.wins >= 10 },
    { id: 'win_50', condition: stats.wins >= 50 },
    { id: 'win_100', condition: stats.wins >= 100 },
    { id: 'play_10', condition: stats.totalGames >= 10 },
    { id: 'play_50', condition: stats.totalGames >= 50 },
    { id: 'play_100', condition: stats.totalGames >= 100 },
    { id: 'hard_win', condition: stats.wonOnHard },
    { id: 'level_5', condition: stats.level >= 5 },
    { id: 'level_10', condition: stats.level >= 10 },
    { id: 'level_25', condition: stats.level >= 25 },
    { id: 'xp_1000', condition: stats.totalXp >= 1000 },
  ];
  
  for (const check of checks) {
    if (check.condition) {
      const unlocked = await unlockAchievement(userId, check.id);
      if (unlocked) newlyUnlocked.push(check.id);
    }
  }
  
  return newlyUnlocked;
}