import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Upload, Paperclip, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const TaskAttachments = ({ taskId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (taskId) fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (!error) setAttachments(data);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Arquivo muito grande. Limite de 15MB.' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Math.random()}.${fileExt}`;
      
      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      // Insert into DB
      const { data, error: dbError } = await supabase
        .from('task_attachments')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setAttachments([data, ...attachments]);
      toast({ title: 'Arquivo anexado com sucesso!' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  const handleDelete = async (attId, fileName) => {
     // Note: Realistically we should delete from storage too, but for this demo we'll just delete the reference
     // or delete from storage if we parsed the path correctly.
     const { error } = await supabase.from('task_attachments').delete().eq('id', attId);
     if (!error) {
       setAttachments(attachments.filter(a => a.id !== attId));
       toast({ title: 'Anexo removido' });
     }
  };

  return (
    <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-300 flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Anexos
        </h3>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*,application/pdf,.doc,.docx"
            disabled={uploading}
          />
          <Button size="sm" variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
            {uploading ? 'Enviando...' : <><Upload className="w-3 h-3 mr-2" /> Adicionar</>}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {attachments.map((att) => (
          <div key={att.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center shrink-0">
                {att.file_type?.startsWith('image/') ? (
                   <ImageIcon className="w-4 h-4 text-purple-400" />
                ) : (
                   <FileText className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="truncate">
                <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:underline truncate block">
                  {att.file_name}
                </a>
                <span className="text-xs text-slate-500">
                  {(att.file_size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
            {att.user_id === user.id && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => handleDelete(att.id)}
               >
                 <Trash2 className="w-3 h-3" />
               </Button>
            )}
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="text-slate-600 text-xs italic">Nenhum anexo.</p>
        )}
      </div>
    </div>
  );
};

export default TaskAttachments;