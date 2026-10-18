// ... (garder tous les imports du début, y compris Clock, AdsterraBanner, BannerAd)

// ... (garder tout le code jusqu'à la partie render)

        ) : gameState.status === 'finished' ? (
          <div className="bg-white/95 rounded-2xl p-8 shadow-2xl border-2 border-yellow-400 text-center">
            <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-black mb-4">{gameState.winner === myId ? '🎉 Tu as gagné !' : '😢 Tu as perdu...'}</h2>
            <p className="text-gray-600 mb-4">Vainqueur : Joueur {gameState.winner}</p>
            
            {xpGained !== null && (
              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 ${
                  xpGained > 0 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                }`}>
                  {xpGained > 0 ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
                  <div className="text-left">
                    <p className={`text-2xl font-black ${xpGained > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {xpGained > 0 ? '+' : ''}{xpGained} XP
                    </p>
                    <p className="text-xs text-gray-600">{xpGained > 0 ? 'Victoire !' : 'Défaite...'}</p>
                  </div>
                </div>
                {newLevel && newLevel > (profile?.level || 1) && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 border-2 border-yellow-400">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 font-bold">Niveau {newLevel} atteint !</p>
                  </div>
                )}
              </div>
            )}

            {/* ✅ BANNIÈRE ADSTERRA 300x250 + PUB MONETAG CACHÉE */}
            <div className="hidden">
              <BannerAd zoneId="12054544" />
            </div>
            <div className="my-6 flex justify-center">
              <AdsterraBanner type="banner300x250" />
            </div>
            
            <div className="space-y-3 max-w-md mx-auto">
              {/* ✅ SEUL BOUTON : RETOUR AU MENU AVEC TIMER DE 5s */}
              <Button 
                onClick={handleQuit} 
                disabled={waitTime > 0}
                variant="outline" 
                className={`w-full py-6 text-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  waitTime > 0
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                }`}
              >
                {waitTime > 0 ? (
                  <><Clock className="w-5 h-5 animate-pulse" /> Attendez {waitTime}s...</>
                ) : (
                  <><Home className="w-5 h-5" /> Retour au menu</>
                )}
              </Button>
            </div>
          </div>
        ) : (
// ... (garder le reste du fichier inchangé)