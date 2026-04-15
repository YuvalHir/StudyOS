"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Book, 
  ClipboardList, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  ExternalLink,
  ChevronRight,
  MapPin,
  Quote,
  Globe,
  AlertCircle
} from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';

interface DashboardProps {
  onNavigate?: (tab: string, courseId?: string, resourceId?: string) => void;
  onOpenResource?: (resource: { id: string; title: string; type: string; file_key: string }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenResource }) => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        // 1. User (Attempt to get, but don't hang if it fails)
        const { data: userData } = await supabase.auth.getUser();
        const userName = userData?.user?.email?.split('@')[0] || 'Student';

        // 2. Stats
        const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
        const { count: totalAsgnCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true });
        const { count: pendingCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).neq('status', 'completed');

        // 3. Upcoming Assignments
        const { data: assignments } = await supabase
          .from('assignments')
          .select('*, courses(name)')
          .neq('status', 'completed')
          .order('due_date', { ascending: true })
          .limit(3);

        // 4. Today's Classes
        const dayOfWeek = new Date().getDay();
        const { data: slots } = await supabase
          .from('schedule_slots')
          .select('*, courses(name, color)')
          .eq('day_of_week', dayOfWeek)
          .order('start_time', { ascending: true });

        // 5. Recent Resources
        const { data: resources } = await supabase
          .from('resources')
          .select('*, courses(name)')
          .order('uploaded_at', { ascending: false })
          .limit(3);

        return {
          userName,
          stats: {
            courses: coursesCount || 0,
            totalAssignments: totalAsgnCount || 0,
            pending: pendingCount || 0,
          },
          upcomingAssignments: assignments || [],
          todayClasses: slots || [],
          recentResources: resources || []
        };
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  useEffect(() => {
    setMounted(true);
    setQuoteIndex(Math.floor(Math.random() * 5));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  // Get translated quote
  const motivationText = t(`quotes.${quoteIndex}.text`);
  const motivationAuthor = t(`quotes.${quoteIndex}.author`);

  const isSlotPast = (slot: any) => {
    const now = currentTime;
    const [endHour, endMin] = slot.end_time.split(':').map(Number);
    const slotEnd = new Date(now);
    slotEnd.setHours(endHour, endMin, 0, 0);
    return slotEnd < now;
  };

  const isSlotNow = (slot: any) => {
    const now = currentTime;
    const [startHour, startMin] = slot.start_time.split(':').map(Number);
    const [endHour, endMin] = slot.end_time.split(':').map(Number);
    const slotStart = new Date(now);
    slotStart.setHours(startHour, startMin, 0, 0);
    const slotEnd = new Date(now);
    slotEnd.setHours(endHour, endMin, 0, 0);
    return slotStart <= now && slotEnd > now;
  };

  const getCurrentTimeMarker = () => {
    const now = currentTime;
    const hours = now.getHours();
    const mins = now.getMinutes();
    const markerMinutes = hours * 60 + mins;
    return markerMinutes;
  };

  const todayClasses = dashboardData?.todayClasses || [];
  const upcomingClasses = todayClasses.filter((slot: any) => !isSlotPast(slot));
  const currentClass = todayClasses.find((slot: any) => isSlotNow(slot));
  const pastClasses = todayClasses.filter((slot: any) => isSlotPast(slot));

  const stats = dashboardData?.stats || { courses: 0, totalAssignments: 0, pending: 0 };
  const completionRate = stats.totalAssignments > 0 
    ? ((stats.totalAssignments - stats.pending) / stats.totalAssignments) * 100 
    : 0;

  const statsConfig = [
    { label: t('courses'), value: stats.courses, icon: Book, color: 'bg-blue-500', tab: 'courses' },
    { label: t('assignments'), value: stats.pending, icon: ClipboardList, color: 'bg-orange-500', tab: 'assignments' },
    { label: t('completed'), value: stats.totalAssignments - stats.pending, icon: CheckCircle2, color: 'bg-green-500', tab: 'assignments' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20 px-1">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-3 animate-bounce">
           <AlertCircle size={18} /> {t('errorLoadingDashboard') || 'Session might be expired. Please refresh or sign in again.'}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
        <header className="flex flex-col items-start">
          <div className="flex flex-col mb-4">
             <h1 className="text-[24px] font-bold text-system-blue tracking-tight uppercase opacity-80 mb-[-8px] ml-1">
               {t('welcome')} {dashboardData?.userName}
             </h1>
             <div className="text-[84px] font-bold tracking-tighter leading-none text-foreground/90 tabular-nums">
               {currentTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false })}
             </div>
          </div>
          <div className="text-[24px] font-bold text-foreground/40 ml-1 tracking-tight uppercase">
            {currentTime.toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <Card className="max-w-md p-6 glass !bg-system-blue/5 border-system-blue/10 relative overflow-hidden group">
           <Quote className="absolute -right-2 -top-2 w-20 h-20 text-system-blue/5 transform rotate-12" />
           <p className="text-[17px] font-bold text-foreground/80 leading-relaxed relative z-10 italic">
             "{motivationText}"
           </p>
           <p className="text-[13px] font-extrabold text-system-blue/60 uppercase tracking-widest mt-4 relative z-10 uppercase">
             — {motivationAuthor}
           </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {statsConfig.map((stat, i) => (
          <Card 
            key={i} 
            className="p-6 flex items-center gap-5 hover:scale-[1.02] transition-all cursor-pointer border-none glass !bg-system-background/40 dark:!bg-white/5"
            onClick={() => onNavigate?.(stat.tab)}
          >
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5`}>
              <stat.icon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[28px] font-bold leading-none tracking-tight tabular-nums">{stat.value}</div>
              <div className="text-[14px] font-bold text-foreground/30 uppercase tracking-widest mt-1.5">{stat.label}</div>
            </div>
          </Card>
        ))}
        
        <Card className="p-6 flex items-center gap-5 hover:scale-[1.02] transition-all cursor-default border-none glass !bg-system-background/40 dark:!bg-white/5">
          <ProgressRing radius={32} stroke={5} progress={completionRate} className="text-system-blue" />
          <div>
            <div className="text-[28px] font-bold leading-none tracking-tight tabular-nums">{Math.round(completionRate)}%</div>
            <div className="text-[14px] font-bold text-foreground/30 uppercase tracking-widest mt-1.5 uppercase">{t('completion')}</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
             <div className="w-10 h-10 border-4 border-black/5 dark:border-white/5 border-t-system-blue rounded-full animate-spin"></div>
          </div>
        )}

        <section className="space-y-5">
          <div className="flex items-center justify-between px-1 cursor-pointer group" onClick={() => onNavigate?.('schedule')}>
            <div className="flex items-center gap-2">
              <CalendarIcon size={20} className="text-foreground/30 group-hover:text-system-blue transition-colors" />
              <h2 className="text-[20px] font-bold tracking-tight uppercase text-foreground/60 group-hover:text-foreground transition-colors">{t('today')}</h2>
            </div>
            <ChevronRight size={20} className="text-foreground/20 group-hover:text-system-blue transition-all group-hover:translate-x-1" />
          </div>
          
          {todayClasses.length ? (
            <>
              {/* Timeline Header */}
              <div className={`px-1 flex items-center justify-between ${i18n.language?.startsWith('he') ? 'flex-row-reverse' : ''}`}>
                <span className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest">08:00</span>
                <div className="flex-1 mx-2 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                <span className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest">14:00</span>
                <div className="flex-1 mx-2 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                <span className="text-[11px] font-extrabold text-foreground/30 uppercase tracking-widest">20:00</span>
              </div>

              {/* Timeline Bar */}
              <div className={`relative px-1 ${i18n.language?.startsWith('he') ? 'rtl:scale-x-[-1]' : ''}`}>
                {/* Background track */}
                <div className="h-3 rounded-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
                  {/* Past progress */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-foreground/5 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, ((getCurrentTimeMarker()) / (24 * 60)) * 100))}%` }}
                  />
                  {/* Now marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-system-blue z-10"
                    style={{ left: `${Math.min(98, Math.max(2, ((getCurrentTimeMarker()) / (24 * 60)) * 100))}%` }}
                  />
                  {/* Now dot */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-system-blue rounded-full shadow-lg shadow-system-blue/30 animate-pulse z-20"
                    style={{ left: `calc(${Math.min(98, Math.max(2, ((getCurrentTimeMarker()) / (24 * 60)) * 100))}% - 8px)` }}
                  />
                </div>
                
                {/* Time labels on timeline */}
                <div className="relative mt-1">
                  {todayClasses.map((slot: any) => {
                    const [startH, startM] = slot.start_time.split(':').map(Number);
                    const [endH, endM] = slot.end_time.split(':').map(Number);
                    const startMin = startH * 60 + startM;
                    const endMin = endH * 60 + endM;
                    const width = ((endMin - startMin) / (24 * 60)) * 100;
                    const left = (startMin / (24 * 60)) * 100;
                    const isPast = isSlotPast(slot);
                    
                    return (
                      <div 
                        key={slot.id}
                        className="absolute top-0 h-3 rounded-full flex items-center justify-center"
                        style={{ 
                          left: `${left}%`, 
                          width: `${width}%`,
                          backgroundColor: isPast ? `${slot.courses?.color || '#007AFF'}40` : (slot.courses?.color || '#007AFF')
                        }}
                        title={`${slot.courses?.name}: ${slot.start_time} - ${slot.end_time}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Current Time Display */}
              <div className="px-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-system-blue animate-pulse" />
                <span className="text-[12px] font-bold text-system-blue">
                  {currentTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                {currentClass && (
                  <span className="text-[12px] font-bold text-foreground/40">• {currentClass.courses?.name} ({currentClass.start_time} - {currentClass.end_time})</span>
                )}
              </div>

              {/* Class Cards */}
              <div className="space-y-3">
                {currentClass && (
                  <Card onClick={() => onNavigate?.('schedule')} className="p-5 border-none glass !bg-system-blue/5 dark:!bg-system-blue/10 relative overflow-hidden group hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer ring-2 ring-system-blue/30">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: currentClass.courses?.color || '#007AFF' }} />
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-2">
                         <h3 className="font-bold text-[17px] text-foreground">{currentClass.courses?.name}</h3>
                         <span className="px-2 py-0.5 rounded-md bg-system-blue text-white text-[10px] font-extrabold uppercase tracking-tighter animate-pulse">Now</span>
                       </div>
                       <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-foreground/40 uppercase tracking-tighter">{currentClass.type ? t(currentClass.type.toLowerCase()) : t('lecture')}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-foreground/60 text-[13px] font-bold uppercase">
                        <Clock size={14} className="text-foreground/40" />
                        <span>{currentClass.start_time} - {currentClass.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/40 text-[13px] font-bold uppercase">
                        <MapPin size={14} className="text-foreground/20" />
                        <span>{currentClass.room || t('noLocationSet')}</span>
                      </div>
                    </div>
                  </Card>
                )}
                {upcomingClasses.filter(s => s.id !== currentClass?.id).map((slot: any) => (
                  <Card key={slot.id} onClick={() => onNavigate?.('schedule')} className="p-5 border-none glass !bg-white/60 dark:!bg-white/5 relative overflow-hidden group hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: slot.courses?.color || '#007AFF' }} />
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-[17px] text-foreground/90">{slot.courses?.name}</h3>
                       <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-foreground/40 uppercase tracking-tighter">{slot.type ? t(slot.type.toLowerCase()) : t('lecture')}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-foreground/40 text-[13px] font-bold uppercase">
                        <Clock size={14} className="text-foreground/20" />
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/40 text-[13px] font-bold uppercase">
                        <MapPin size={14} className="text-foreground/20" />
                        <span>{slot.room || t('noLocationSet')}</span>
                      </div>
                    </div>
                  </Card>
                ))}
                {pastClasses.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-extrabold text-foreground/20 uppercase tracking-widest mb-2">Passed</p>
                    {pastClasses.map((slot: any) => (
                      <Card key={slot.id} className="p-4 border-none glass !bg-white/30 dark:!bg-white/5 relative overflow-hidden opacity-50">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: slot.courses?.color || '#007AFF' }} />
                        <div className="flex justify-between items-start">
                           <h3 className="font-bold text-[15px] text-foreground/60 line-through">{slot.courses?.name}</h3>
                           <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-foreground/30 uppercase tracking-tighter">{slot.start_time}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <Card className="p-10 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center justify-center h-[200px]">
              <CalendarIcon size={32} className="text-foreground/10 mb-3" />
              <p className="text-[15px] font-bold text-foreground/20 uppercase tracking-widest uppercase">{t('noClassesToday')}</p>
            </Card>
          )}
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-right lg:text-left">
              <ClipboardList size={20} className="text-foreground/30" />
              <h2 className="text-[20px] font-bold tracking-tight uppercase text-foreground/60 text-right lg:text-left">{t('upcoming')}</h2>
            </div>
            <button onClick={() => onNavigate?.('assignments')} className="text-[13px] font-bold text-system-blue hover:opacity-70 tracking-tight uppercase">{t('viewAll')}</button>
          </div>
          <div className="space-y-3">
            {dashboardData?.upcomingAssignments.length ? dashboardData.upcomingAssignments.map((asgn: any) => (
              <Card key={asgn.id} onClick={() => onNavigate?.('assignments')} className="p-5 border-none glass !bg-white/60 dark:!bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${asgn.priority === 'high' || asgn.priority === 'urgent' ? 'bg-system-red animate-pulse' : 'bg-orange-500'}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[16px] text-foreground/90 truncate">{asgn.title}</h3>
                    <p className="text-[13px] font-bold text-foreground/30 truncate uppercase tracking-tight mt-0.5">{asgn.courses?.name}</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-[11px] font-extrabold text-foreground/20 uppercase tracking-tighter">{t('due')}</div>
                    <div className="text-[13px] font-bold text-foreground/60 uppercase">
                      {asgn.due_date ? new Date(asgn.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : t('soon')}
                    </div>
                  </div>
                </div>
              </Card>
            )) : (
              <Card className="p-10 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center justify-center h-[200px]">
                <CheckCircle2 size={32} className="text-foreground/10 mb-3" />
                <p className="text-[15px] font-bold text-foreground/20 uppercase tracking-widest uppercase">{t('tasksCompleted')}</p>
              </Card>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between px-1 cursor-pointer group" onClick={() => onNavigate?.('resources')}>
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-foreground/30 group-hover:text-system-blue transition-colors" />
              <h2 className="text-[20px] font-bold tracking-tight uppercase text-foreground/60 group-hover:text-foreground transition-colors">{t('recent')}</h2>
            </div>
            <ChevronRight size={20} className="text-foreground/20 group-hover:text-system-blue transition-all group-hover:translate-x-1" />
          </div>
          <div className="space-y-3">
            {dashboardData?.recentResources.length ? dashboardData.recentResources.map((res: any) => (
              <Card key={res.id} onClick={() => onOpenResource?.({ id: res.id, title: res.title, type: res.type, file_key: res.file_key })} className="p-4 border-none glass !bg-white/60 dark:!bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-system-blue/5 dark:bg-white/5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    {res.type === 'html' ? <Globe size={18} className="text-green-500"/> : <FileText size={18} className="text-system-blue"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-foreground/90 truncate">{res.title}</h3>
                    <p className="text-[12px] font-bold text-foreground/20 uppercase tracking-tighter truncate">{res.courses?.name}</p>
                  </div>
                  <ExternalLink size={16} className="text-foreground/10 group-hover:text-system-blue transition-colors" />
                </div>
              </Card>
            )) : (
              <Card className="p-10 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center justify-center h-[200px]">
                <FileText size={32} className="text-foreground/10 mb-3" />
                <p className="text-[15px] font-bold text-foreground/20 uppercase tracking-widest uppercase">{t('noResources')}</p>
              </Card>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
