"use client";

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white dark:bg-white/5 rounded-2xl border border-black/[0.05] dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
