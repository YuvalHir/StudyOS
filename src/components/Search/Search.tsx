"use client";

import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { supabase } from '@/utils/supabase/client';
import { useTranslation } from 'react-i18next';
import { 
  Search as SearchIcon, 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Folder, 
  Book, 
  ClipboardList 
} from 'lucide-react';

interface SearchProps {
  onNavigate: (tab: 'dashboard' | 'schedule' | 'assignments' | 'resources' | 'courses' | 'course-focus', courseId?: string) => void;
}

const Search: React.FC<SearchProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [assignments, setAssignments] = useState<{ id: string; title: string; course_name?: string }[]>([]);
  const [resources, setResources] = useState<{ id: string; title: string; type: string; course_name?: string }[]>([]);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const { data: coursesData } = await supabase.from('courses').select('id, name');
      setCourses(coursesData || []);

      const { data: asgnData } = await supabase.from('assignments').select('*, courses(name)');
      setAssignments((asgnData || []).map((a: any) => ({
        ...a,
        course_name: a.courses?.name
      })));

      const { data: resData } = await supabase.from('resources').select('*, courses(name)');
      setResources((resData || []).map((r: any) => ({
        ...r,
        course_name: r.courses?.name
      })));
    } catch (e) {
      console.error("Search fetch error:", e);
    }
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const isRTL = i18n.language?.startsWith('he') || false;

  return (
    <div className="search-wrapper">
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={t('spotlightSearch')}
        className="fixed inset-0 z-[1000] flex items-start justify-center pt-[20vh] bg-black/20 dark:bg-black/40 backdrop-blur-[8px] p-4 animate-in fade-in duration-300"
      >
        <div className="w-full max-w-[640px] glass !bg-white/80 dark:!bg-[#1c1c1e]/80 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-black/5 dark:border-white/10">
          <div className={`flex items-center border-b border-black/5 dark:border-white/10 px-4 py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <SearchIcon size={20} className="opacity-40 mx-2" />
            <Command.Input
              placeholder={t('searchAnything')}
              className={`flex-1 bg-transparent outline-none text-[19px] font-medium text-foreground ${isRTL ? 'text-right' : ''}`}
              value={query}
              onValueChange={setQuery}
            />
            <div className="flex gap-1">
              <kbd className="bg-black/5 dark:bg-white/10 text-foreground/50 px-1.5 py-0.5 rounded text-[11px] font-bold">⌘</kbd>
              <kbd className="bg-black/5 dark:bg-white/10 text-foreground/50 px-1.5 py-0.5 rounded text-[11px] font-bold">K</kbd>
            </div>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="p-8 text-center text-foreground/30 font-medium">
              {t('noResults')}
            </Command.Empty>

          <Command.Group heading={t('navigation')} className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest px-3 py-2">
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate('dashboard'))}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
            >
              <LayoutDashboard size={18} className="opacity-70 group-aria-selected:opacity-100" />
              <span className="font-semibold text-[15px]">{t('dashboard')}</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate('schedule'))}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
            >
              <Calendar size={18} className="opacity-70 group-aria-selected:opacity-100" />
              <span className="font-semibold text-[15px]">{t('schedule')}</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate('assignments'))}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
            >
              <FileText size={18} className="opacity-70 group-aria-selected:opacity-100" />
              <span className="font-semibold text-[15px]">{t('assignments')}</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate('resources'))}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
            >
              <Folder size={18} className="opacity-70 group-aria-selected:opacity-100" />
              <span className="font-semibold text-[15px]">{t('resources')}</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate('courses'))}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
            >
              <Book size={18} className="opacity-70 group-aria-selected:opacity-100" />
              <span className="font-semibold text-[15px]">{t('courses')}</span>
            </Command.Item>
          </Command.Group>

            {courses.length > 0 && (
              <Command.Group heading={t('academicCourses')} className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest px-3 py-2 mt-2 border-t border-black/5 dark:border-white/5 pt-4">
                {courses.map(course => (
                  <Command.Item 
                    key={course.id}
                    onSelect={() => runCommand(() => {
                      onNavigate('course-focus', course.id);
                    })}

                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
                  >
                    <Book size={18} className="opacity-70 group-aria-selected:opacity-100" />
                    <span className="font-semibold text-[15px]">{course.name}</span>
                    <span className="ml-auto text-[11px] font-bold opacity-30 group-aria-selected:opacity-100 uppercase tracking-tighter bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">{t('subject')}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {assignments.length > 0 && (
              <Command.Group heading={t('academicAssignments')} className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest px-3 py-2 mt-2">
                {assignments.map(asgn => (
                  <Command.Item 
                    key={asgn.id}
                    onSelect={() => runCommand(() => onNavigate('assignments'))}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList size={18} className="opacity-70 group-aria-selected:opacity-100" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[15px]">{asgn.title}</span>
                        <span className="text-[12px] opacity-60 font-medium group-aria-selected:text-white/70">{asgn.course_name}</span>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {resources.length > 0 && (
              <Command.Group heading={t('learningResources')} className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest px-3 py-2 mt-2">
                {resources.map(res => (
                  <Command.Item 
                    key={res.id}
                    onSelect={() => runCommand(() => onNavigate('resources'))}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer aria-selected:bg-system-blue aria-selected:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="opacity-70 group-aria-selected:opacity-100" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[15px]">{res.title}</span>
                        <span className="text-[12px] opacity-60 font-medium group-aria-selected:text-white/70">
                          {res.type.toUpperCase()} • {res.course_name}
                        </span>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-4 text-[11px] font-bold text-foreground/30">
              <div className="flex items-center gap-1.5">
                <kbd className="bg-black/5 dark:bg-white/10 px-1 rounded shadow-sm">⏎</kbd> {t('toSelect')}
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="bg-black/5 dark:bg-white/10 px-1 rounded shadow-sm">↑↓</kbd> {t('toNavigate')}
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="bg-black/5 dark:bg-white/10 px-1 rounded shadow-sm">esc</kbd> {t('toClose')}
              </div>
            </div>
            <div className="text-[11px] font-bold text-system-blue/60 tracking-tight uppercase">StudyOS Spotlight</div>
          </div>
        </div>
      </Command.Dialog>
    </div>
  );
};

export default Search;
