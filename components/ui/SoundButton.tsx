'use client';
import { Button, ButtonProps } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { ReactNode, MouseEvent } from 'react';

interface SoundButtonProps extends ButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function SoundButton({ children, onClick, ...props }: SoundButtonProps) {
  const { playClick } = useSound();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    playClick();
    if (onClick) onClick(e);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}