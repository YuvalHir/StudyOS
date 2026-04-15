"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const lang = i18n.language || 'he';
    const dir = lang.startsWith('he') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.body.dir = dir;
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="fixed top-6 end-6 z-50 flex gap-1 p-1 rounded-full glass border-black/5 dark:border-white/10 shadow-lg">
        <button 
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${mounted && i18n.language === 'en' ? 'bg-white dark:bg-white/10 shadow-sm scale-105 text-foreground' : 'text-foreground/40 hover:text-foreground/60'}`}
          onClick={() => i18n.changeLanguage('en')}
        >
          EN
        </button>
        <button 
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${mounted && (i18n.language === 'he' || !i18n.language) ? 'bg-white dark:bg-white/10 shadow-sm scale-105 text-foreground' : 'text-foreground/40 hover:text-foreground/60'}`}
          onClick={() => i18n.changeLanguage('he')}
        >
          עב
        </button>
      </div>
      {children}
    </div>
  );
};

export default Layout;
