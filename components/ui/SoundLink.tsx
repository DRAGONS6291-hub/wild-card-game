'use client';
import Link from 'next/link';
import { useSound } from '@/hooks/useSound';
import { ReactNode } from 'react';

interface SoundLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SoundLink({ href, children, className }: SoundLinkProps) {
  const { playClick } = useSound();

  return (
    <Link 
      href={href} 
      className={className}
      onClick={playClick}
    >
      {children}
    </Link>
  );
}