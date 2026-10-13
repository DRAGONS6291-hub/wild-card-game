'use client';
import { useSound } from '@/hooks/useSound';

interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SoundButton({ children, onClick, className, ...props }: SoundButtonProps) {
  const { playMenuClick } = useSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. Jouer le son
    playMenuClick();
    // 2. Exécuter l'action du bouton (ex: changer de page)
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className={className} 
      {...props}
    >
      {children}
    </button>
  );
}