"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/utils/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Clock, 
  MapPin, 
  X, 
  Edit2
} from 'lucide-react';

interface ClassEvent {
  id: string;
  course_id: string;
  course_name: string;
  course_color: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  type?: string;
}

interface ScheduleGridProps {
  initialOpenModal?: boolean;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ initialOpenModal }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialOpenModal) {
      handleOpenAdd();
    }
  }, [initialOpenModal]);

  const [formData, setFormData] = useState<Partial<ClassEvent>>({
    course_id: '',
    day_of_week: 0,
    start_time: '08:00',
    end_time: '09:00',
    room: '',
    type: 'Lecture'
  });

  const days = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
  const timeSlots = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => `${(i + START_HOUR).toString().padStart(2, '0')}:00`);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, name');
      if (error) throw error;
      return data;
    }
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_slots')
        .select('id, day_of_week, start_time, end_time, course_id, room, type, courses ( name, color )');
      
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        course_id: s.course_id,
        course_name: s.courses?.name || 'Unknown',
        course_color: s.courses?.color || '#007AFF',
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        type: s.type
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const cleanData = {
        course_id: data.course_id,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        room: data.room,
        type: data.type
      };

      if (id) {
        const { error } = await supabase
          .from('schedule_slots')
          .update(cleanData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedule_slots').insert([cleanData]);
        if (error) throw error;
      }
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['schedule'] });
      const previousClasses = queryClient.getQueryData(['schedule']);
      
      queryClient.setQueryData(['schedule'], (old: any) => {
        if (!old) return [];
        if (newData.id) {
          return old.map((c: any) => c.id === newData.id ? { ...c, ...newData } : c);
        }
        return [...old, { ...newData, id: 'temp-' + Date.now() }];
      });

      return { previousClasses };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(['schedule'], context?.previousClasses);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedule_slots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    }
  });

  const resetForm = () => {
    setFormData({
      course_id: '',
      day_of_week: 0,
      start_time: '08:00',
      end_time: '09:00',
      room: '',
      type: 'Lecture'
    });
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setFormData({
      course_id: c.course_id,
      day_of_week: c.day_of_week,
      start_time: c.start_time,
      end_time: c.end_time,
      room: c.room || '',
      type: c.type || 'Lecture'
    });
    setEditingId(c.id);
    setIsModalOpen(true);
  };

  const timeToPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours + minutes / 60 - START_HOUR) * HOUR_HEIGHT;
  };

  const positionToTime = (pos: number) => {
    const totalHours = pos / HOUR_HEIGHT + START_HOUR;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 4) * 15;
    
    let h = hours;
    let m = minutes;
    if (m === 60) {
      h += 1;
      m = 0;
    }
    h = Math.max(START_HOUR, Math.min(END_HOUR, h));
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleDragEnd = async (_e: any, info: any, classItem: ClassEvent) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.querySelector('.grid-container')?.getBoundingClientRect();
    if (!gridRect) return;

    const columnWidth = gridRect.width / 7;
    const xOffset = info.point.x - gridRect.left;
    
    let newDay: number;
    if (document.documentElement.dir === 'rtl') {
      newDay = 6 - Math.floor(xOffset / columnWidth);
    } else {
      newDay = Math.floor(xOffset / columnWidth);
    }
    newDay = Math.max(0, Math.min(6, newDay));

    const yOffset = info.point.y - gridRect.top;
    const newStartTime = positionToTime(yOffset);
    
    const startPos = timeToPosition(classItem.start_time);
    const endPos = timeToPosition(classItem.end_time);
    const duration = endPos - startPos;
    const newEndPos = timeToPosition(newStartTime) + duration;
    const newEndTime = positionToTime(newEndPos);

    saveMutation.mutate({
      ...classItem,
      id: classItem.id,
      day_of_week: newDay,
      start_time: newStartTime,
      end_time: newEndTime
    });
  };

  const handleResize = (classItem: ClassEvent, deltaY: number) => {
    const currentEndPos = timeToPosition(classItem.end_time);
    const newEndPos = currentEndPos + deltaY;
    const newEndTime = positionToTime(newEndPos);
    
    if (timeToPosition(newEndTime) <= timeToPosition(classItem.start_time)) return;

    saveMutation.mutate({
      ...classItem,
      id: classItem.id,
      end_time: newEndTime
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 max-h-screen overflow-hidden flex flex-col">
      <header className="flex justify-between items-end px-1 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('schedule')}</h2>
          <p className="text-sm text-foreground/40 font-medium uppercase tracking-tight">{t('academicWeekView')}</p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} className="flex items-center gap-2 shadow-lg active:scale-95 transition-all">
          <Plus size={18} />
          {t('addClass')}
        </Button>
      </header>

      <div 
        ref={gridRef}
        className="glass rounded-[24px] overflow-hidden border-black/5 dark:border-white/5 shadow-xl bg-white/50 dark:bg-black/20 flex-1 flex flex-col min-h-0"
      >
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-black/5 dark:border-white/5 shrink-0 bg-white/40 dark:bg-black/40 z-20">
          <div className="p-3 border-e border-black/5 dark:border-white/5"></div>
          {days.map((day) => (
            <div key={day} className="p-3 text-center text-[10px] font-bold text-foreground/40 uppercase tracking-widest border-e border-black/5 dark:border-white/5 last:border-0">
              {day}
            </div>
          ))}
        </div>

        {/* Scrollable Area */}
        <div className="relative overflow-y-auto flex-1 custom-scrollbar min-h-0">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
            
            {/* Time Sidebar */}
            <div className="relative border-e border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
              {timeSlots.map((time, i) => (
                <div 
                  key={time} 
                  className="absolute w-full flex items-center justify-center text-[10px] font-bold text-foreground/20"
                  style={{ top: i * HOUR_HEIGHT, height: 20, transform: 'translateY(-10px)' }}
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Grid Container */}
            <div className="col-span-7 grid grid-cols-7 relative grid-container">
              {days.map((_, dayIndex) => (
                <div key={dayIndex} className="relative border-e border-black/5 dark:border-white/5 last:border-0">
                  {/* Horizontal lines */}
                  {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-full border-b border-black/[0.03] dark:border-white/[0.03]" 
                      style={{ top: (i + 1) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Events */}
                  {classes
                    .filter(c => c.day_of_week === dayIndex)
                    .map((c) => {
                      const top = timeToPosition(c.start_time);
                      const height = timeToPosition(c.end_time) - top;
                      
                      return (
                        <motion.div
                          key={c.id}
                          drag
                          dragMomentum={false}
                          dragElastic={0}
                          onDragEnd={(e, info) => handleDragEnd(e, info, c)}
                          className="absolute inset-x-0.5 z-10 p-2 rounded-xl shadow-md border border-black/5 dark:border-white/5 group/item cursor-move active:z-30 transition-shadow hover:shadow-lg overflow-hidden flex flex-col"
                          style={{ 
                            top, 
                            height, 
                            backgroundColor: `${c.course_color}25`,
                          }}
                        >
                          <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: c.course_color }} />
                          
                          <div className="flex justify-between items-start gap-1">
                            <div 
                              className="text-[11px] font-bold leading-tight break-words line-clamp-2" 
                              style={{ color: c.course_color }}
                            >
                              {c.course_name}
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-all shrink-0">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }}
                                className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-system-blue rounded transition-all"
                              >
                                <Edit2 size={10} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm(t('removeClassName'))) deleteMutation.mutate(c.id); }}
                                className="p-0.5 hover:bg-system-red/10 text-system-red rounded transition-all"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </div>

                          <div className="text-[9px] font-bold text-foreground/40 uppercase tracking-tighter mt-1 flex items-center gap-1">
                            <Clock size={8} /> {c.start_time} - {c.end_time}
                          </div>
                          
                          {height > 40 && c.room && (
                            <div className="text-[9px] font-bold text-foreground/30 uppercase tracking-tighter mt-0.5 flex items-center gap-1 truncate">
                              <MapPin size={8} /> {c.room}
                            </div>
                          )}

                          {/* Resize Handle */}
                          <div 
                            className="absolute bottom-0 inset-x-0 h-2 cursor-ns-resize flex items-center justify-center group/handle hover:bg-black/5 dark:hover:bg-white/5"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startY = e.pageY;
                              const onMouseUp = (upEvent: MouseEvent) => {
                                const deltaY = upEvent.pageY - startY;
                                if (Math.abs(deltaY) > 5) handleResize(c, deltaY);
                                window.removeEventListener('mouseup', onMouseUp);
                              };
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          >
                            <div className="w-4 h-0.5 bg-black/10 dark:bg-white/10 rounded-full" />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-0 glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl border-none flex flex-col overflow-hidden">
            <div className="p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground uppercase">{editingId ? t('editClass') || 'Edit Slot' : t('newWeeklySlot')}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-foreground/40" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{t('subject')}</label>
                <select 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-sm font-medium"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                >
                  <option value="">{t('selectSubject')}</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{t('day')}</label>
                  <select 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-sm font-medium"
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  >
                    {days.map((day, i) => <option key={i} value={i}>{day}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{t('status')}</label>
                  <select 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-sm font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Lecture">{t('lecture')}</option>
                    <option value="Tutorial">{t('tutorial') || 'Tutorial'}</option>
                    <option value="Lab">{t('lab') || 'Lab'}</option>
                    <option value="Seminar">{t('seminar') || 'Seminar'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label={t('startsAt')} type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                <Input label={t('endsAt')} type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
              </div>
              
              <Input label={t('room')} placeholder="e.g. Auditorium 2, Zoom" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} />
            </div>

            <div className="p-5 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 flex gap-3 shrink-0">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 !bg-black/5 dark:!bg-white/5 !text-foreground/60 border-none">{t('cancel')}</Button>
              <Button 
                variant="primary" 
                onClick={() => saveMutation.mutate({ ...formData, id: editingId })} 
                disabled={saveMutation.isPending || !formData.course_id}
                className="flex-[2] shadow-xl"
              >
                {saveMutation.isPending ? t('saving') : (editingId ? t('saveChanges') || 'Save Changes' : t('addToCalendar'))}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScheduleGrid;
