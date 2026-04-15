"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/utils/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ResourceViewer from '@/components/ui/ResourceViewer';
import { 
  Upload, 
  FileText, 
  ImageIcon as ImageIconLucide, 
  Archive, 
  Globe, 
  File, 
  Search, 
  Trash2, 
  FolderOpen, 
  X, 
  Check,
  Eye,
  Code
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  type: string;
  file_key: string;
  course_id: string;
  course_name?: string;
  uploaded_at: string;
  category?: string;
}

interface ResourcesProps {
  initialOpenModal?: boolean;
  initialResourceId?: string | null;
}

const Resources: React.FC<ResourcesProps> = ({ initialOpenModal, initialResourceId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [pastedHtml, setPastedHtml] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('all');

  const [newResource, setNewResource] = useState({ 
    title: '', 
    course_id: '', 
    file: null as File | null 
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, name');
      if (error) throw error;
      return data;
    }
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*, courses ( name )')
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((r: any) => ({ 
        ...r, 
        course_name: r.courses?.name || 'Unknown' 
      }));
    },
  });

  useEffect(() => {
    if (initialOpenModal) {
      resetForm();
      setIsModalOpen(true);
    }
  }, [initialOpenModal]);

  useEffect(() => {
    if (initialResourceId && resources.length > 0) {
      const res = resources.find(r => r.id === initialResourceId);
      if (res) setActiveResource(res);
    }
  }, [initialResourceId, resources]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!newResource.course_id) return;
      if (uploadMode === 'file' && !newResource.file) return;
      if (uploadMode === 'paste' && !pastedHtml) return;
      
      let fileToUpload: Blob | File;
      let fileExt: string;

      if (uploadMode === 'file' && newResource.file) {
        fileToUpload = newResource.file;
        fileExt = newResource.file.name.split('.').pop()?.toLowerCase() || 'other';
      } else {
        fileToUpload = new Blob([pastedHtml], { type: 'text/html' });
        fileExt = 'html';
      }

      const filePath = `${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('resources').insert([{
        title: newResource.title || (uploadMode === 'file' ? newResource.file?.name : 'Pasted HTML Content'),
        course_id: newResource.course_id,
        type: fileExt,
        file_key: filePath,
        category: fileExt === 'html' ? 'html' : 'file'
      }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      if (resource.file_key) {
        await supabase.storage.from('resources').remove([resource.file_key]);
      }
      const { error } = await supabase.from('resources').delete().eq('id', resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });

  const resetForm = () => {
    setNewResource({ title: '', course_id: '', file: null });
    setPastedHtml('');
    setUploadMode('file');
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourseId === 'all' || res.course_id === filterCourseId;
    return matchesSearch && matchesCourse;
  });

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['pdf'].includes(t)) return <FileText size={28} className="text-red-500" />;
    if (['docx', 'doc', 'txt'].includes(t)) return <FileText size={28} className="text-blue-500" />;
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(t)) return <ImageIconLucide size={28} className="text-purple-500" />;
    if (['zip', 'rar', '7z'].includes(t)) return <Archive size={28} className="text-orange-500" />;
    if (['html', 'htm'].includes(t)) return <Globe size={28} className="text-green-500" />;
    return <File size={28} className="text-slate-400" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 px-1 text-right lg:text-left">
        <div>
          <h2 className="text-[34px] font-bold tracking-tight text-foreground">{t('resources')}</h2>
          <p className="text-[17px] text-foreground/40 font-medium mt-1 uppercase tracking-tight">{t('academicResources')}</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="!px-6 !py-2.5 flex items-center gap-2 shadow-lg shadow-system-blue/20 active:scale-95 transition-all">
          <Upload size={18} />
          {t('addResource')}
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 px-1">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-system-blue transition-colors" size={18} />
          <input 
            placeholder={t('searchLibrary')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:border-system-blue/50 transition-all text-[15px] font-medium shadow-sm"
          />
        </div>
        <select
          className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3.5 outline-none focus:border-system-blue/50 transition-all text-[15px] font-medium shadow-sm appearance-none"
          value={filterCourseId}
          onChange={(e) => setFilterCourseId(e.target.value)}
        >
          <option value="all">{t('allSubjects')}</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-black/5 dark:border-white/5 border-t-system-blue rounded-full animate-spin"></div>
          </div>
        ) : filteredResources.length > 0 ? (
          filteredResources.map(res => (
            <Card key={res.id} onClick={() => setActiveResource(res)} className="p-6 flex flex-col group hover:bg-white dark:hover:bg-white/[0.08] transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] relative border border-transparent hover:border-black/5 dark:hover:border-white/10 cursor-pointer">
               <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-foreground/40">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm(t('deleteResourceConfirm'))) deleteMutation.mutate(res); }}
                    className="p-2 hover:bg-system-red/10 text-system-red rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
               
               <div className="text-4xl mb-6 self-start bg-system-blue/5 dark:bg-white/5 w-16 h-16 flex items-center justify-center rounded-[20px] shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {getFileIcon(res.type)}
               </div>
               
               <div className="flex-1 min-w-0">
                 <h3 className="text-[18px] font-bold truncate mb-1 text-foreground/90" title={res.title}>
                   {res.title}
                 </h3>
                 <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-system-blue"></span>
                    <span className="text-[14px] font-bold text-foreground/30 truncate uppercase tracking-tight">{res.course_name}</span>
                 </div>
               </div>
               
               <div className="mt-auto flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-4">
                  <div className="flex flex-col text-right lg:text-left">
                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em]">{t('uploaded')}</span>
                    <span className="text-[12px] font-bold text-foreground/60 tracking-tight uppercase">
                      {new Date(res.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-system-blue/10 text-system-blue group-hover:bg-system-blue group-hover:text-white transition-all">
                    <Eye size={18} />
                  </div>
               </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-20 text-center border-dashed border-2 border-black/5 dark:border-white/10 bg-transparent flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 grayscale opacity-50">
              <FolderOpen size={48} className="text-foreground/20" />
            </div>
            <p className="text-[19px] font-bold text-foreground/30 tracking-tight uppercase">{t('libraryEmpty')}</p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setIsModalOpen(true)} className="mt-8 !px-8">
                {t('uploadFirstMaterial')}
              </Button>
            )}
          </Card>
        )}
      </div>

      {activeResource && (
        <ResourceViewer 
          title={activeResource.title}
          fileKey={activeResource.file_key}
          type={activeResource.type}
          onClose={() => setActiveResource(null)}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-lg max-h-[90vh] p-0 glass !bg-white/95 dark:!bg-system-secondary/95 shadow-2xl scale-100 animate-in zoom-in-95 duration-300 border-none flex flex-col overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 shrink-0">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground uppercase text-right lg:text-left">{t('addResource')}</h3>
                <p className="text-[13px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">{t('resources')}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                 <X size={20} className="text-foreground/40" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                <button 
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${uploadMode === 'file' ? 'bg-white dark:bg-system-tertiary shadow-sm text-foreground' : 'text-foreground/30'}`}
                >
                  <Upload size={14} /> {t('file')}
                </button>
                <button 
                  onClick={() => setUploadMode('paste')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${uploadMode === 'paste' ? 'bg-white dark:bg-system-tertiary shadow-sm text-foreground' : 'text-foreground/30'}`}
                >
                  <Code size={14} /> {t('html')}
                </button>
              </div>

              <Input 
                label={t('resourceTitle')}
                placeholder="e.g. Exam Summary" 
                value={newResource.title} 
                onChange={e => setNewResource({...newResource, title: e.target.value})} 
              />

              <div className="space-y-1.5 text-right lg:text-left">
                <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('subject')}</label>
                <select 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[15px] font-medium appearance-none"
                  value={newResource.course_id}
                  onChange={(e) => setNewResource({ ...newResource, course_id: e.target.value })}
                >
                  <option value="">{t('selectSubject')}</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {uploadMode === 'file' ? (
                <div className="space-y-1.5 text-right lg:text-left">
                  <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('file')}</label>
                  <div className="relative group">
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept=".pdf,.html,.htm,.doc,.docx,.png,.jpg,.jpeg,.txt,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setNewResource({ ...newResource, file });
                        }}
                      />
                      <div className={`w-full border-2 border-dashed rounded-2xl px-4 py-10 flex flex-col items-center justify-center transition-all ${
                        newResource.file 
                          ? 'bg-system-blue/10 border-system-blue/30' 
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 group-hover:border-system-blue/30'
                      }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 ${
                          newResource.file ? 'bg-system-blue' : 'bg-black/10 dark:bg-white/10 text-foreground/20'
                        }`}>
                          {newResource.file ? <Check size={24} /> : <Upload size={24} />}
                        </div>
                        <span className={`text-[14px] font-bold truncate max-w-full px-4 text-center ${
                          newResource.file ? 'text-system-blue' : 'text-foreground/60'
                        }`}>
                          {newResource.file ? newResource.file.name : t('selectOrDrop')}
                        </span>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-right lg:text-left">
                  <label className="text-[13px] font-bold text-foreground/40 ml-1 uppercase tracking-wider">{t('pasteHtml')}</label>
                  <textarea 
                    className="w-full h-40 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:bg-white dark:focus:bg-system-tertiary focus:border-system-blue/50 transition-all text-[14px] font-mono"
                    placeholder="<html>...</html>"
                    value={pastedHtml}
                    onChange={(e) => setPastedHtml(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-black/5 dark:border-white/5 flex gap-3 shrink-0">
              <Button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 !bg-black/5 dark:!bg-white/5 !text-foreground/60 border-none">{t('cancel')}</Button>
              <Button 
                variant="primary" 
                onClick={() => uploadMutation.mutate()} 
                disabled={uploadMutation.isPending || (uploadMode === 'file' ? !newResource.file : !pastedHtml) || !newResource.course_id}
                className="flex-[2] shadow-xl shadow-system-blue/20"
              >
                {uploadMutation.isPending ? t('uploading') : t('uploadNow')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Resources;
