"use client";

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-foreground/50 ml-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-black/[0.03] dark:bg-white/5 border border-black/[0.05] dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:bg-white dark:focus:bg-white/10 focus:border-system-blue/50 focus:ring-4 focus:ring-system-blue/10 transition-all text-[15px] text-foreground ${className}`}
        {...props}
      />
    </div>
  );
};
