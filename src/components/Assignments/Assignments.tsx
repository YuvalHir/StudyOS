"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/utils/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Search, 
  AlertCircle,
  Trash2,
  Edit,
  X,
  ClipboardList,
  ArrowUpCircle,
  Circle,
  CalendarDays,
  FileText,
  Tag,
  Book
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  course_id: string;
  course_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  grade?: string;
}

interface AssignmentsProps {
  initialOpenModal?: boolean;
}

const Assignments: React.FC<AssignmentsProps> = ({ initialOpenModal }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (initialOpenModal) {
      handleOpenAdd();
    }
  }, [initialOpenModal]);


  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    course_id: '',
    due_date: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    grade: ''
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, name');
      if (error) throw error;
      return data;
    }
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, courses ( name )')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).map((a: any) => ({ ...a, course_name: a.courses?.name || 'Unknown' }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update(data)
          .eq('id', editingAssignment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assignments')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string, currentStatus: string }) => {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('assignments')
        .update({ status: nextStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    }
  });

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      course_id: '',
      due_date: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      grade: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asgn: Assignment) => {
    setEditingAssignment(asgn);
    setFormData({
      title: asgn.title,
      course_id: asgn.course_id,
      due_date: asgn.due_date ? new Date(asgn.due_date).toISOString().split('T')[0] : '',
      description: asgn.description || '',
      status: asgn.status,
      priority: asgn.priority || 'medium',
      grade: asgn.grade || ''
    });
    setIsModalOpen(true);
  };

  const filteredAssignments = assignments.filter(asgn => {
    const matchesSearch = asgn.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         asgn.course_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asgn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityInfo = (p: string) => {
    switch(p) {
      case 'urgent': return { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10', label: t('urgent'), icon: AlertCircle };
      case 'high': return { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', label: t('high'), icon: ArrowUpCircle };
      case 'medium': return { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', label: t('medium'), icon: Tag };
      case 'low': return { color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-500/10', label: t('low'), icon: Circle };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-500/10', label: t('medium'), icon: Tag };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 px-1 text-right lg:text-left">
        <div>
          <h2 className="text-[34px] font-bold tracking-tight text-foreground">{t('assignments')}</h2>
          <p className="text-[17px] text-foreground/40 font-medium mt-1 uppercase tracking-tight">{t('academicTaskManager')}</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} className="!px-6 !py-2.5 flex items-center gap-2 shadow-lg shadow-system-blue/20 active:scale-95 transition-all">
          <Plus size={18} />
          {t('newAssignment')}
        </Button>
      </header>

      {/* Advanced Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 px-1">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-system-blue transition-colors" size={18} />
          <input 
            placeholder={t('searchTasks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:border-system-blue/50 transition-all text-[15px] font-medium shadow-sm"
          />
        </div>
        <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
           {(['all', 'pending', 'completed'] as const).map((s) => (
             <button
               key={s}
               onClick={() => setStatusFilter(s)}
               className={`px-6 py-2 rounded-xl text-[13px] font-bold transition-all ${statusFilter === s ? 'bg-white dark:bg-system-tertiary shadow-sm text-foreground' : 'text-foreground/40 hover:text-foreground/60'}`}
             >
               {t(s)}
             </button>
           ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-black/5 dark:border-white/5 border-t-system-blue rounded-full animate-spin"></div>
          </div>
        ) : filteredAssignments.length > 0 ? (
          filteredAssignments.map(asgn => {
            const priority = getPriorityInfo(asgn.priority);
            return (
              <Card key={asgn.id} className="p-0 border-none glass !bg-system-background/40 dark:!bg-white/5 overflow-hidden group hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-stretch min-h-[100px]">
                  {/* Status Interaction Area */}
                  <button 
                    onClick={() => toggleStatusMutation.mutate({ id: asgn.id, currentStatus: asgn.status })}
                    className={`w-16 flex items-center justify-center border-r border-black/5 dark:border-white/5 transition-colors ${asgn.status === 'completed' ? 'bg-system-blue/10 text-system-blue' : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/20 hover:text-system-blue'}`}
                  >
                    {asgn.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>

                  {/* Content Area */}
                  <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0" onClick={() => handleOpenEdit(asgn)}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded-lg ${priority.bg} ${priority.color} text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1`}>
                          <priority.icon size={10} strokeWidth={3} />
                          {priority.label}
                        </span>
                        <span className="text-[12px] font-bold text-foreground/30 uppercase tracking-widest">{asgn.course_name}</span>
                      </div>
                      <h3 className={`text-[18px] font-bold leading-tight truncate ${asgn.status === 'completed' ? 'line-through text-foreground/20' : 'text-foreground/90'}`}>
                        {asgn.title}
                      </h3>
                      {asgn.description && (
                        <p className="text-[14px] font-medium text-foreground/40 mt-1 line-clamp-1">{asgn.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-extrabold text-foreground/20 uppercase tracking-[0.1em]">{t('deadline')}</div>
                        <div className={`flex items-center gap-1.5 text-[14px] font-bold tracking-tight ${asgn.due_date && new Date(asgn.due_date) < new Date() && asgn.status !== 'completed' ? 'text-system-red' : 'text-foreground/60'}`}>
                          <CalendarDays size={14} className="opacity-40" />
                          {asgn.due_date ? new Date(asgn.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : t('flexible')}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(asgn); }} className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-system-blue rounded-xl transition-all">
                            <Edit size={18} />
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); if(confirm(t('deleteResourceConfirm'))) deleteMutation.mutate(asgn.id); }} className="p-2.5 hover:bg-system-red/10 text-foreground/40 hover:text-system-red rounded-xl transition-all">
                            <Trash2 size={18} />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-20 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
               <ClipboardList size={48} className="text-foreground/10" />
            </div>
            <p className="text-[19px] font-bold text-foreground/30 tracking-tight uppercase">
              {searchQuery ? t('noMatchingTasks') : t('allAssignmentsClear')}
            </p>
            <p className="text-[15px] font-medium text-foreground/20 mt-1 uppercase tracking-widest">
              {searchQuery ? t('tryDifferentSearch') : t('timeToRelax')}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={handleOpenAdd} className="mt-8 !px-10 shadow-xl shadow-system-blue/20">
                {t('addFirstAssignment')}
              </Button>
            )}
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-xl max-h-[90vh] p-0 glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl border-none overflow-hidden scale-100 animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {editingAssignment ? t('editAssignment') : t('newAssignment')}
                </h3>
                <p className="text-[13px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">{t('detailsAndPlanning')}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                 <X size={20} className="text-foreground/40" />
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* Main Info */}
              <div className="space-y-6">
                <Input 
                  label={t('title')} 
                  placeholder="e.g. Research Paper: AI in Ethics" 
                  className="!text-lg !font-bold"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 text-right lg:text-left">
                    <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Book size={14} /> {t('subject')}
                    </label>
                    <select 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[15px] font-medium"
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    >
                      <option value="">{t('selectSubject')}</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-right lg:text-left">
                    <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} /> {t('dueDate')}
                    </label>
                    <input 
                      type="date"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[15px] font-medium"
                      value={formData.due_date}
                      onChange={e => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 text-right lg:text-left">
                  <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('status')}</label>
                  <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                    {(['pending', 'completed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setFormData({...formData, status: s})}
                        className={`flex-1 py-2 text-[12px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${formData.status === s ? 'bg-white dark:bg-system-tertiary shadow-sm text-system-blue' : 'text-foreground/30 hover:text-foreground/50'}`}
                      >
                        {t(s)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 text-right lg:text-left">
                  <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('priority')}</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'urgent'] as const).map(p => {
                      const isActive = formData.priority === p;
                      return (
                        <button
                          key={p}
                          title={t(p)}
                          onClick={() => setFormData({...formData, priority: p})}
                          className={`flex-1 h-10 rounded-xl border transition-all flex items-center justify-center ${isActive ? 'bg-system-blue border-system-blue text-white shadow-lg shadow-system-blue/20 scale-105' : 'border-black/5 dark:border-white/10 text-foreground/30 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                          {p === 'urgent' && <AlertCircle size={18} />}
                          {p === 'high' && <ArrowUpCircle size={18} />}
                          {p === 'medium' && <Tag size={18} />}
                          {p === 'low' && <Circle size={18} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Extra Details */}
              <div className="space-y-4 text-right lg:text-left">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> {t('taskDescription')}
                  </label>
                  <textarea 
                    placeholder="Break down the task or add useful reminders..."
                    className="w-full h-32 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[15px] font-medium resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1.5 text-right lg:text-left">
                  <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('grade')} ({t('optional')})</label>
                  <Input 
                    placeholder="e.g. A, 95, P"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 flex gap-3">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 !bg-black/5 dark:!bg-white/5 !text-foreground/60 border-none">
                {t('discardChanges')}
              </Button>
              <Button 
                variant="primary" 
                onClick={() => saveMutation.mutate(formData)} 
                disabled={saveMutation.isPending || !formData.title || !formData.course_id}
                className="flex-[2] shadow-xl shadow-system-blue/20"
              >
                {saveMutation.isPending ? t('processing') : (editingAssignment ? t('saveChanges') : t('createAssignment'))}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Assignments;
