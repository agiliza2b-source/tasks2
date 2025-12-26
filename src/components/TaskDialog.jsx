
import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Copy, Save, Flag, CheckCircle2, User, Layout, Palette, FileInput, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TaskUpdates from '@/components/TaskUpdates';
import TaskAttachments from '@/components/TaskAttachments';
import { COLOR_PALETTE, getPaletteColor } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const TaskDialog = ({ 
  open, 
  onOpenChange, 
  task, 
  columns, 
  templates = [],
  onSubmit, 
  onDelete, 
  onDuplicate, 
  onSaveTemplate, 
  onApplyTemplate,
  onDeleteTemplate,
  refreshUpdatesKey
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    column_id: '', 
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    status: 'todo',
    color: 'slate'
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        column_id: task.column_id || (columns.length > 0 ? columns[0].id : ''),
        priority: task.priority || 'medium',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        status: task.status || 'todo',
        color: task.color || 'slate'
      });
    } else {
      setFormData({
        title: '',
        column_id: columns.length > 0 ? columns[0].id : '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        status: 'todo',
        color: 'slate'
      });
    }
  }, [task, open, columns]);

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    if (task && task.id) {
       const submitData = {
        ...newData,
        id: task.id,
        due_date: newData.due_date ? new Date(newData.due_date).toISOString() : null,
      };
      onSubmit(submitData); 
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    };
    onSubmit(submitData);
  };

  if (!task && open) {
    return (
       <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <form onSubmit={handleCreateSubmit} className="space-y-5 pt-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('newTask')}</h2>
                <div className="flex gap-2">
                   {COLOR_PALETTE.slice(0, 5).map(c => (
                     <button
                       key={c.id}
                       type="button"
                       onClick={() => setFormData({...formData, color: c.id})}
                       className={cn(
                         "w-5 h-5 rounded-full border border-slate-600 transition-all",
                         c.bg,
                         formData.color === c.id ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                       )}
                       title={c.label}
                     />
                   ))}
                </div>
             </div>
             
             <div>
                <Label className="text-slate-400">{t('taskTitle')}</Label>
                <input 
                  required
                  autoFocus
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full mt-1.5 bg-slate-800 border-slate-700 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                  placeholder="O que precisa ser feito?"
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label className="text-slate-400">{t('status')} <span className="text-red-500">*</span></Label>
                   <div className="relative mt-1.5">
                     <Activity className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                     <select 
                        required
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2.5 pl-9 text-white appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
                     >
                       <option value="todo">{t('todo')}</option>
                       <option value="in_progress">{t('in_progress')}</option>
                       <option value="done">{t('done')}</option>
                     </select>
                   </div>
                </div>
                <div>
                   <Label className="text-slate-400">{t('priority')}</Label>
                   <div className="relative mt-1.5">
                     <Flag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                     <select 
                        value={formData.priority} 
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2.5 pl-9 text-white appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
                     >
                       <option value="low">{t('low')}</option>
                       <option value="medium">{t('medium')}</option>
                       <option value="high">{t('high')}</option>
                     </select>
                   </div>
                </div>
             </div>

             <div>
                <Label className="text-slate-400">{t('dueDate')}</Label>
                <input 
                  type="date"
                  value={formData.due_date} 
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  className="w-full mt-1.5 bg-slate-800 border-slate-700 rounded-md p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none [color-scheme:dark]"
                />
             </div>

             <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5">
               {t('save')}
             </Button>
          </form>
        </DialogContent>
       </Dialog>
    );
  }

  const currentColor = getPaletteColor(formData.color);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white w-[98vw] h-[95vh] max-w-[1600px] p-0 flex flex-col overflow-hidden sm:rounded-xl shadow-2xl">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900 shrink-0">
          <div className="flex-1 mr-4 flex items-center gap-3">
            <div className={cn("w-4 h-8 rounded-full shrink-0", currentColor.bg, currentColor.border, "border-l-4")}></div>
            <input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder-slate-600 truncate"
              placeholder={t('taskTitle')}
            />
          </div>
          <div className="flex items-center gap-2">
             {task && (
               <>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white hidden sm:flex"
                            title={t('applyTemplate')}
                        >
                            <FileInput className="w-4 h-4 mr-2" /> {t('applyTemplate')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white p-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">{t('templatesAvailable')}</div>
                        {templates.length === 0 ? (
                            <div className="text-sm text-slate-400 px-2 py-1">{t('noTemplates')}</div>
                        ) : (
                            <div className="space-y-1">
                                {templates.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 hover:bg-slate-800 rounded px-2 py-1.5 group">
                                        <button
                                            onClick={() => onApplyTemplate(task, t.id)}
                                            className="flex-1 text-left text-sm flex items-center gap-2"
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", getPaletteColor(t.color).bg)} />
                                            {t.title.replace(' (Modelo)', '')}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteTemplate(t.id); }}
                                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                            title="Excluir Modelo"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PopoverContent>
                 </Popover>

                 <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hidden sm:flex"
                    onClick={() => onDuplicate(task)}
                    title={t('duplicate')}
                 >
                    <Copy className="w-4 h-4 mr-2" /> {t('duplicate')}
                 </Button>
                 
                 <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hidden sm:flex"
                    onClick={() => onSaveTemplate(task)}
                    title={t('saveAsTemplate')}
                 >
                    <Save className="w-4 h-4 mr-2" /> {t('saveAsTemplate')}
                 </Button>

                 <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />

                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
                     >
                       <Trash2 className="w-5 h-5" />
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                     <AlertDialogHeader>
                       <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                       <AlertDialogDescription className="text-slate-400">
                         {t('confirmDeleteTaskMsg')}
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">{t('cancel')}</AlertDialogCancel>
                       <AlertDialogAction 
                         onClick={() => onDelete(task.id)}
                         className="bg-red-600 hover:bg-red-700 text-white border-none"
                       >
                         {t('delete')}
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </>
             )}
             <DialogClose className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2">
               <X className="w-6 h-6 text-slate-400 hover:text-white" />
             </DialogClose>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
           
           <div className="lg:col-span-9 p-0 border-t lg:border-t-0 border-white/5 flex flex-col order-2 lg:order-1 h-full relative">
              <TaskUpdates taskId={task?.id} refreshTrigger={refreshUpdatesKey} />
           </div>

           <div className="lg:col-span-3 bg-slate-900/30 border-l border-white/5 p-6 space-y-6 order-1 lg:order-2 h-full overflow-y-auto">
              
              <div className="space-y-5">
                 <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Clock className="w-4 h-4" /> {t('details')}
                    </h3>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700">
                          <Palette className="w-3.5 h-3.5 mr-2" /> {t('color')}
                          <div className={cn("w-3 h-3 rounded-full ml-2", currentColor.bg, currentColor.border, "border")} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 bg-slate-900 border-slate-700 p-3">
                          <div className="grid grid-cols-5 gap-2">
                            {COLOR_PALETTE.map(c => (
                              <button
                                key={c.id}
                                onClick={() => handleChange('color', c.id)}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                  c.bg,
                                  c.border,
                                  formData.color === c.id ? "border-white ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900" : "hover:scale-110"
                                )}
                                title={c.label}
                              >
                                {formData.color === c.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </button>
                            ))}
                          </div>
                      </PopoverContent>
                    </Popover>
                 </div>
                 
                 <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-white/5 shadow-inner">
                    
                    {/* Status Field */}
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">{t('status')}</Label>
                      <div className="relative">
                        <Activity className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                        <select 
                          value={formData.status}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-full bg-slate-800 border-slate-700 rounded-lg p-2.5 pl-9 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-750"
                        >
                           <option value="todo">{t('todo')}</option>
                           <option value="in_progress">{t('in_progress')}</option>
                           <option value="done">{t('done')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">{t('column')}</Label>
                      <div className="relative">
                        <Layout className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                        <select 
                          value={formData.column_id}
                          onChange={(e) => handleChange('column_id', e.target.value)}
                          className="w-full bg-slate-800 border-slate-700 rounded-lg p-2.5 pl-9 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-750"
                        >
                          {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">{t('priority')}</Label>
                      <div className="relative">
                        <Flag className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                        <select 
                          value={formData.priority}
                          onChange={(e) => handleChange('priority', e.target.value)}
                          className="w-full bg-slate-800 border-slate-700 rounded-lg p-2.5 pl-9 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-750"
                        >
                          <option value="low">{t('low')}</option>
                          <option value="medium">{t('medium')}</option>
                          <option value="high">{t('high')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">{t('assignedTo')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input 
                          value={formData.assigned_to}
                          onChange={(e) => handleChange('assigned_to', e.target.value)}
                          className="w-full bg-slate-800 border-slate-700 rounded-lg p-2.5 pl-9 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder-slate-600"
                          placeholder={t('assignedTo') + "..."}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">{t('dueDate')}</Label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => handleChange('due_date', e.target.value)}
                          className="w-full bg-slate-800 border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:outline-none [color-scheme:dark]"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              <TaskAttachments taskId={task?.id} />

           </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
