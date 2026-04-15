"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ScheduleGrid from '@/components/Schedule/ScheduleGrid';
import Dashboard from '@/components/Dashboard/Dashboard';
import Assignments from '@/components/Assignments/Assignments';
import Resources from '@/components/Resources/Resources';
import Courses from '@/components/Courses/Courses';
import CourseFocus from '@/components/Courses/CourseFocus';
import Search from '@/components/Search/Search';
import QuickActions from '@/components/QuickActions';
import ResourceViewer from '@/components/ui/ResourceViewer';
import { supabase } from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Folder, 
  Book, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X,
  Bell
} from 'lucide-react';

interface AppClientProps {
  session: Session | null;
}

type TabType = 'dashboard' | 'schedule' | 'assignments' | 'resources' | 'courses' | 'course-focus';

export default function AppClient({ session: initialSession }: AppClientProps) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [initialResourceId, setInitialResourceId] = useState<string | null>(null);
  const [directResource, setDirectResource] = useState<{ id: string; title: string; type: string; file_key: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const validateUser = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) setSession(currentSession);
        else setSession(null);
      } catch (err) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    validateUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        setSession(newSession);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const switchTab = (tab: TabType, courseId: string | null = null, resourceId: string | null = null) => {
    if (tab === 'course-focus' && courseId) {
      setSelectedCourseId(courseId);
    }

    if (tab === 'resources' && resourceId) {
      setInitialResourceId(resourceId);
    } else {
      setInitialResourceId(null);
    }

    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  const openResourceDirectly = (resource: { id: string; title: string; type: string; file_key: string }) => {
    setDirectResource(resource);
  };

  const handleQuickAction = (action: string) => {
    if (action === 'assignment') {
      switchTab('assignments');
    } else if (action === 'class') {
      switchTab('schedule');
    } else if (action === 'resource') {
      switchTab('resources');
    }
  };

  if (loading && !session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-system-background">
        <div className="w-10 h-10 border-4 border-black/5 dark:border-white/5 border-t-system-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <div className="h-screen w-screen flex items-center justify-center">Authenticating...</div>;

  const getNavItems = () => [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
    { id: 'courses', label: t('mySubjects'), icon: <Book size={18} /> },
    { id: 'schedule', label: t('schedule'), icon: <Calendar size={18} /> },
    { id: 'assignments', label: t('assignments'), icon: <FileText size={18} /> },
    { id: 'resources', label: t('resources'), icon: <Folder size={18} /> },
  ];

  return (
    <Layout>
      <Search onNavigate={(tab, courseId) => switchTab(tab as any, courseId)} />
      
      <div className="flex h-screen overflow-hidden bg-system-background text-foreground relative">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass !bg-system-tertiary/80 border-b border-black/5 dark:border-white/10 z-30 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-system-blue rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-[17px] font-bold tracking-tight text-foreground">StudyOS</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative">
              <Bell size={20} className="text-foreground/40" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-system-red rounded-full border-2 border-system-tertiary"></span>
            </button>
            <QuickActions onAction={handleQuickAction} />
            <button 
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* macOS Style Sidebar */}
        <nav className={`w-64 glass !bg-system-tertiary/95 md:!bg-system-tertiary/60 !border-r border-black/5 dark:border-white/10 flex flex-col p-4 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 px-3 py-2 md:py-4">
              <div className="w-8 h-8 bg-system-blue rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className="text-[19px] font-bold tracking-tight text-foreground">StudyOS</span>
            </div>
            <button 
              className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <QuickActions onAction={handleQuickAction} />
          </div>
          
          <div className="flex-1 flex flex-col gap-1">
            {mounted && getNavItems().map((item) => (
              <button 
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-bold transition-all duration-200 ${
                  currentTab === item.id 
                    ? 'bg-system-secondary text-foreground shadow-sm scale-[1.02] border border-black/5 dark:border-white/5' 
                    : 'text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                }`}
                onClick={() => switchTab(item.id as any)}
              >
                <span className="opacity-80">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10 px-2 text-foreground">
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full mb-4 flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-bold transition-all duration-200 text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              >
                <span>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</span>
                {theme === 'dark' ? t('switchToLight') : t('switchToDark')}
              </button>
            )}

            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full border border-black/10 dark:border-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold truncate max-w-[120px]">
                  {session.user.email?.split('@')[0]}
                </span>
                {mounted && (
                  <span className="text-[10px] text-foreground/30 font-extrabold uppercase tracking-widest uppercase">{t('proPlan')}</span>
                )}
              </div>
            </div>
            {mounted && (
              <button 
                className="w-full text-left px-3 py-2 text-[13px] font-bold text-system-red hover:bg-system-red/10 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-tight"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                {t('signOut')}
              </button>
            )}
          </div>
        </nav>
        
        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass !bg-system-tertiary/90 border-t border-black/5 dark:border-white/10 z-30 flex items-center px-2 justify-around">
          {mounted && getNavItems().map((item) => (
            <button 
              key={item.id}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                currentTab === item.id 
                  ? 'text-system-blue scale-110' 
                  : 'text-foreground/40'
              }`}
              onClick={() => switchTab(item.id as any)}
            >
              <div className={currentTab === item.id ? 'opacity-100' : 'opacity-70'}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-system-background relative pt-16 md:pt-0 pb-20 md:pb-0">
          {/* Desktop Top Actions */}
          <div className="hidden md:flex absolute top-6 end-8 z-20 items-center gap-3">
            <button className="p-2.5 rounded-full glass border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group relative">
              <Bell size={20} className="text-foreground/40 group-hover:text-foreground transition-colors" />
              <span className="absolute top-2.5 end-2.5 w-2 h-2 bg-system-red rounded-full border-2 border-system-tertiary"></span>
            </button>
          </div>

          <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-1000">
            {currentTab === 'dashboard' && <Dashboard onNavigate={(tab, cid, rid) => switchTab(tab as any, cid, rid)} onOpenResource={openResourceDirectly} />}
            {currentTab === 'schedule' && <ScheduleGrid />}
            {currentTab === 'assignments' && <Assignments />}
            {currentTab === 'resources' && <Resources initialResourceId={initialResourceId} />}
            {currentTab === 'courses' && <Courses onCourseFocus={(id) => switchTab('course-focus', id)} />}
            {currentTab === 'course-focus' && selectedCourseId && (
              <CourseFocus courseId={selectedCourseId} onBack={() => setCurrentTab('courses')} />
            )}
          </div>
        </main>
      </div>

      {directResource && (
        <ResourceViewer
          title={directResource.title}
          fileKey={directResource.file_key}
          type={directResource.type}
          onClose={() => setDirectResource(null)}
        />
      )}
    </Layout>
  );
}
