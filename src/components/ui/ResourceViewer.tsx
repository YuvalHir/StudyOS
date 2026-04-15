"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink, Download, Maximize2, Globe, FileText, ImageIcon } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

interface ResourceViewerProps {
  title: string;
  fileKey: string;
  type: string;
  onClose: () => void;
}

const ResourceViewer: React.FC<ResourceViewerProps> = ({ title, fileKey, type, onClose }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileType = type.toLowerCase();
  const isHtml = ['html', 'htm'].includes(fileType);
  const isPdf = fileType === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(fileType);

  useEffect(() => {
    loadResource();
  }, [fileKey]);

  const loadResource = async () => {
    try {
      setLoading(true);
      const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(fileKey);
      setUrl(publicUrl);

      if (isHtml) {
        const { data, error } = await supabase.storage.from('resources').download(fileKey);
        if (error) throw error;
        const text = await data.text();
        setContent(text);
      }
    } catch (err) {
      console.error("Error loading resource:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (url) window.open(url, '_blank');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black/5 dark:border-white/10 border-t-system-blue rounded-full animate-spin"></div>
          <span className="text-[13px] font-bold text-foreground/20 uppercase tracking-widest">{t('loadingMaterial')}</span>
        </div>
      );
    }

    if (isHtml && content) {
      return (
        <iframe 
          srcDoc={content} 
          className="w-full h-full border-0 bg-white" 
          title="HTML Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      );
    }
    
    if (isPdf && url) {
      return (
        <iframe 
          src={`${url}#toolbar=0`}
          className="w-full h-full border-0"
          title="PDF Preview"
        />
      );
    }

    if (isImage && url) {
      return (
        <div className="w-full h-full p-8 flex items-center justify-center overflow-auto">
          <img 
            src={url} 
            alt={title} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/20"
          />
        </div>
      );
    }

    return (
      <div className="text-center p-10">
        <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText size={40} className="text-foreground/20" />
        </div>
        <h4 className="text-xl font-bold mb-2">{t('previewNotAvailable')}</h4>
        <p className="text-foreground/40 mb-8 max-w-xs mx-auto">{t('previewNotAvailableDesc')}</p>
        <button 
          onClick={handleDownload}
          className="px-8 py-3 rounded-2xl bg-system-blue text-white font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 mx-auto"
        >
          <Download size={18} /> {t('downloadFile')}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10 bg-black/60 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full h-full ${isFullscreen ? 'max-w-none rounded-none' : 'max-w-6xl rounded-[32px]'} bg-white dark:bg-[#1c1c1e] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 transition-all duration-500`}>
        
        {!isFullscreen && (
          <div className="p-5 flex justify-between items-center border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${isHtml ? 'bg-green-500/10 text-green-500' : isPdf ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {isHtml ? <Globe size={20} /> : isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
              </div>
              <div className="text-right lg:text-left">
                <h3 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] md:max-w-md">{title}</h3>
                <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest">{type}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/40"
                title={t('fullscreen')}
              >
                <Maximize2 size={20} />
              </button>
              <button 
                onClick={handleDownload}
                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/40"
                title={t('original')}
              >
                <ExternalLink size={20} />
              </button>
              <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors text-foreground/40"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}

        {isFullscreen && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-lg"
            title={t('close') || 'Close'}
          >
            <X size={20} />
          </button>
        )}

        <div className="flex-1 bg-[#F5F5F7] dark:bg-[#000000] relative overflow-hidden flex items-center justify-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ResourceViewer;
