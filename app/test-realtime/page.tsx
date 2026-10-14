'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function TestRealtimePage() {
  const [message, setMessage] = useState('En attente...');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('test-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matchmaking_queue',
        },
        (payload) => {
          console.log('🔔 Changement détecté !', payload);
          setMessage(`Changement reçu ! Type: ${payload.eventType}`);
          setCount((c) => c + 1);
        }
      )
      .subscribe((status) => {
        console.log('Statut abonnement:', status);
        if (status === 'SUBSCRIBED') {
          setMessage('✅ Connecté à Realtime !');
        } else if (status === 'CHANNEL_ERROR') {
          setMessage('❌ Erreur de connexion Realtime');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const testInsert = async () => {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        level: 1,
        status: 'searching',
      })
      .select()
      .single();

    if (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } else {
      setMessage(`✅ Insertion réussie ! ID: ${data.id}`);
      setTimeout(async () => {
        await supabase
          .from('matchmaking_queue')
          .delete()
          .eq('id', data.id);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">🧪 Test Realtime</h1>
        
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">Statut :</p>
          <p className="text-lg font-bold">{message}</p>
          <p className="text-sm text-gray-500 mt-2">Changements reçus : {count}</p>
        </div>

        <Button onClick={testInsert} className="w-full">
          Tester une insertion
        </Button>

        <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
          <strong>Comment tester :</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Ouvre cette page dans 2 onglets différents</li>
            <li>Clique sur "Tester une insertion" dans un onglet</li>
            <li>L'autre onglet doit afficher "Changement reçu !" automatiquement</li>
          </ol>
        </div>
      </div>
    </div>
  );
}