"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/utils/supabase/client';
import { Quote, Book, Calendar, CheckSquare, Sparkles, ArrowLeft, Mail, Lock, User, GraduationCap, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const isRTL = i18n.language?.startsWith('he');

  useEffect(() => {
    setMounted(true);
    setQuoteIndex(2); // Specific quote from screenshot
    const dir = i18n.language?.startsWith('he') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language?.startsWith('he') ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    const dir = newLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = newLang;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: name || email.split('@')[0]
            }
          }
        });
        if (authError) throw authError;
        alert(t('checkEmail'));
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const quotes = t('quotes', { returnObjects: true }) as { text: string; author: string }[];
  const currentQuote = quotes?.[quoteIndex] || quotes?.[0] || { text: '', author: '' };

  const features = [
    { icon: Book, label: t('courses'), desc: isRTL ? 'ניהול מקצועות' : 'Organize courses' },
    { icon: Calendar, label: t('schedule'), desc: isRTL ? 'תכנון שבועי' : 'Weekly planning' },
    { icon: CheckSquare, label: t('assignments'), desc: isRTL ? 'מעקב משימות' : 'Track assignments' },
    { icon: Sparkles, label: t('resources'), desc: isRTL ? 'ספרייה דיגיטלית' : 'Digital library' },
  ];

  if (!mounted) return null;

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`h-screen flex flex-col lg:flex-row bg-black text-white selection:bg-blue-500/30 overflow-hidden ${isRTL ? 'lg:flex-row-reverse' : ''}`}
    >
      {/* Language Switcher Floating */}
      <div className={`absolute top-4 ${isRTL ? 'left-6' : 'right-6'} z-50`}>
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
        >
          <Languages size={12} />
          {i18n.language?.startsWith('he') ? 'English' : 'עברית'}
        </button>
      </div>

      {/* Left Panel - Branding & Visuals */}
      <motion.div 
        initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[50%] p-8 xl:p-10 relative z-10"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">StudyOS</h1>
            <p className="text-slate-400 font-medium text-xs tracking-tight">{isRTL ? 'ניהול לימודים חכם' : 'Smart Academic Management'}</p>
          </div>
        </div>

        {/* Central Quote Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-[#111] rounded-[1.5rem] p-6 xl:p-8 border border-white/5 shadow-xl relative"
        >
          <Quote size={40} className={`absolute -top-3 ${isRTL ? '-left-3' : '-right-3'} text-white/5`} />
          <blockquote className="space-y-4">
            <p className="text-lg xl:text-xl font-bold text-slate-100 leading-snug italic">
              "{currentQuote.text}"
            </p>
            <footer className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                {currentQuote.author?.charAt(0)}
              </div>
              <span className="text-slate-300 font-bold text-xs tracking-wide">{currentQuote.author}</span>
            </footer>
          </blockquote>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 xl:gap-4">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
              className="bg-[#111] rounded-2xl p-4 xl:p-5 border border-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/90 flex items-center justify-center mb-2 shadow-lg">
                <feature.icon size={16} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-0.5">{feature.label}</h3>
              <p className="text-slate-500 font-medium text-[11px] leading-tight">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Logo Attribution */}
        <div className="flex items-center justify-center gap-2 text-slate-800 text-[10px] font-black tracking-[0.2em] uppercase">
          {t('secBySupabase')}
        </div>
      </motion.div>

      {/* Right Panel - Auth Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 relative z-10"
      >
        <div className="w-full max-w-[380px]">
          {/* Back Action */}
          <button 
            onClick={() => window.history.back()}
            className={`flex items-center gap-2 text-slate-500 hover:text-white mb-4 transition-colors group`}
          >
            <ArrowLeft size={16} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{t('back')}</span>
          </button>

          {/* Form Title */}
          <div className="mb-6 text-center lg:text-start">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 tracking-tighter">
              {isSignUp ? t('createAccount') : t('signIn')}
            </h2>
            <p className="text-slate-400 text-sm xl:text-base font-medium">
              {isSignUp ? t('signupWelcome') : t('loginWelcome')}
            </p>
          </div>

          {/* Form Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-[#d4d4d4] rounded-[2rem] p-6 xl:p-8 shadow-2xl relative overflow-hidden text-slate-900"
          >
            {error && (
              <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
              {isSignUp && (
                <div className="relative group">
                  <User size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder={isRTL ? 'שם מלא' : 'Full name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#e5e5e5] border-2 border-transparent rounded-xl ps-10 pe-4 py-3 outline-none focus:bg-white focus:border-blue-600/50 transition-all text-slate-900 font-bold placeholder:text-slate-500 text-sm"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#e5e5e5] border-2 border-transparent rounded-xl ps-10 pe-4 py-3 outline-none focus:bg-white focus:border-blue-600/50 transition-all text-slate-900 font-bold placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#e5e5e5] border-2 border-transparent rounded-xl ps-10 pe-4 py-3 outline-none focus:bg-white focus:border-blue-600/50 transition-all text-slate-900 font-bold placeholder:text-slate-500 text-sm"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-1 py-3.5 text-base font-black bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('processing')}
                  </span>
                ) : (
                  isSignUp ? t('createAccount') : t('signIn')
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4 relative z-10">
              <div className="flex-1 h-px bg-slate-300" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                {isRTL ? 'או' : 'or'}
              </span>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-white rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-slate-800 text-sm relative z-10"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isRTL ? 'המשך עם Google' : 'Continue with Google'}
            </motion.button>

            <div className="mt-4 text-center relative z-10">
              <button 
                className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
              >
                {isSignUp ? t('haveAccount') : t('noAccount')}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
