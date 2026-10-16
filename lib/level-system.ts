// ✅ Calcul d'XP synchronisé pour Local et Multijoueur : +20 victoire, -2 défaite
export function calculateXpReward(isWin: boolean, difficulty?: string): number {
  if (isWin) {
    return 20; // +20 XP pour une victoire
  } else {
    return -2; // -2 XP pour une défaite
  }
}

// ✅ Calcul du niveau (1 niveau tous les 100 XP, niveau minimum 1)
export function getLevelInfo(xp: number) {
  // On s'assure que l'XP ne descend pas en dessous de 0 pour le calcul du niveau
  const safeXp = Math.max(0, xp);
  const level = Math.floor(safeXp / 100) + 1;
  const xpInCurrentLevel = safeXp % 100;
  
  return {
    level,
    currentXp: xpInCurrentLevel,
    requiredXp: 100,
    progress: (xpInCurrentLevel / 100) * 100,
  };
}