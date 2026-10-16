// ✅ Système XP synchronisé : +20 victoire, -2 défaite
export function calculateXpReward(isWin: boolean, difficulty?: string): number {
  return isWin ? 20 : -2;
}

export function getLevelInfo(xp: number) {
  const safeXp = Math.max(0, xp);
  return {
    level: Math.floor(safeXp / 100) + 1,
    currentXp: safeXp % 100,
    requiredXp: 100,
    progress: ((safeXp % 100) / 100) * 100,
  };
}

// ✅ Fonction manquante : titre du niveau
export function getTitleForLevel(level: number): string {
  const titles = [
    'Débutant', 'Novice', 'Apprenti', 'Joueur', 'Amateur',
    'Intermédiaire', 'Confirmé', 'Expert', 'Maître', 'Grand Maître',
    'Légende', 'Mythique', 'Divin', 'Immortel', 'Transcendant'
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Légende';
}