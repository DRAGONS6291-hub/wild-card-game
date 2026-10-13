// Système de niveaux et XP

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number; // 0 à 100
  title: string;
}

// Titres selon le niveau
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Débutant',
  2: 'Novice',
  3: 'Apprenti',
  5: 'Joueur',
  7: 'Expert',
  10: 'Maître',
  15: 'Grand Maître',
  20: 'Champion',
  25: 'Légende',
  30: 'Mythique',
  50: 'Divin',
};

export function getTitleForLevel(level: number): string {
  let title = 'Débutant';
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= parseInt(lvl)) title = t;
  }
  return title;
}

// XP nécessaire pour le niveau suivant (formule progressive)
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Calculer les infos de niveau
export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let xpRemaining = totalXp;
  
  while (xpRemaining >= xpForLevel(level)) {
    xpRemaining -= xpForLevel(level);
    level++;
  }
  
  const nextLevelXp = xpForLevel(level);
  const progress = (xpRemaining / nextLevelXp) * 100;
  
  return {
    level,
    currentXp: xpRemaining,
    xpForNextLevel: nextLevelXp,
    progress: Math.min(progress, 100),
    title: getTitleForLevel(level),
  };
}

// XP gagné selon le résultat
export function calculateXpReward(
  won: boolean, 
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const baseXp = won ? 50 : 10;
  const difficultyMultiplier = 
    difficulty === 'easy' ? 1 : 
    difficulty === 'medium' ? 1.5 : 2;
  
  return Math.floor(baseXp * difficultyMultiplier);
}