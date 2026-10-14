'use client';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  pseudo: string;
  age: number;
  avatar_url: string;
  xp?: number;        // ← AJOUTE CETTE LIGNE
  level?: number;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  return { profile, loading };
}