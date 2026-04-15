"use client";

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "rounded-xl px-6 py-2.5 font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    default: "bg-black/[0.05] dark:bg-white/5 text-foreground hover:bg-black/[0.08] dark:hover:bg-white/10",
    primary: "bg-system-blue text-white shadow-lg shadow-system-blue/20 hover:brightness-110",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
