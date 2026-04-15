"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/utils/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ResourceViewer from '@/components/ui/ResourceViewer';
import { 
  Calendar, 
  ClipboardList, 
  Folder, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Plus,
  CheckCircle2,
  X,
  Globe,
  Upload,
  Check,
  Trash2,
  FileText
} from 'lucide-react';

interface CourseFocusProps {
  courseId: string;
  onBack: () => void;
}

const CourseFocus: React.FC<CourseFocusProps> = ({ courseId, onBack }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith('he');
  const [course, setCourse] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Viewer States
  const [isAsgnModalOpen, setIsAsgnModalOpen] = useState(false);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [activeResource, setActiveResource] = useState<any>(null);

  // Form States
  const [newAsgn, setNewAsgn] = useState({ title: '', due_date: '', description: '' });
  const [newRes, setNewRes] = useState({ title: '', file: null as File | null });
  const [newSlot, setNewSlot] = useState({ day_of_week: 0, start_time: '08:00', end_time: '09:00', room: '' });
  const [uploading, setUploading] = useState(false);

  const days = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      console.log('CourseFocus: Fetching data for courseId:', courseId);
      setLoading(true);
      
      const { data: courseData, error: courseError } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseError) {
        console.error('CourseFocus: Course fetch error:', courseError);
        throw courseError;
      }
      setCourse(courseData);

      const { data: slots, error: slotsError } = await supabase.from('schedule_slots').select('*').eq('course_id', courseId);
      if (slotsError) console.error('CourseFocus: Slots fetch error:', slotsError);
      setSchedule(slots || []);

      const { data: asgns, error: asgnsError } = await supabase.from('assignments').select('*').eq('course_id', courseId).order('due_date', { ascending: true });
      if (asgnsError) console.error('CourseFocus: Assignments fetch error:', asgnsError);
      setAssignments(asgns || []);

      const { data: res, error: resError } = await supabase.from('resources').select('*').eq('course_id', courseId).order('uploaded_at', { ascending: false });
      if (resError) console.error('CourseFocus: Resources fetch error:', resError);
      setResources(res || []);
      
      console.log('CourseFocus: Successfully loaded all data');
    } catch (error: any) {
      console.error('CourseFocus: Global error fetching course data:', error);
      // alert(t('errorLoadingData') + ': ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsgn = async () => {
    if (!newAsgn.title) return;
    await supabase.from('assignments').insert([{ ...newAsgn, course_id: courseId, status: 'pending' }]);
    setIsAsgnModalOpen(false);
    setNewAsgn({ title: '', due_date: '', description: '' });
    fetchCourseData();
  };

  const handleAddSlot = async () => {
    await supabase.from('schedule_slots').insert([{ ...newSlot, course_id: courseId }]);
    setIsSlotModalOpen(false);
    setNewSlot({ day_of_week: 0, start_time: '08:00', end_time: '09:00', room: '' });
    fetchCourseData();
  };

  const handleUploadRes = async () => {
    if (!newRes.file) return;
    setUploading(true);
    const file = newRes.file;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const filePath = `${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, file);
    if (uploadError) {
      setUploading(false);
      return alert(uploadError.message);
    }

    await supabase.from('resources').insert([{
      title: newRes.title || file.name,
      course_id: courseId,
      type: fileExt || 'other',
      file_key: filePath,
      category: fileExt === 'html' ? 'html' : 'file'
    }]);

    setUploading(false);
    setIsResModalOpen(false);
    setNewRes({ title: '', file: null });
    fetchCourseData();
  };

  const toggleAsgn = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('assignments').update({ status: nextStatus }).eq('id', id);
    fetchCourseData();
  };

  const deleteResource = async (e: React.MouseEvent, res: any) => {
    e.stopPropagation();
    if (!confirm(t('deleteResourceConfirm'))) return;
    await supabase.storage.from('resources').remove([res.file_key]);
    await supabase.from('resources').delete().eq('id', res.id);
    fetchCourseData();
  };

  if (loading) return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex items-start gap-6 px-1">
        <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-24 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
          </div>
          <div className="h-10 w-64 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-[18px] h-[18px] rounded bg-black/5 dark:bg-white/5 animate-pulse" />
                <div className="h-5 w-24 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
              </div>
              <div className="w-5 h-5 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-5 w-16 rounded-lg bg-system-blue/10" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="h-3 w-32 rounded bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!course) return <div className="p-20 text-center font-bold text-foreground/40">{t('noResults')}</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className={`flex items-start gap-6 px-1 ${isRTL ? 'lg:text-right text-left' : 'text-right lg:text-left'}`}>
        <button 
          onClick={onBack}
          className={`p-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 text-foreground/40 hover:text-foreground`}
        >
          <ArrowLeft size={24} className={isRTL ? 'rtl:rotate-180' : ''} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2 py-0.5 rounded-lg bg-system-blue/10 text-system-blue text-[11px] font-bold uppercase tracking-wider">
              {course.code || t('academic')}
            </span>
            <span className="text-[13px] font-bold text-foreground/20">• {course.lecturer || t('faculty')}</span>
          </div>
          <h2 dir="auto" className="text-[34px] font-bold tracking-tight text-foreground leading-tight">{course.name}</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Schedule */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-foreground/60">
              <Calendar size={18} />
              <h3 className="text-[17px] font-bold tracking-tight uppercase">{t('schedule')}</h3>
            </div>
            <button onClick={() => setIsSlotModalOpen(true)} className="text-system-blue hover:opacity-70"><Plus size={20}/></button>
          </div>
          <div className="space-y-3">
            {schedule.length > 0 ? schedule.map(slot => (
              <Card key={slot.id} className="p-5 flex flex-col gap-3 border-none glass !bg-system-background/60 dark:!bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-foreground/80">{days[slot.day_of_week]}</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-system-blue/10 text-system-blue text-[11px] font-bold uppercase tracking-tighter">
                    <Clock size={12} /> {slot.start_time}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-foreground/40">
                  <MapPin size={14} />
                  <span className="text-[13px] font-medium">{slot.room || t('noLocationSet')}</span>
                </div>
              </Card>
            )) : (
              <Card className="p-10 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center">
                <Calendar size={24} className="text-foreground/10 mb-2" />
                <p className="text-[14px] font-medium text-foreground/20 uppercase tracking-widest text-center">{t('noClasses')}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Assignments */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-foreground/60">
              <ClipboardList size={18} />
              <h3 className="text-[17px] font-bold tracking-tight uppercase">{t('assignments')}</h3>
            </div>
            <button onClick={() => setIsAsgnModalOpen(true)} className="text-system-blue hover:opacity-70"><Plus size={20}/></button>
          </div>
          <div className="space-y-3">
            {assignments.length > 0 ? assignments.map(asgn => (
              <Card 
                key={asgn.id} 
                onClick={() => toggleAsgn(asgn.id, asgn.status)}
                className="p-4 flex items-center justify-between hover:bg-white dark:hover:bg-white/[0.05] transition-all cursor-pointer group border-none glass !bg-system-background/60 dark:!bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${asgn.status === 'completed' ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-orange-500 shadow-lg shadow-orange-500/20'}`} />
                  <div>
                    <h4 className={`text-[15px] font-bold leading-tight ${asgn.status === 'completed' ? 'line-through opacity-30 text-foreground' : 'text-foreground/90'}`}>{asgn.title}</h4>
                    <span className="text-[12px] font-bold text-foreground/30 uppercase tracking-tighter">
                      {asgn.due_date ? new Date(asgn.due_date).toLocaleDateString() : t('flexible')}
                    </span>
                  </div>
                </div>
                {asgn.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
              </Card>
            )) : (
              <Card className="p-10 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center">
                <ClipboardList size={24} className="text-foreground/10 mb-2" />
                <p className="text-[14px] font-medium text-foreground/20 uppercase tracking-widest text-center">{t('clearAgenda')}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-foreground/60">
              <Folder size={18} />
              <h3 className="text-[17px] font-bold tracking-tight uppercase">{t('resources')}</h3>
            </div>
            <button onClick={() => setIsResModalOpen(true)} className="text-system-blue hover:opacity-70"><Plus size={20}/></button>
          </div>
          <div className="space-y-3">
            {resources.length > 0 ? resources.map(res => (
              <Card key={res.id} onClick={() => setActiveResource(res)} className="p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-white/[0.05] transition-all cursor-pointer group border-none glass !bg-system-background/60 dark:!bg-white/5">
                <div className="w-10 h-10 rounded-xl bg-system-blue/10 dark:bg-white/5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  {res.type === 'html' ? <Globe size={18} className="text-green-500"/> : <FileText size={18} className="text-system-blue"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold truncate text-foreground/90">{res.title}</h4>
                  <span className="text-[11px] font-extrabold text-foreground/20 uppercase tracking-tighter">{res.type}</span>
                </div>
                <button 
                  onClick={(e) => deleteResource(e, res)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-system-red/10 text-system-red rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </Card>
            )) : (
              <Card className="p-10 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center">
                <Folder size={24} className="text-foreground/10 mb-2" />
                <p className="text-[14px] font-medium text-foreground/20 uppercase tracking-widest text-center">{t('libraryEmpty')}</p>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* Global Resource Viewer */}
      {activeResource && (
        <ResourceViewer 
          title={activeResource.title}
          fileKey={activeResource.file_key}
          type={activeResource.type}
          onClose={() => setActiveResource(null)}
        />
      )}

      {/* Form Modals */}
      
      {isAsgnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md max-h-[90vh] glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl scale-in-center border-none flex flex-col overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{t('newAssignment')}</h3>
              <button onClick={() => setIsAsgnModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/40">
                <X size={20}/>
              </button>
            </div>
            <div className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-right lg:text-left">
              <Input label={t('title')} value={newAsgn.title} onChange={e => setNewAsgn({...newAsgn, title: e.target.value})} />
              <Input label={t('dueDate')} type="date" value={newAsgn.due_date} onChange={e => setNewAsgn({...newAsgn, due_date: e.target.value})} />
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('notes')}</label>
                <textarea 
                  placeholder={t('optional')} 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[15px] font-medium min-h-[100px] resize-none"
                  value={newAsgn.description} 
                  onChange={e => setNewAsgn({...newAsgn, description: e.target.value})} 
                />
              </div>
            </div>
            <div className="p-6 border-t border-black/5 dark:border-white/5 flex gap-3 shrink-0">
              <Button onClick={() => setIsAsgnModalOpen(false)} className="flex-1 !bg-black/5 dark:!bg-white/5 text-foreground/60">{t('cancel')}</Button>
              <Button variant="primary" onClick={handleAddAsgn} className="flex-1 shadow-lg shadow-system-blue/20">{t('createAssignment')}</Button>
            </div>
          </Card>
        </div>
      )}

      {isSlotModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md max-h-[90vh] glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl scale-in-center border-none flex flex-col overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{t('newWeeklySlot')}</h3>
              <button onClick={() => setIsSlotModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/40">
                <X size={20}/>
              </button>
            </div>
            <div className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-right lg:text-left">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('day')}</label>
                <select 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[15px] font-medium appearance-none"
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                >
                  {days.map((day, i) => <option key={i} value={i}>{day}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('startsAt')} type="time" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} />
                <Input label={t('endsAt')} type="time" value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} />
              </div>
              <Input label={t('room')} placeholder="Location..." value={newSlot.room} onChange={e => setNewSlot({...newSlot, room: e.target.value})} />
            </div>
            <div className="p-6 border-t border-black/5 dark:border-white/5 flex gap-3 shrink-0">
              <Button onClick={() => setIsSlotModalOpen(false)} className="flex-1 !bg-black/5 dark:!bg-white/5 text-foreground/60">{t('cancel')}</Button>
              <Button variant="primary" onClick={handleAddSlot} className="flex-1 shadow-lg shadow-system-blue/20">{t('addToWeek')}</Button>
            </div>
          </Card>
        </div>
      )}

      {isResModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md max-h-[90vh] glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl scale-in-center border-none flex flex-col overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{t('uploadMaterial')}</h3>
              <button onClick={() => setIsResModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/40">
                <X size={20}/>
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-right lg:text-left">
              <div className="relative group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => e.target.files && setNewRes({...newRes, file: e.target.files[0]})}
                />
                <div className={`w-full border-2 border-dashed rounded-2xl px-4 py-10 flex flex-col items-center justify-center transition-all ${newRes.file ? 'bg-system-blue/10 border-system-blue/30' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 group-hover:border-system-blue/30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 ${newRes.file ? 'bg-system-blue' : 'bg-black/10 dark:bg-white/10 text-foreground/20'}`}>
                    {newRes.file ? <Check size={24}/> : <Upload size={24}/>}
                  </div>
                  <span className="text-[14px] font-bold truncate max-w-full px-4 text-center">{newRes.file ? newRes.file.name : t('chooseOrDrop')}</span>
                </div>
              </div>
              <Input label={t('title')} placeholder="e.g. Chapter 4 Summary" value={newRes.title} onChange={e => setNewRes({...newRes, title: e.target.value})} />
            </div>
            <div className="p-6 border-t border-black/5 dark:border-white/5 flex gap-3 shrink-0">
              <Button onClick={() => setIsResModalOpen(false)} className="flex-1 !bg-black/5 dark:!bg-white/5 text-foreground/60">{t('cancel')}</Button>
              <Button variant="primary" onClick={handleUploadRes} disabled={uploading || !newRes.file} className="flex-1 shadow-lg shadow-system-blue/20">
                {uploading ? t('processing') : t('uploadNow')}
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default CourseFocus;
