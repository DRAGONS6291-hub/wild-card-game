'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, Zap, AlertCircle } from 'lucide-react';

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/menu"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-4xl font-bold text-center flex-1">Règles du Jeu</h1><div />
        </div>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><Trophy className="h-6 w-6 text-yellow-500" />But du Jeu</CardTitle></CardHeader><CardContent><p className="text-lg">Être le premier joueur à ne plus avoir de cartes en main.</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><Target className="h-6 w-6 text-blue-500" />Mise en Place</CardTitle></CardHeader><CardContent className="space-y-2"><p>• Chaque joueur reçoit <strong>7 cartes</strong></p><p>• Une carte est posée face visible pour démarrer la défausse</p><p>• Le reste forme la pioche</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><Zap className="h-6 w-6 text-orange-500" />Déroulement d'un Tour</CardTitle></CardHeader><CardContent className="space-y-2"><p>À votre tour, vous devez soit :</p><p className="ml-4">• Jouer <strong>UNE carte valide</strong></p><p className="ml-4">• Soit <strong>piocher UNE carte</strong></p><p className="mt-2">Si vous piochez et ne pouvez toujours pas jouer, votre tour se termine.</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-2xl">Cartes Valides</CardTitle></CardHeader><CardContent><p>Une carte est valide si elle a :</p><ul className="list-disc list-inside space-y-1 mt-2"><li>La <strong>même couleur</strong> (ex: Cœur sur Cœur)</li><li>La <strong>même valeur</strong> (ex: 5 sur 5)</li><li>Ou si c'est un <strong>JOKER</strong> (jouable sur n'importe quelle carte)</li></ul></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><AlertCircle className="h-6 w-6 text-red-500" />Cartes Spéciales</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="border-l-4 border-orange-500 pl-4"><h3 className="font-bold text-xl mb-2">🔟 10 – Rejouer</h3><p>Permet de rejouer immédiatement.</p></div>
            <div className="border-l-4 border-red-500 pl-4"><h3 className="font-bold text-xl mb-2">7️⃣ 7 – Carte Pioche 2 (Cumulable)</h3><p>Quand un 7 est joué, le joueur suivant doit piocher 2 cartes.</p><p className="mt-2"><strong>SAUF</strong> s'il possède lui-même un 7. S'il joue un 7, l'effet s'additionne.</p></div>
            <div className="border-l-4 border-purple-500 pl-4"><h3 className="font-bold text-xl mb-2">👑 Valet – Changement de couleur</h3><p>Quand vous jouez un valet, vous choisissez et annoncez une nouvelle couleur.</p></div>
            <div className="border-l-4 border-yellow-500 pl-4"><h3 className="font-bold text-xl mb-2">🃏 JOKER – Carte Sauvage</h3><p>C'est la carte la plus puissante. Quand vous la jouez :</p><ul className="list-disc list-inside mt-2 space-y-1"><li>Vous choisissez une nouvelle couleur</li><li>Le joueur suivant doit alors <strong>piocher 5 cartes</strong></li></ul></div>
          </CardContent></Card>
          <div className="flex justify-center pt-4"><Link href="/menu"><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">Retour au Menu</Button></Link></div>
        </div>
      </div>
    </main>
  );
}
