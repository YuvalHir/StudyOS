"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/utils/supabase/client';
import { useTheme } from 'next-themes';
import { 
  User, 
  Lock, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Globe, 
  Layout, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsProps {
  fullName: string;
  email: string;
  onUpdateProfile: (name: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ fullName, email, onUpdateProfile }) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Profile state
  const [name, setName] = useState(fullName);
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', user.id);

      if (error) throw error;
      onUpdateProfile(name);
      setSuccess(t('profileUpdated') || 'Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(t('passwordUpdated') || 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="px-1">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          <SettingsIcon size={36} className="text-system-blue" />
          {t('settings') || 'Settings'}
        </h1>
        <p className="text-foreground/40 font-bold mt-2 uppercase tracking-widest text-sm">
          {t('manageYourAccount') || 'Manage your account and preferences'}
        </p>
      </header>

      {(error || success) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${
            error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
          }`}
        >
          {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          {error || success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <User size={20} className="text-foreground/30" />
            <h2 className="text-xl font-bold tracking-tight">{t('profile') || 'Profile'}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest mb-1.5 block">
                  {t('email') || 'Email'}
                </label>
                <input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-foreground/40 font-bold text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest mb-1.5 block">
                  {t('fullName') || 'Full Name'}
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-foreground font-bold text-sm focus:ring-2 focus:ring-system-blue/30 outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-system-blue text-white rounded-xl font-black text-sm shadow-lg shadow-system-blue/20 hover:bg-system-blue/90 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> {t('saveChanges') || 'Save Changes'}
              </button>
            </form>
          </Card>
        </section>

        {/* Security Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lock size={20} className="text-foreground/30" />
            <h2 className="text-xl font-bold tracking-tight">{t('security') || 'Security'}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest mb-1.5 block">
                  {t('newPassword') || 'New Password'}
                </label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-foreground font-bold text-sm focus:ring-2 focus:ring-system-blue/30 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest mb-1.5 block">
                  {t('confirmPassword') || 'Confirm Password'}
                </label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-foreground font-bold text-sm focus:ring-2 focus:ring-system-blue/30 outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !newPassword}
                className="w-full py-3.5 bg-foreground text-system-background rounded-xl font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <Lock size={18} /> {t('updatePassword') || 'Update Password'}
              </button>
            </form>
          </Card>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layout size={20} className="text-foreground/30" />
            <h2 className="text-xl font-bold tracking-tight">{t('preferences') || 'Preferences'}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-system-blue/10 text-system-blue">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t('appearance') || 'Appearance'}</h4>
                  <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-tight">{t('themeSettings') || 'Switch between light and dark'}</p>
                </div>
              </div>
              <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                <button 
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${theme === 'light' ? 'bg-white dark:bg-white/10 shadow-sm text-system-blue' : 'text-foreground/30'}`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${theme === 'dark' ? 'bg-white dark:bg-white/10 shadow-sm text-system-blue' : 'text-foreground/30'}`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t('language') || 'Language'}</h4>
                  <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-tight">{t('localizationSettings') || 'Application language'}</p>
                </div>
              </div>
              <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                <button 
                  onClick={() => changeLanguage('he')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${i18n.language === 'he' ? 'bg-white dark:bg-white/10 shadow-sm text-system-blue' : 'text-foreground/30'}`}
                >
                  עברית
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${i18n.language === 'en' ? 'bg-white dark:bg-white/10 shadow-sm text-system-blue' : 'text-foreground/30'}`}
                >
                  English
                </button>
              </div>
            </div>
          </Card>
        </section>

        {/* Notifications (Placeholder) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={20} className="text-foreground/30" />
            <h2 className="text-xl font-bold tracking-tight">{t('notifications') || 'Notifications'}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none opacity-50 cursor-not-allowed">
            <div className="flex flex-col items-center justify-center text-center py-4">
              <Bell size={32} className="text-foreground/10 mb-2" />
              <p className="text-[13px] font-bold text-foreground/40">{t('notificationsComingSoon') || 'Notification settings coming soon'}</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Settings;
