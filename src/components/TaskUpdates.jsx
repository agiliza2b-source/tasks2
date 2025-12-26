
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Send, Trash2, CheckSquare, MessageSquare, Plus, X, Edit2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

// Helper to safely parse checklist content
const safeParseChecklist = (content) => {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    throw new Error('Not an array');
  } catch (e) {
    // Fallback for plain text or legacy format
    return content.split('\n')
      .filter(line => line.trim())
      .map(text => ({ 
        text: text.replace(/^-\s*/, ''), 
        checked: false 
      }));
  }
};

const TaskUpdates = ({ taskId, refreshTrigger }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [updates, setUpdates] = useState([]);
  
  // Input State
  const [inputValue, setInputValue] = useState('');
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit Mode State
  const [editingUpdateId, setEditingUpdateId] = useState(null);

  // Selection state for deletion
  const [selectedUpdates, setSelectedUpdates] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchUpdates();
    }
  }, [taskId, refreshTrigger]);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('task_updates')
      .select(`
        id, content, type, created_at,
        user_id
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (!error) setUpdates(data || []);
  };

  const startEditing = (update) => {
    setEditingUpdateId(update.id);
    setInputValue(update.type === 'checklist' 
      ? safeParseChecklist(update.content).map(i => `- ${i.text}`).join('\n')
      : update.content
    );
    setIsChecklistMode(update.type === 'checklist');
    setIsInputOpen(true);
  };

  const cancelEdit = () => {
    setEditingUpdateId(null);
    setInputValue('');
    setIsInputOpen(false);
  };

  const handlePostOrUpdate = async () => {
    if (!inputValue.trim()) return;

    let contentToSave = inputValue;

    // Convert to JSON structure if checklist
    if (isChecklistMode) {
      const items = inputValue.split('\n')
        .filter(line => line.trim())
        .map(line => {
             // Preserve checked state if editing and text matches (simple heuristic) or default to false
             return { 
                text: line.replace(/^-\s*/, ''), 
                checked: false 
             };
        });
      
      if (items.length === 0) return;
      contentToSave = JSON.stringify(items);
    }

    setLoading(true);
    try {
      if (editingUpdateId) {
        // UPDATE EXISTING
        const { error } = await supabase
          .from('task_updates')
          .update({
            content: contentToSave,
            type: isChecklistMode ? 'checklist' : 'text',
          })
          .eq('id', editingUpdateId);

        if (error) throw error;
        
        setUpdates(updates.map(u => u.id === editingUpdateId ? { ...u, content: contentToSave, type: isChecklistMode ? 'checklist' : 'text' } : u));
        toast({ title: t('save') });
      } else {
        // CREATE NEW
        const { data, error } = await supabase
          .from('task_updates')
          .insert([{
            task_id: taskId,
            user_id: user.id,
            content: contentToSave,
            type: isChecklistMode ? 'checklist' : 'text'
          }])
          .select()
          .single();

        if (error) throw error;
        setUpdates([data, ...updates]);
        toast({ title: t('save') });
      }

      setInputValue('');
      setEditingUpdateId(null);
      setIsInputOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckitem = async (updateId, itemIndex) => {
    const update = updates.find(u => u.id === updateId);
    if (!update) return;

    const items = safeParseChecklist(update.content);
    
    if (items[itemIndex]) {
      items[itemIndex].checked = !items[itemIndex].checked;
    }

    const newContent = JSON.stringify(items);

    setUpdates(prevUpdates => prevUpdates.map(u => 
      u.id === updateId ? { ...u, content: newContent } : u
    ));

    try {
      const { error } = await supabase
        .from('task_updates')
        .update({ content: newContent })
        .eq('id', updateId);

      if (error) throw error;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar alteração', description: error.message });
      fetchUpdates();
    }
  };

  const toggleSelectUpdate = (id) => {
    const newSelected = new Set(selectedUpdates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUpdates(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedUpdates.size === 0) return;

    try {
      const { error } = await supabase
        .from('task_updates')
        .delete()
        .in('id', Array.from(selectedUpdates));

      if (error) throw error;

      setUpdates(updates.filter(u => !selectedUpdates.has(u.id)));
      setSelectedUpdates(new Set());
      setShowDeleteDialog(false);
      toast({ title: t('delete') });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
         <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{t('updates')}</h3>
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs border border-white/5">
                {updates.length}
            </span>
         </div>
         
         <div className="flex gap-2">
             {selectedUpdates.size > 0 && (
               <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" size="sm">
                     <Trash2 className="w-4 h-4 mr-2" /> {t('deleteSelected')} ({selectedUpdates.size})
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                   <AlertDialogHeader>
                     <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                     <AlertDialogDescription className="text-slate-400">
                       {t('deleteUpdatesMsg')}
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">{t('cancel')}</AlertDialogCancel>
                     <AlertDialogAction 
                       onClick={handleDeleteSelected}
                       className="bg-red-600 hover:bg-red-700 text-white border-none"
                     >
                       {t('delete')}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             )}
             
             {!isInputOpen && (
                 <Button onClick={() => setIsInputOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                     <Plus className="w-4 h-4 mr-2" /> {t('newUpdate')}
                 </Button>
             )}
         </div>
      </div>

      {isInputOpen && (
          <div className="p-6 bg-slate-900 border-b border-white/10 animate-in slide-in-from-top-4 fade-in duration-200">
             <div className="flex justify-between items-center mb-3">
                 <div className="flex p-1 bg-slate-800/50 rounded-lg border border-slate-700">
                   <button 
                     onClick={() => setIsChecklistMode(false)}
                     className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all",
                        !isChecklistMode ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                     )}
                   >
                     <MessageSquare className="w-3.5 h-3.5" /> {t('textMode')}
                   </button>
                   <button 
                     onClick={() => setIsChecklistMode(true)}
                     className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all",
                        isChecklistMode ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                     )}
                   >
                     <CheckSquare className="w-3.5 h-3.5" /> {t('checklistMode')}
                   </button>
                 </div>
                 
                 <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 w-7 p-0 rounded-full hover:bg-white/10">
                     <X className="w-4 h-4" />
                 </Button>
             </div>
             
             <div className="relative">
               <textarea
                 autoFocus
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 className="w-full bg-slate-800 border-slate-700 rounded-lg p-4 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[120px] resize-none shadow-inner"
                 placeholder={isChecklistMode ? t('checklistPlaceholder') : t('writePlaceholder')}
               />
               <div className="absolute bottom-3 right-3 flex gap-2">
                   <Button 
                     size="sm" 
                     variant="ghost"
                     onClick={cancelEdit}
                     className="text-slate-400 hover:text-white"
                   >
                     {t('cancel')}
                   </Button>
                   <Button 
                     size="sm" 
                     onClick={handlePostOrUpdate}
                     disabled={loading || !inputValue.trim()}
                     className="bg-purple-600 hover:bg-purple-700"
                   >
                     {loading ? t('uploading') : (editingUpdateId ? <><Save className="w-3.5 h-3.5 mr-2" /> {t('save')}</> : <><Send className="w-3.5 h-3.5 mr-2" /> {t('publish')}</>)}
                   </Button>
               </div>
             </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
         {updates.map((update) => (
           <div key={update.id} className="relative pl-8 group">
             <div className="absolute left-[11px] top-8 bottom-[-32px] w-[2px] bg-slate-800 group-last:hidden"></div>
             
             <div className="absolute left-[2px] top-1 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden shadow-sm z-10">
                 <div className="w-full h-full bg-purple-600/50 flex items-center justify-center">
                    {update.user_id === user.id ? 'Eu' : 'U'}
                 </div>
             </div>
             
             <div className="flex items-center justify-between gap-2 mb-2">
               <div className="flex items-baseline gap-2">
                   <span className="text-sm font-semibold text-white">
                     {update.user_id === user.id ? 'Você' : 'Usuário'}
                   </span>
                   <span className="text-xs text-slate-500">
                     {format(new Date(update.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                   </span>
               </div>
               
               {/* Controls moved to top right */}
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {update.user_id === user.id && (
                        <button
                            onClick={() => startEditing(update)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded"
                            title={t('edit')}
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <input 
                       type="checkbox" 
                       checked={selectedUpdates.has(update.id)}
                       onChange={() => toggleSelectUpdate(update.id)}
                       className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                       title="Selecionar para exclusão"
                     />
               </div>
             </div>

             <div className={cn(
                 "rounded-xl p-4 text-sm text-slate-200 border transition-colors relative",
                 selectedUpdates.has(update.id) ? "bg-red-900/10 border-red-500/30" : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
             )}>
               {update.type === 'checklist' ? (
                 <div className="space-y-2">
                    {safeParseChecklist(update.content).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 group/item">
                         <div className="relative pt-0.5">
                             <input 
                               type="checkbox"
                               checked={item.checked || false}
                               onChange={() => handleToggleCheckitem(update.id, idx)}
                               className="peer w-4 h-4 rounded border-slate-500 bg-slate-900/50 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-purple-600 checked:border-purple-600 transition-all"
                             />
                             <CheckSquare className="absolute left-0 top-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" />
                         </div>
                         <span 
                           className={cn(
                             "transition-all leading-snug cursor-pointer select-none",
                             item.checked ? "line-through text-slate-500" : "text-slate-200"
                           )}
                           onClick={() => handleToggleCheckitem(update.id, idx)}
                         >
                           {item.text}
                         </span>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="whitespace-pre-wrap leading-relaxed">{update.content}</div>
               )}
             </div>
           </div>
         ))}
         
         {updates.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <MessageSquare className="w-8 h-8 text-slate-500" />
             </div>
             <p className="text-slate-300 font-medium">{t('noUpdates')}</p>
             <p className="text-slate-500 text-sm max-w-xs mt-1">
                {t('newUpdate')}
             </p>
           </div>
         )}
      </div>
    </div>
  );
};

export default TaskUpdates;
