'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, RotateCcw } from 'lucide-react';

interface GameStats { gamesPlayed: number; gamesWon: number; gamesLost: number; }

export default function SettingsPage() {
  const [stats, setStats] = useState<GameStats>({ gamesPlayed: 0, gamesWon: 0, gamesLost: 0 });
  useEffect(() => { const savedStats = localStorage.getItem('wildCardStats'); if (savedStats) setStats(JSON.parse(savedStats)); }, []);
  const handleResetStats = () => { if (confirm('Êtes-vous sûr de vouloir réinitialiser vos statistiques ?')) { const newStats = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 }; setStats(newStats); localStorage.setItem('wildCardStats', JSON.stringify(newStats)); } };
  const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : '0.0';

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/menu"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-4xl font-bold text-center flex-1">Paramètres</h1><div />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><Trophy className="h-6 w-6 text-yellow-500" />Statistiques</CardTitle><CardDescription>Vos performances dans Wild Card</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-primary">{stats.gamesPlayed}</p><p className="text-sm text-muted-foreground">Parties jouées</p></div>
                <div className="bg-green-500/10 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-green-600">{stats.gamesWon}</p><p className="text-sm text-muted-foreground">Victoires</p></div>
                <div className="bg-red-500/10 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-red-600">{stats.gamesLost}</p><p className="text-sm text-muted-foreground">Défaites</p></div>
                <div className="bg-yellow-500/10 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-yellow-600">{winRate}%</p><p className="text-sm text-muted-foreground">Taux de réussite</p></div>
              </div>
              <Button onClick={handleResetStats} variant="destructive" className="w-full mt-4"><RotateCcw className="h-4 w-4 mr-2" />Réinitialiser les statistiques</Button>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><Target className="h-6 w-6 text-blue-500" />À propos</CardTitle></CardHeader><CardContent className="space-y-2"><p><strong>Wild Card</strong> v1.0.0</p><p>Un jeu de cartes de stratégie et de chance.</p><p className="text-sm text-muted-foreground mt-4">Développé avec Next.js, React, TypeScript et Tailwind CSS.</p><p className="text-sm text-muted-foreground">IA propulsée par Google Gemini.</p></CardContent></Card>
          <div className="flex justify-center pt-4"><Link href="/menu"><Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">Retour au Menu</Button></Link></div>
        </div>
      </div>
    </main>
  );
}
