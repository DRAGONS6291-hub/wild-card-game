'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Club, Diamond, Heart, Spade } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function MenuPage() {
  const router = useRouter();
  const [isDifficultyDialogOpen, setDifficultyDialogOpen] = useState(false);

  const handlePlayVsAI = (difficulty: 'easy' | 'medium' | 'hard') => {
    setDifficultyDialogOpen(false);
    router.push(`/game?difficulty=${difficulty}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 text-white overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-300 via-orange-500 to-orange-800">
      <div className="relative z-10 text-center flex flex-col items-center">
        
        {/* Logo animé */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center -space-x-8 mb-4">
            <div className="relative transform -rotate-12 bg-white/90 p-3 rounded-lg border-4 border-white w-28 h-40 flex items-center justify-center shadow-xl">
              <Heart className="w-20 h-20 text-red-500" fill="currentColor" />
            </div>
            <div className="relative z-10 bg-white/90 p-4 rounded-lg border-4 border-white w-32 h-44 flex items-center justify-center shadow-2xl">
              <Club className="w-24 h-24 text-green-700" fill="currentColor" />
            </div>
            <div className="relative transform rotate-12 bg-white/90 p-3 rounded-lg border-4 border-white w-28 h-40 flex items-center justify-center shadow-xl">
              <Diamond className="w-20 h-20 text-blue-600" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold text-yellow-400" style={{ fontFamily: "'Arial Black', sans-serif", WebkitTextStroke: '4px #9A3412', textShadow: '6px 6px 0px #9A3412' }}>
            WILD CARD
          </h1>
        </div>

        {/* Boutons du menu */}
        <div className="flex flex-col gap-4 mt-8 w-80">
          <Button
            size="lg"
            onClick={() => setDifficultyDialogOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 border-b-8 border-orange-700 text-white text-3xl font-bold py-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Jouer vs IA
          </Button>
          
          <Link href="/local" className="w-full">
            <Button
              size="lg"
              className="w-full bg-purple-500 hover:bg-purple-600 border-b-8 border-purple-700 text-white text-xl font-bold py-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
            >
              Multi Local
            </Button>
          </Link>

          <div className="flex gap-4 w-full mt-4">
            <Link href="/rules" className="w-full">
              <Button variant="outline" className="w-full bg-green-600 hover:bg-green-700 border-b-8 border-green-800 text-white text-xl font-bold py-6 rounded-full shadow-lg">Règles</Button>
            </Link>
            <Link href="/settings" className="w-full">
              <Button variant="outline" className="w-full bg-blue-500 hover:bg-blue-600 border-b-8 border-blue-700 text-white text-xl font-bold py-6 rounded-full shadow-lg">Paramètres</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dialogue de difficulté */}
      <Dialog open={isDifficultyDialogOpen} onOpenChange={setDifficultyDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choisissez la difficulté</DialogTitle>
            <DialogDescription>Sélectionnez le niveau de l'IA pour cette partie.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={() => handlePlayVsAI('easy')} className="h-16 bg-green-500 hover:bg-green-600 text-white text-xl font-bold">🌱 Facile</Button>
            <Button onClick={() => handlePlayVsAI('medium')} className="h-16 bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold">⚔️ Moyen</Button>
            <Button onClick={() => handlePlayVsAI('hard')} className="h-16 bg-red-500 hover:bg-red-600 text-white text-xl font-bold">🔥 Difficile</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}