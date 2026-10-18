'use client';
import { ArrowLeft, Target, Sparkles, RefreshCw, Palette, Trophy, Layers } from 'lucide-react';
import Link from 'next/link';
import { AdsterraBanner } from '@/components/ads/AdsterraBanner';

export default function RulesPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/menu" className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors">
            <ArrowLeft className="w-6 h-6" /> Retour au menu
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-yellow-400 text-center" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
            RÈGLES DU JEU
          </h1>
          <div className="w-24 hidden md:block"></div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-yellow-400 space-y-6">
          
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0"><Target className="w-6 h-6 text-blue-600" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-2">🎯 But du jeu</h2>
              <p className="text-gray-700">Être le premier joueur à se débarrasser de <strong>toutes ses cartes</strong>. Le premier qui pose sa dernière carte remporte la victoire !</p>
            </div>
          </div>

          <div className="border-t-2 border-gray-200"></div>

          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0"><Layers className="w-6 h-6 text-indigo-600" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-2">📋 Règles de Base</h2>
              <p className="text-gray-700 mb-3">À chaque tour, vous devez poser une carte sur la défausse. Vous avez <strong>deux options</strong> :</p>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <strong className="text-indigo-700">1. Suivre la couleur :</strong> Si la carte du dessus est un <span className="text-red-600 font-bold">Cœur</span>, vous pouvez jouer n'importe quel <span className="text-red-600 font-bold">Cœur</span> (2, 3, 4, 5, etc.).
                </p>
                <p className="text-gray-700">
                  <strong className="text-indigo-700">2. Jouer le même rang :</strong> Si la carte du dessus est un <strong className="font-bold">Roi</strong>, vous pouvez jouer n'importe quel <strong className="font-bold">Roi</strong> (de n'importe quelle couleur).
                </p>
              </div>
              <p className="text-gray-700 mt-3 text-sm italic">
                💡 <strong>Exemple :</strong> Si la carte du dessus est le <span className="text-red-600 font-bold">7 de Cœur</span>, vous pouvez jouer le <span className="text-red-600 font-bold">2 de Cœur</span> (même couleur) OU le <span className="text-green-700 font-bold">7 de Trèfle</span> (même rang).
              </p>
            </div>
          </div>

          <div className="border-t-2 border-gray-200"></div>

          <div>
            <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" /> 🃏 Cartes Spéciales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-700 text-lg mb-1">Le 7</h3>
                <p className="text-sm text-gray-700">Cumule <strong>+2 cartes</strong> à piocher pour l'adversaire. L'adversaire peut contrer en jouant un autre 7 (le total devient +4, +6, etc.). Sinon, il doit piocher le total. <strong>Après avoir pioché, il peut jouer une carte ou passer son tour</strong> (indiqué dans le rectangle gris d'instructions).</p>
              </div>
              
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <h3 className="font-bold text-purple-700 text-lg mb-1">Le 10</h3>
                <p className="text-sm text-gray-700">Fait <strong>sauter le tour</strong> de l'adversaire. Vous conservez la main et pouvez rejouer immédiatement, <strong>ou choisir de passer votre tour</strong> via le bouton dédié qui apparaît à l'écran.</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-700 text-lg mb-1">Le Valet (Jack)</h3>
                <p className="text-sm text-gray-700">Jouable sur <strong>n'importe quelle carte</strong>. Vous choisissez la couleur que l'adversaire sera obligé de jouer.</p>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <h3 className="font-bold text-yellow-700 text-lg mb-1">Le Joker</h3>
                <p className="text-sm text-gray-700">Jouable sur <strong>n'importe quelle carte</strong>. Vous choisissez la couleur, ET l'adversaire doit <strong>piocher automatiquement 5 cartes</strong>.</p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-200"></div>

          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-full flex-shrink-0"><RefreshCw className="w-6 h-6 text-green-600" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-2">🔄 Règle de Démarrage</h2>
              <p className="text-gray-700">Si la toute première carte retournée au début de la partie est un <strong>7</strong> ou un <strong>Joker</strong>, le premier joueur subit immédiatement l'effet (il doit piocher 2 cartes s'il n'a pas de 7 pour contrer, ou 5 cartes pour un Joker).</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-pink-100 p-3 rounded-full flex-shrink-0"><Palette className="w-6 h-6 text-pink-600" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-2">🎨 Couleur Imposée</h2>
              <p className="text-gray-700">Après un Valet ou un Joker, vous devez <strong>obligatoirement</strong> jouer la couleur annoncée. La seule exception est de jouer un autre Valet ou Joker pour changer à nouveau la couleur.</p>
            </div>
          </div>

          <div className="border-t-2 border-gray-200"></div>

          <div className="flex items-start gap-4">
            <div className="bg-yellow-100 p-3 rounded-full flex-shrink-0"><Trophy className="w-6 h-6 text-yellow-600" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-2">🏆 Victoire</h2>
              <p className="text-gray-700">La partie se termine dès qu'un joueur pose sa dernière carte. Un écran de victoire s'affiche et votre score est enregistré dans le classement !</p>
            </div>
          </div>

        </div>

        {/* ✅ BANNIÈRE PUBLICITAIRE EN BAS DES RÈGLES */}
        <div className="mt-6 flex flex-col items-center pb-8">
          <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 rounded-xl p-4 border-2 border-yellow-400/50 w-full max-w-md">
            <p className="text-yellow-400 text-xs font-bold text-center mb-3 uppercase tracking-wider">
              Sponsorisé
            </p>
            <div className="flex justify-center">
              <AdsterraBanner type="banner300x250" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}