import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Calendar, MoreVertical, Paperclip, Copy, Save, Trash2, Clock, User, CheckCircle, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getPaletteColor } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

const TaskCard = ({ task, onEdit, onDelete, onDuplicate, onSaveTemplate, draggable, onDragStart, onDragEnd }) => {
  const { t } = useLanguage();
  const controls = useAnimation();
  
  const priorityColors = {
    low: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  const statusMap = {
      'todo': { label: t('todo'), class: 'text-slate-400 bg-slate-400/10' },
      'in_progress': { label: t('in_progress'), class: 'text-blue-400 bg-blue-400/10' },
      'done': { label: t('done'), class: 'text-green-400 bg-green-400/10' }
  };

  const taskColor = getPaletteColor(task.color || 'slate');
  
  const cardStyle = task.color && task.color !== 'slate' 
     ? cn(taskColor.bg, taskColor.border)
     : "bg-slate-800/80 border-slate-700/50 hover:border-slate-600";

  // Date Logic
  const isOverdue = task.due_date && new Date(task.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && task.status !== 'done';
  const statusInfo = statusMap[task.status] || statusMap['todo'];

  const getPriorityLabel = (p) => {
      if (p === 'low') return t('low');
      if (p === 'medium') return t('medium');
      if (p === 'high') return t('high');
      return p;
  };

  // Implementação SHAKE TASKS
  useEffect(() => {
    // Se prioridade alta e não concluída
    if (task.priority === 'high' && task.status !== 'done') {
        const shake = async () => {
            // Chacoalha sutilmente por aprox 2-3 segundos
            await controls.start({ 
                x: [0, -3, 3, -3, 3, 0], 
                transition: { duration: 0.4, repeat: 5 } 
            });
        };
        
        shake();
        // Repete a cada 30 minutos (configurável aqui)
        const interval = setInterval(shake, 30 * 60 * 1000); 
        return () => clearInterval(interval);
    }
  }, [task.priority, task.status, controls]);

  return (
    <motion.div
      layout
      animate={controls}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative border rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md backdrop-blur-sm",
        cardStyle
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap items-center">
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", priorityColors[task.priority])}>
                {getPriorityLabel(task.priority)}
            </span>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", statusInfo.class, "border-white/10")}>
                {statusInfo.label}
            </span>
            {task.is_template && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Modelo
                </span>
            )}
             
            {/* TAG DO RECURSO (Nova Implementação Visual) */}
            {task.resource_tag && (
                <div className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full" title={`Tag do Recurso: ${task.resource_tag}`}>
                    <Tag className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-200 uppercase">{task.resource_tag}</span>
                </div>
            )}
            
            {/* Valor do Recurso (Se for monetário) */}
            {task.resource_type === 'value' && task.resource_value && (
               <span className="text-[10px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30 font-mono">
                  R$ {task.resource_value}
               </span>
            )}
             {/* Tempo do Recurso (Se for horas) */}
             {task.resource_type === 'time' && task.resource_time && (
               <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono">
                  {task.resource_time}h
               </span>
            )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer hover:bg-slate-800">
                    {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(task)} className="cursor-pointer hover:bg-slate-800">
                    <Copy className="mr-2 h-4 w-4" /> {t('duplicate')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSaveTemplate(task)} className="cursor-pointer hover:bg-slate-800">
                    <Save className="mr-2 h-4 w-4" /> {t('saveAsTemplate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-400 cursor-pointer hover:bg-red-900/20 hover:text-red-300">
                    <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <h4 className="text-white font-medium mb-2 line-clamp-2 leading-snug">{task.title}</h4>
      
      {task.description && (
        <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {!task.description && <div className="mb-4" />}

      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div className={cn("flex items-center gap-1.5", isOverdue ? "text-red-400 font-semibold" : "text-slate-400")}>
              <Clock className="w-3.5 h-3.5" />
              <span>{format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}</span>
              {isOverdue && <span className="text-[9px] uppercase tracking-wide border border-red-500/50 px-1 rounded ml-1">{t('overdueLabel')}</span>}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
            {task.assigned_to ? (
                <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-full border border-white/5" title={task.assigned_to}>
                    <User className="w-3 h-3" />
                    <span className="max-w-[80px] truncate">{task.assigned_to}</span>
                </div>
            ) : (
                 <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-slate-600" />
                 </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;