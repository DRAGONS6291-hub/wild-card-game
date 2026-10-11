'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function LocalGameSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  const handlePlayerCountChange = (count: number) => { setPlayerCount(count); setPlayerNames(Array(count).fill('').map((_, i) => playerNames[i] || `Joueur ${i + 1}`)); };
  const handleNameChange = (index: number, name: string) => { const newNames = [...playerNames]; newNames[index] = name; setPlayerNames(newNames); };
  const handleStartGame = () => {
    const params = new URLSearchParams(); params.set('players', playerCount.toString());
    playerNames.forEach((name, index) => params.set(`name${index}`, name || `Joueur ${index + 1}`));
    router.push(`/game?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/menu"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <CardTitle className="text-3xl flex items-center gap-2"><Users className="h-8 w-8" />Mode Multijoueur Local</CardTitle><div />
          </div>
          <CardDescription>Configurez le nombre de joueurs et leurs noms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Nombre de joueurs</Label>
            <div className="flex gap-2">{[2, 3, 4].map((count) => (<Button key={count} variant={playerCount === count ? 'default' : 'outline'} onClick={() => handlePlayerCountChange(count)} className="flex-1">{count} joueurs</Button>))}</div>
          </div>
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Noms des joueurs</Label>
            {Array.from({ length: playerCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Label className="w-24">Joueur {index + 1}</Label>
                <Input type="text" value={playerNames[index]} onChange={(e) => handleNameChange(index, e.target.value)} placeholder={`Joueur ${index + 1}`} className="flex-1" />
              </div>
            ))}
          </div>
          <Button onClick={handleStartGame} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">Commencer la partie</Button>
        </CardContent>
      </Card>
    </main>
  );
}
