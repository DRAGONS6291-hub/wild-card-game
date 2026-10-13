'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, User } from 'lucide-react';

// 48 AVATARS DESSINÉS - Organisés par catégorie
const AVATARS = [
  // 👤 HUMAINS (12) - Style dessin cartoon (adventurer)
  'https://api.dicebear.com/7.x/adventurer/svg?seed=John&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah&backgroundColor=b5ead7',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mike&backgroundColor=c7ceea',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Emma&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucas&backgroundColor=e0e0e0',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Tom&backgroundColor=b5ead7',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily&backgroundColor=c7ceea',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Anna&backgroundColor=e0e0e0',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=b5ead7',

  // 🐾 ANIMAUX MIGNONS (12) - Style fun-emoji
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cat&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Dog&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Panda&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Fox&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bear&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Rabbit&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Owl&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Lion&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Tiger&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Penguin&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Monkey&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Koala&backgroundColor=b6e3f4',

  // 🤖 ROBOTS & OBJETS (12) - Style bottts
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot3&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot4&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot5&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot6&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot7&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot8&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot9&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot10&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot11&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot12&backgroundColor=ffd5dc',

  // 🎨 PERSONNAGES FANTASY (12) - Style lorelei
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Elf&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Fairy&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Wizard&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Knight&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Dragon&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Unicorn&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Mermaid&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Ninja&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Pirate&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Vampire&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Ghost&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Alien&backgroundColor=ffd5dc',
];

const AVATAR_LABELS = [
  // Humains (1-12)
  'John', 'Sarah', 'Mike', 'Emma', 'Lucas', 'Sophie',
  'Tom', 'Lily', 'Max', 'Anna', 'Leo', 'Mia',
  // Animaux (13-24)
  'Chat', 'Chien', 'Panda', 'Renard', 'Ours', 'Lapin',
  'Hibou', 'Lion', 'Tigre', 'Pingouin', 'Singe', 'Koala',
  // Robots (25-36)
  'Robot 1', 'Robot 2', 'Robot 3', 'Robot 4', 'Robot 5', 'Robot 6',
  'Robot 7', 'Robot 8', 'Robot 9', 'Robot 10', 'Robot 11', 'Robot 12',
  // Fantasy (37-48)
  'Elfe', 'Fée', 'Sorcier', 'Chevalier', 'Dragon', 'Licorne',
  'Sirène', 'Ninja', 'Pirate', 'Vampire', 'Fantôme', 'Alien',
];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, userId, loading } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!loading && !userId) {
      router.push('/auth');
    }
    if (profile) {
      setSelectedAvatar(profile.avatar_url || '');
      setPseudo(profile.pseudo || '');
      setAge(profile.age?.toString() || '');
    }
  }, [profile, userId, loading, router]);

  const handleSave = async () => {
    if (!userId) return;
    
    if (!pseudo.trim()) {
      setMessage({ text: 'Le pseudo est obligatoire', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        pseudo: pseudo.trim(),
        age: age ? parseInt(age) : null,
        avatar_url: selectedAvatar,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setMessage({ text: `Erreur : ${error.message}`, type: 'error' });
    } else {
      setMessage({ text: 'Profil sauvegardé avec succès !', type: 'success' });
      setTimeout(() => router.push('/menu'), 1500);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
        <p className="text-white text-2xl font-bold">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto pt-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/menu')}
            className="flex items-center gap-2 text-white font-bold hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Retour au menu
          </button>
          <h1 className="text-4xl font-black text-yellow-400" style={{ WebkitTextStroke: '2px #9A3412', textShadow: '3px 3px 0px #9A3412' }}>
            MON PROFIL
          </h1>
          <div className="w-32"></div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-yellow-400">
          <h2 className="text-3xl font-black text-center mb-2 text-gray-800">Mon Profil</h2>
          <p className="text-center text-gray-600 mb-8">Personnalise ton identité de joueur</p>

          {/* Avatar actuel */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl bg-gray-100">
                {selectedAvatar ? (
                  <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-400 mx-auto mt-8" />
                )}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-sm font-bold px-4 py-1 rounded-full border-2 border-white shadow-lg">
                Ton avatar
              </div>
            </div>
          </div>

          {/* Sélection d'avatar */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Choisis ton avatar</h3>
            <div className="grid grid-cols-6 md:grid-cols-8 gap-3 max-h-96 overflow-y-auto p-2">
              {AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 active:scale-95 overflow-hidden bg-white ${
                    selectedAvatar === avatar 
                      ? 'border-yellow-400 ring-4 ring-yellow-400/50 shadow-lg' 
                      : 'border-gray-300 hover:border-yellow-400'
                  }`}
                  title={AVATAR_LABELS[index]}
                >
                  <img src={avatar} alt={AVATAR_LABELS[index]} className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-yellow-400/20"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pseudo */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Pseudo</label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition-colors text-lg font-bold"
              placeholder="Ton pseudo"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 20 caractères</p>
          </div>

          {/* Âge */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Âge</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={10}
              max={120}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition-colors text-lg"
              placeholder="Ton âge"
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 font-semibold ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border-2 border-green-400' 
                : 'bg-red-100 text-red-800 border-2 border-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* Bouton sauvegarder */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-4 border-yellow-800 shadow-lg text-lg py-6 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder mon profil'}
          </Button>
        </div>
      </div>
    </div>
  );
}