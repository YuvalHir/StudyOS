"use client";

import React, { useState, useRef } from 'react';
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
  Bell,
  Camera,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsProps {
  fullName: string;
  avatarUrl?: string;
  email: string;
  onUpdateProfile: (name: string, avatarUrl?: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ fullName, avatarUrl, email, onUpdateProfile }) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [name, setName] = useState(fullName);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
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
      onUpdateProfile(name, avatar);
      setSuccess(t('profileUpdated'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to 'resources' bucket
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatar(publicUrl);
      onUpdateProfile(name, publicUrl);
      setSuccess(t('avatarUpdated'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(t('passwordUpdated'));
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
          {t('settings')}
        </h1>
        <p className="text-foreground/40 font-bold mt-2 uppercase tracking-widest text-sm">
          {t('manageYourAccount')}
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
            <h2 className="text-xl font-bold tracking-tight">{t('profile')}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border-4 border-white dark:border-white/10 overflow-hidden shadow-xl">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20">
                      <User size={40} />
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-system-blue text-white rounded-full shadow-lg hover:scale-110 transition-all"
                  title={t('changeAvatar')}
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <p className="text-[11px] font-black text-foreground/20 uppercase tracking-widest">{t('changeAvatar')}</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest mb-1.5 block">
                  {t('email')}
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
                  {t('fullName')}
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
                <Save size={18} /> {t('saveChanges')}
              </button>
            </form>
          </Card>
        </section>

        {/* Security Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lock size={20} className="text-foreground/30" />
            <h2 className="text-xl font-bold tracking-tight">{t('security')}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest mb-1.5 block">
                  {t('newPassword')}
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
                  {t('confirmPassword')}
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
                <Lock size={18} /> {t('updatePassword')}
              </button>
            </form>
          </Card>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layout size={20} className="text-foreground/30" />
            <h2 className="text-xl font-bold tracking-tight">{t('preferences')}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-system-blue/10 text-system-blue">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t('appearance')}</h4>
                  <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-tight">{t('themeSettings')}</p>
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
                  <h4 className="font-bold text-sm">{t('language')}</h4>
                  <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-tight">{t('localizationSettings')}</p>
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
            <h2 className="text-xl font-bold tracking-tight">{t('notifications')}</h2>
          </div>
          <Card className="p-6 glass !bg-white/60 dark:!bg-white/5 border-none opacity-50 cursor-not-allowed">
            <div className="flex flex-col items-center justify-center text-center py-4">
              <Bell size={32} className="text-foreground/10 mb-2" />
              <p className="text-[13px] font-bold text-foreground/40">{t('notificationsComingSoon')}</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Settings;
