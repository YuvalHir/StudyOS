"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  ChevronRight,
  FileText,
  Calendar,
  Upload
} from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: 'assignment' | 'class' | 'resource') => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    { 
      id: 'assignment', 
      label: t('addAssignment'), 
      icon: FileText, 
      color: 'bg-system-blue',
      description: t('createTaskDescription')
    },
    { 
      id: 'class', 
      label: t('addClass'), 
      icon: Calendar, 
      color: 'bg-system-green',
      description: t('scheduleLectureDescription')
    },
    { 
      id: 'resource', 
      label: t('uploadResource'), 
      icon: Upload, 
      color: 'bg-system-orange',
      description: t('shareMaterialsDescription')
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg ${
          isOpen 
            ? 'bg-system-red text-white rotate-45' 
            : 'bg-system-blue text-white hover:scale-110 active:scale-95'
        }`}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 md:left-auto md:right-0 w-64 glass !bg-system-tertiary/95 dark:!bg-system-background/95 border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="px-3 py-2 mb-1 text-right lg:text-left">
            <h3 className="text-[13px] font-bold text-foreground/40 uppercase tracking-widest">{t('quickActions')}</h3>
          </div>
          <div className="space-y-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  onAction(action.id as any);
                  setIsOpen(false);
                }}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group text-right lg:text-left"
              >
                <div className={`mt-0.5 p-2 rounded-lg ${action.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  <action.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-foreground tracking-tight">{action.label}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-30 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                  <p className="text-[12px] font-medium text-foreground/40 truncate leading-tight mt-0.5">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
