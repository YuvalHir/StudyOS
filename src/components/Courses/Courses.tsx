"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/utils/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  User, 
  Hash, 
  ChevronRight, 
  Search, 
  GraduationCap,
  X
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  lecturer: string | null;
  credits: number | null;
  progress?: number;
}

interface CoursesProps {
  onCourseFocus?: (id: string) => void;
}

const Courses: React.FC<CoursesProps> = ({ onCourseFocus }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#3b82f6',
    lecturer: '',
    credits: 0
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;

      const coursesWithProgress = await Promise.all((coursesData || []).map(async (course) => {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('status')
          .eq('course_id', course.id);
        
        const total = assignments?.length || 0;
        const completed = assignments?.filter(a => a.status === 'completed').length || 0;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { ...course, progress };
      }));

      return coursesWithProgress;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(data)
          .eq('id', editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({ name: '', code: '', color: '#3b82f6', lecturer: '', credits: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code || '',
      color: course.color || '#3b82f6',
      lecturer: course.lecturer || '',
      credits: course.credits || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t('deleteSubjectConfirm'))) return;
    deleteMutation.mutate(id);
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 px-1 text-right lg:text-left">
        <div>
          <h2 className="text-[34px] font-bold tracking-tight text-foreground">{t('courses')}</h2>
          <p className="text-[17px] text-foreground/40 font-medium mt-1 uppercase tracking-tight">{t('academicCurriculum')}</p>    
        </div>
        <Button variant="primary" onClick={handleOpenAdd} className="!px-6 !py-2.5 flex items-center gap-2 shadow-lg shadow-system-blue/20 active:scale-95 transition-all">
          <Plus size={20} />
          {t('newSubject')}
        </Button>
      </header>

      {/* Control Bar */}
      <div className="px-1">
        <div className="relative max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-system-blue transition-colors" size={18} />
          <input 
            placeholder={t('searchSubjects')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:border-system-blue/50 transition-all text-[15px] font-medium shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-black/5 dark:border-white/5 border-t-system-blue rounded-full animate-spin"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card 
              key={course.id} 
              onClick={() => onCourseFocus?.(course.id)}
              className="group relative overflow-hidden p-0 flex flex-col hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 border-none glass !bg-system-background/40 dark:!bg-white/5 cursor-pointer"
            >
              <div className="h-1.5 w-full opacity-80" style={{ backgroundColor: course.color || '#3b82f6' }} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
                    style={{ backgroundColor: course.color || '#3b82f6' }}
                  >
                    <BookOpen size={28} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={(e) => handleOpenEdit(e, course)}
                      className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-system-blue transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, course.id)}
                      className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-system-red transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-[22px] font-bold text-foreground leading-tight mb-1 group-hover:text-system-blue transition-colors">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-2 text-foreground/30 text-[13px] font-bold uppercase tracking-widest">
                    <Hash size={12} />
                    <span>{course.code || t('academic')}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-[11px] font-extrabold text-foreground/20 uppercase tracking-widest mb-2">
                    <span>{t('taskCompletion')}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${course.progress}%`, backgroundColor: course.color || '#007AFF' }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/5 dark:border-white/5">
                     <div className="flex items-center gap-2 text-foreground/50">
                        <User size={14} className="opacity-40" />
                        <span className="text-[13px] font-bold truncate max-w-[100px]">{course.lecturer || t('faculty')}</span>
                     </div>
                     <div className="flex items-center gap-1 text-system-blue font-bold text-[13px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        {t('focus')} <ChevronRight size={14} />
                     </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-20 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
               <GraduationCap size={48} className="text-foreground/10" />
            </div>
            <p className="text-[19px] font-bold text-foreground/30 tracking-tight uppercase">
              {searchQuery ? t('noResults') : t('curriculumEmpty')}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={handleOpenAdd} className="mt-8 !px-10 !py-3 shadow-xl shadow-system-blue/20">
                {t('beginAcademicJourney')}
              </Button>
            )}
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md max-h-[90vh] p-0 glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl border-none flex flex-col overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {editingCourse ? t('editSubject') : t('newSubject')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-foreground/40" />
              </button>
            </div>
            
            <div className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <Input label={t('courseName')} placeholder="e.g. Quantum Physics" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('courseCode')} placeholder="PHY301" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                <Input label={t('lecturer')} placeholder="Prof. Newton" value={formData.lecturer} onChange={e => setFormData({...formData, lecturer: e.target.value})} />
              </div>
              <div className="space-y-2 text-right lg:text-left">
                <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('subjectTheme')}</label>
                <div className="flex flex-wrap gap-2.5 p-1">
                  {[
                    '#3b82f6', '#ef4444', '#22c55e', '#a855f7', 
                    '#f97316', '#ec4899', '#6366f1', '#14b8a6'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({...formData, color})}
                      className={`w-8 h-8 rounded-full transition-all active:scale-90 ${formData.color === color ? 'ring-2 ring-offset-2 ring-system-blue scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-black/5 dark:border-white/5 flex gap-3 shrink-0">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 !bg-black/5 dark:!bg-white/5 !text-foreground/60 border-none">{t('cancel')}</Button>
              <Button variant="primary" onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="flex-1 shadow-lg shadow-system-blue/20">
                {saveMutation.isPending ? t('saving') : (editingCourse ? t('saveChanges') : t('createSubject'))}
              </Button>       
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Courses;
