'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart, Diamond, Club } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isForgotPassword) {
      // 🔑 Réinitialisation du mot de passe
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setError('✅ Un lien de réinitialisation a été envoyé à ton email ! Vérifie aussi tes spams.');
      }
      setLoading(false);
      return;
    }

    if (isLogin) {
      // Connexion
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Email ou mot de passe incorrect.");
        setLoading(false);
      } else {
        router.push('/menu');
      }
    } else {
      // Inscription
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setError('✅ Compte créé avec succès ! Redirection...');
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ff6b35_0%,_#d62828_40%,_#6a040f_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,200,0,0.3)_0%,_transparent_60%)]"></div>
      <div className="absolute inset-2 border-4 border-yellow-400/60 rounded-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center -space-x-6 mb-4">
            <div className="bg-white/90 p-2 rounded-lg border-2 border-white w-16 h-24 flex items-center justify-center shadow-xl transform -rotate-12">
              <Heart className="w-10 h-10 text-red-500" fill="currentColor" />
            </div>
            <div className="bg-white/90 p-3 rounded-lg border-2 border-white w-20 h-28 flex items-center justify-center shadow-2xl z-10">
              <Club className="w-14 h-14 text-green-700" fill="currentColor" />
            </div>
            <div className="bg-white/90 p-2 rounded-lg border-2 border-white w-16 h-24 flex items-center justify-center shadow-xl transform rotate-12">
              <Diamond className="w-10 h-10 text-blue-600" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-yellow-400" style={{ WebkitTextStroke: '3px #9A3412', textShadow: '4px 4px 0px #9A3412' }}>
            WILD CARD
          </h1>
        </div>

        {/* Formulaire */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-yellow-400">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {isForgotPassword ? 'Mot de passe oublié ?' : isLogin ? 'Connexion' : 'Inscription'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition-colors"
                placeholder="ton@email.com"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition-colors"
                  placeholder="6 caractères minimum"
                />
                {isLogin && (
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(null); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className={`p-3 rounded-lg text-sm font-semibold text-center ${
                error.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-4 border-yellow-800 shadow-lg text-lg py-6"
            >
              {loading ? 'Chargement...' : isForgotPassword ? 'Envoyer le lien' : isLogin ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {isForgotPassword ? (
              <button
                onClick={() => { setIsForgotPassword(false); setError(null); }}
                className="text-gray-600 hover:text-gray-800 font-semibold text-sm"
              >
                ← Retour à la connexion
              </button>
            ) : (
              <button
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                {isLogin ? "Pas de compte ? Inscris-toi !" : "Déjà un compte ? Connecte-toi !"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}