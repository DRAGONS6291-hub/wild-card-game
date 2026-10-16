// ✅ Calcul d'XP synchronisé : +20 pour une victoire, -2 pour une défaite
export function calculateXpReward(isWin: boolean, difficulty: string): number {
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

// ✅ Fonction optionnelle pour vérifier les succès (à adapter selon ton fichier achievements)
export async function checkAndUnlockAchievements(userId: string, stats: any) {
  // Cette fonction est appelée depuis le jeu, elle peut rester vide ou contenir ta logique de succès
  return [];
}