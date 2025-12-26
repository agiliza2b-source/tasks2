import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Settings, Plus, GripVertical, Pencil } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COLOR_PALETTE, getPaletteColor } from '@/lib/constants';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const KanbanBoard = ({ 
    tasks, 
    columns, 
    loading, 
    onEditTask, 
    onDeleteTask, 
    onDuplicateTask, 
    onSaveTemplate,
    onMoveTask, 
    onDeleteColumn, 
    onUpdateColumn,
    onAddColumn, 
    onReorderColumn
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  
  // Custom Delete Dialog State
  const [deleteConfirmation, setDeleteConfirmation] = useState({ 
      open: false, 
      type: null, // 'task' | 'column'
      id: null 
  });

  // Time do Arrasta e Solta para exclusão
  const [trashReady, setTrashReady] = useState(false); 
  const trashTimerRef = useRef(null);

  // --- Task Dragging ---
  const handleTaskDragStart = (e, task) => {
    setDraggedTask(task);
    setTrashReady(false);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation(); 
    
    // Inicia Timer de 1 segundo para habilitar lixeira
    if(trashTimerRef.current) clearTimeout(trashTimerRef.current);
    trashTimerRef.current = setTimeout(() => {
        setTrashReady(true);
    }, 1000);
  };

  const handleTaskDragEnd = () => {
     setDraggedTask(null);
     setTrashReady(false);
     setIsHoveringTrash(false);
     if(trashTimerRef.current) clearTimeout(trashTimerRef.current);
  };

  const handleTaskDrop = (e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('taskId');

    if (taskId && draggedTask && draggedTask.id === taskId) {
        if (draggedTask.column_id !== columnId) {
             onMoveTask(taskId, columnId);
        }
        setDraggedTask(null);
    } 
  };

  // --- Column Dragging ---
  const handleColumnDragStart = (e, column) => {
      setDraggedColumn(column);
      e.dataTransfer.setData('columnId', column.id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDrop = (e, targetColumnId) => {
      e.preventDefault();
      const sourceColumnId = e.dataTransfer.getData('columnId');
      if (sourceColumnId && sourceColumnId !== targetColumnId) {
          onReorderColumn(sourceColumnId, targetColumnId);
      }
      setDraggedColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTrashDrop = async (e) => {
      e.preventDefault();
      setIsHoveringTrash(false);
      
      // Impede exclusão se soltar antes de 1 segundo
      if (!trashReady && draggedTask) return;

      const taskId = e.dataTransfer.getData('taskId');
      const columnId = e.dataTransfer.getData('columnId');

      let shouldConfirm = true;
      try {
        const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).single();
        if (profile?.preferences?.confirm_delete === false) {
            shouldConfirm = false;
        }
      } catch (err) {
        console.warn("Could not fetch preferences, defaulting to confirm", err);
      }

      if (taskId) {
          if (shouldConfirm) {
              setDeleteConfirmation({ open: true, type: 'task', id: taskId });
          } else {
              onDeleteTask(taskId);
          }
          setDraggedTask(null);
      } else if (columnId) {
          if (shouldConfirm) {
              setDeleteConfirmation({ open: true, type: 'column', id: columnId });
          } else {
              onDeleteColumn(columnId);
          }
          setDraggedColumn(null);
      }
  };

  const confirmDelete = () => {
      if (deleteConfirmation.type === 'task') {
          onDeleteTask(deleteConfirmation.id);
      } else if (deleteConfirmation.type === 'column') {
          onDeleteColumn(deleteConfirmation.id);
      }
      setDeleteConfirmation({ open: false, type: null, id: null });
  };

  const startEditingColumn = (col) => {
      setEditingColumnId(col.id);
      setEditColumnTitle(col.title);
  };

  const saveColumnTitle = (col) => {
      if (editColumnTitle.trim() !== col.title) {
          onUpdateColumn(col.id, { title: editColumnTitle });
      }
      setEditingColumnId(null);
  };

  if (loading) {
    return (
      <div className="flex gap-4 h-full overflow-hidden p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 min-w-[300px] bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
        {/* Bottom Drop Zone with Timer Feedback */}
        <AnimatePresence>
            {(draggedTask || draggedColumn) && (
                <div 
                    className="fixed inset-x-0 bottom-0 z-50 h-32 flex items-center justify-center bg-gradient-to-t from-red-900/80 to-transparent transition-all duration-300"
                    onDragOver={(e) => { 
                        e.preventDefault(); 
                        if(trashReady || draggedColumn) setIsHoveringTrash(true); 
                    }}
                    onDragLeave={() => setIsHoveringTrash(false)}
                    onDrop={handleTrashDrop}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                            opacity: (trashReady || draggedColumn) ? 1 : 0.5, 
                            y: 0, 
                            scale: isHoveringTrash ? 1.1 : 1 
                        }}
                        exit={{ opacity: 0, y: 20 }}
                        className={cn(
                            "flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-colors shadow-2xl backdrop-blur-md",
                            isHoveringTrash 
                                ? "bg-red-600 border-red-400 text-white" 
                                : "bg-slate-900/80 border-slate-700 text-slate-300"
                        )}
                    >
                        <Trash2 className={cn("w-6 h-6", isHoveringTrash && "animate-bounce")} />
                        <span className="font-bold text-lg">
                            {(!trashReady && draggedTask) ? "Segure para excluir..." : "Solte para Excluir"}
                        </span>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Confirmation Dialog */}
        <AlertDialog open={deleteConfirmation.open} onOpenChange={(open) => !open && setDeleteConfirmation(prev => ({ ...prev, open: false }))}>
            <AlertDialogContent className="bg-slate-900 border-slate-800 text-white shadow-2xl">
                <AlertDialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4 border border-red-900/50">
                         <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl">{t('confirmDelete')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-slate-400">
                        {deleteConfirmation.type === 'column' 
                            ? t('confirmDeleteColumnMsg')
                            : t('confirmDeleteTaskMsg')
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
                    <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white sm:w-32">
                        {t('cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-700 text-white border-none sm:w-32"
                    >
                        {t('confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-6 h-full min-w-full w-max px-2 pb-4">
        {columns.map((column, index) => {
            const columnTasks = tasks.filter((task) => task.column_id === column.id);
            const colColor = getPaletteColor(column.color);

            return (
            <div
                key={column.id}
                draggable
                onDragStart={(e) => handleColumnDragStart(e, column)}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                    if (draggedColumn) handleColumnDrop(e, column.id);
                    else handleTaskDrop(e, column.id);
                }}
                className={cn(
                "flex flex-col w-[340px] rounded-xl border border-dashed transition-all duration-300",
                "bg-slate-900/40 backdrop-blur-sm",
                colColor.border, // Use border from palette
                draggedTask ? "border-white/30" : "hover:border-white/30",
                draggedColumn?.id === column.id ? "opacity-50" : "opacity-100"
                )}
            >
                {/* Column Header */}
                <div className={cn(
                    "p-4 border-b flex items-center justify-between sticky top-0 rounded-t-xl z-10 backdrop-blur-xl group cursor-grab active:cursor-grabbing transition-colors",
                    colColor.bg,
                    colColor.border
                )}>
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <GripVertical className="w-4 h-4 text-slate-500 opacity-50 group-hover:opacity-100" />
                    
                    {editingColumnId === column.id ? (
                        <Input 
                            value={editColumnTitle}
                            onChange={(e) => setEditColumnTitle(e.target.value)}
                            onBlur={() => saveColumnTitle(column)}
                            onKeyDown={(e) => e.key === 'Enter' && saveColumnTitle(column)}
                            className="h-8 text-sm bg-slate-800 border-slate-600 text-white w-full"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-3 w-full" onDoubleClick={() => startEditingColumn(column)}>
                            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", colColor.dot)} />
                            <h3 className="font-semibold text-white tracking-wide text-sm truncate">{column.title}</h3>
                            <span className="bg-slate-900/40 text-slate-300 text-[10px] py-0.5 px-2 rounded-full font-medium ml-auto">
                                {columnTasks.length}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center ml-2">
                    <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10">
                                    <Settings className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                                <DropdownMenuLabel>Opções da Coluna</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => startEditingColumn(column)}>
                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Renomear
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuLabel className="text-xs font-normal text-slate-500 uppercase tracking-wider">Cor do Grupo</DropdownMenuLabel>
                                <div className="grid grid-cols-5 gap-1.5 p-2">
                                    {COLOR_PALETTE.map(c => (
                                        <button
                                            key={c.id}
                                            className={cn(
                                                "w-6 h-6 rounded-full border flex items-center justify-center transition-all", 
                                                c.bg, c.border,
                                                column.color === c.id ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900" : "hover:scale-110"
                                            )}
                                            onClick={() => onUpdateColumn(column.id, { color: c.id })}
                                            title={c.label}
                                        >
                                            {column.color === c.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem 
                                    onClick={() => { if(window.confirm('Excluir coluna e todas as tarefas?')) onDeleteColumn(column.id) }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                </div>

                {/* Tasks Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-[100px]">
                <AnimatePresence mode="popLayout">
                    {columnTasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onDuplicate={onDuplicateTask}
                        onSaveTemplate={onSaveTemplate}
                        draggable
                        onDragStart={(e) => handleTaskDragStart(e, task)}
                        onDragEnd={handleTaskDragEnd}
                    />
                    ))}
                </AnimatePresence>
                
                {columnTasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 hover:opacity-50 transition-opacity min-h-[150px] border-2 border-dashed border-white/5 rounded-lg m-1">
                    <p className="text-slate-500 text-xs font-medium">Arraste tarefas aqui</p>
                    </div>
                )}
                </div>
            </div>
            );
        })}
        
        {/* Add Column Button */}
        <div className="w-[60px] pt-2">
            <Button 
                variant="ghost" 
                onClick={onAddColumn}
                className="h-[400px] w-full border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/50 text-slate-500 hover:text-white rounded-xl flex flex-col gap-3 group transition-all"
            >
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs vertical-rl rotate-180 font-medium tracking-wide opacity-60 group-hover:opacity-100 transition-opacity" style={{ writingMode: 'vertical-rl' }}>
                    Adicionar Coluna
                </span>
            </Button>
        </div>
        </div>
    </div>
  );
};

export default KanbanBoard;