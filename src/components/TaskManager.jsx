import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, LayoutGrid, List, LogOut, Settings, ArrowLeft, Filter, User, DatabaseBackup, UploadCloud, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import KanbanBoard from '@/components/KanbanBoard';
import TaskList from '@/components/TaskList';
import TaskDialog from '@/components/TaskDialog';
import AdminPanel from '@/components/AdminPanel';
import UserProfile from '@/components/UserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { downloadBackup, decryptData } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const TaskManager = ({ initialShowAdmin = false, initialTaskId = null, onBackToPreload }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('board');
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAdmin, setShowAdmin] = useState(initialShowAdmin);
  const [refreshUpdatesKey, setRefreshUpdatesKey] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Profile & Settings
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      fetchData();
      fetchUserProfile();
    }
  }, [user]);

  // Atalhos de Teclado e Scroll Horizontal
  useEffect(() => {
    const handleKeyDown = (e) => {
        // Alt para mostrar dicas
        if (e.key === 'Alt') setShowShortcuts(true);

        // Ctrl + B (Barra de Pesquisa)
        if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            document.getElementById('main-search-input')?.focus();
        }
        // Ctrl + N (Nova Tarefa)
        if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            setEditingTask(null);
            setIsTaskDialogOpen(true);
        }
    };

    const handleKeyUp = (e) => {
        if (e.key === 'Alt') setShowShortcuts(false);
    };

    // Scroll Horizontal com Ctrl + Scroll
    const handleWheel = (e) => {
        if (e.ctrlKey && scrollContainerRef.current) {
             e.preventDefault();
             scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const container = scrollContainerRef.current;
    if(container) container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if(container) container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Handle Initial Task Open (Deep link from Preload)
  useEffect(() => {
    if (initialTaskId && tasks.length > 0 && !loading) {
        const task = tasks.find(t => t.id === initialTaskId);
        if (task) {
            setEditingTask(task);
            setIsTaskDialogOpen(true);
        }
    }
  }, [initialTaskId, tasks, loading]);

  const fetchUserProfile = async () => {
     const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
     if (data) setUserProfile(data);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: colsData, error: colsError } = await supabase
        .from('task_columns')
        .select('*')
        .order('position');
      
      if (colsError) throw colsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setColumns(colsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Task CRUD ---
  const handleCreateTask = async (taskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setIsTaskDialogOpen(false);
      toast({ title: "Tarefa criada com sucesso" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      
      if (editingTask && editingTask.id === taskId) {
        setIsTaskDialogOpen(false);
        setEditingTask(null);
      }
      
      toast({ title: "Tarefa excluída" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const handleMoveTask = async (taskId, newColumnId) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, column_id: newColumnId } : t);
    setTasks(updatedTasks);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: newColumnId })
        .eq('id', taskId);
      if (error) throw error;
    } catch (error) {
      fetchData();
      toast({ variant: "destructive", title: "Erro ao mover tarefa" });
    }
  };

  const handleDuplicateTask = async (task) => {
      const { id, created_at, updated_at, ...taskData } = task;
      const newTask = { ...taskData, title: `${task.title} (Cópia)`, user_id: user.id };
      await handleCreateTask(newTask);
  };

  const handleSaveTemplate = async (task) => {
      const { id, created_at, updated_at, ...taskData } = task;
      
      try {
          const templateTask = { ...taskData, title: `${task.title} (Modelo)`, is_template: true, user_id: user.id };
          const { data: newTemplate, error: tErr } = await supabase.from('tasks').insert([templateTask]).select().single();
          if (tErr) throw tErr;

          const { data: updates } = await supabase.from('task_updates').select('*').eq('task_id', task.id);
          
          if (updates && updates.length > 0) {
              const newUpdates = updates.map(u => ({
                  task_id: newTemplate.id,
                  user_id: user.id,
                  content: u.content,
                  type: u.type
              }));
              await supabase.from('task_updates').insert(newUpdates);
          }

          setTasks([newTemplate, ...tasks]);
          toast({ title: "Modelo salvo com sucesso", description: "O modelo não aparecerá no quadro." });

      } catch (error) {
          toast({ variant: "destructive", title: "Erro ao salvar modelo", description: error.message });
      }
  };

  const handleApplyTemplate = async (targetTask, templateId) => {
      try {
          const template = tasks.find(t => t.id === templateId);
          if (!template) return;

          await supabase.from('tasks').update({
             description: template.description
          }).eq('id', targetTask.id);

          const { data: templateUpdates } = await supabase.from('task_updates').select('*').eq('task_id', templateId);

          if (templateUpdates && templateUpdates.length > 0) {
              const newUpdates = templateUpdates.map(u => ({
                  task_id: targetTask.id,
                  user_id: user.id,
                  content: u.content,
                  type: u.type
              }));
              await supabase.from('task_updates').insert(newUpdates);
          }

          toast({ title: "Modelo aplicado!" });
          setRefreshUpdatesKey(prev => prev + 1);

      } catch (error) {
          toast({ variant: "destructive", title: "Erro ao aplicar modelo" });
      }
  };

  const handleDeleteTemplate = async (templateId) => {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', templateId);
        if (error) throw error;
        setTasks(tasks.filter(t => t.id !== templateId));
        toast({ title: "Modelo excluído" });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao excluir modelo' });
      }
  };

  // --- Column CRUD ---
  const handleAddColumn = async () => {
      const newColumn = {
          title: "Nova Coluna",
          user_id: user.id,
          position: columns.length,
          color: "border-slate-700"
      };
      try {
          const { data, error } = await supabase.from('task_columns').insert([newColumn]).select().single();
          if (error) throw error;
          setColumns([...columns, data]);
      } catch (error) {
          toast({ variant: "destructive", title: "Erro ao criar coluna" });
      }
  };

  const handleUpdateColumn = async (columnId, updates) => {
      setColumns(columns.map(c => c.id === columnId ? { ...c, ...updates } : c));
      try {
          const { error } = await supabase.from('task_columns').update(updates).eq('id', columnId);
          if (error) throw error;
      } catch (error) { fetchData(); }
  };

  const handleDeleteColumn = async (columnId) => {
      try {
          // Database is configured with ON DELETE CASCADE, so we don't need to manually delete tasks
          const { error } = await supabase.from('task_columns').delete().eq('id', columnId);
          if (error) throw error;
          
          setColumns(columns.filter(c => c.id !== columnId));
          setTasks(tasks.filter(t => t.column_id !== columnId));
          toast({ title: "Coluna excluída" });
      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "Erro ao excluir coluna", description: error.message });
      }
  };

  const handleReorderColumn = async (sourceId, targetId) => {
      const sourceIndex = columns.findIndex(c => c.id === sourceId);
      const targetIndex = columns.findIndex(c => c.id === targetId);
      const newColumns = [...columns];
      const [moved] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(targetIndex, 0, moved);
      const updatedColumns = newColumns.map((c, idx) => ({ ...c, position: idx }));
      setColumns(updatedColumns);

      try {
          for (const c of updatedColumns) {
              await supabase.from('task_columns').update({ position: c.position }).eq('id', c.id);
          }
      } catch (error) { console.error("Reorder failed", error); }
  };

  // --- Backup Logic ---
  const handleBackup = () => {
      // Create a comprehensive backup object
      const backupData = {
          metadata: {
            timestamp: new Date().toISOString(),
            version: "1.0",
            user_email: user.email,
            user_id: user.id,
          },
          columns: columns,
          tasks: tasks
      };
      
      const success = downloadBackup(backupData, `backup-agiliza2b-${new Date().toISOString().split('T')[0]}.enc`);
      
      if (success) {
        toast({ title: "Backup realizado", description: "O arquivo foi baixado para o seu dispositivo." });
      } else {
        toast({ variant: "destructive", title: "Falha no backup", description: "Não foi possível gerar o arquivo." });
      }
  };

  const handleRestore = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Clear input so same file can be selected again if needed
      e.target.value = null;

      const reader = new FileReader();
      
      reader.onload = async (event) => {
          setLoading(true);
          try {
              const encryptedContent = event.target.result;
              const data = decryptData(encryptedContent); 
              
              if (!data || !data.metadata || !data.columns || !data.tasks) {
                  throw new Error("Arquivo de backup inválido ou corrompido.");
              }
              
              if (data.metadata.user_id !== user.id) {
                 const confirmRestore = window.confirm("Este backup pertence a outro usuário ou instância. Deseja continuar mesmo assim?");
                 if (!confirmRestore) {
                     setLoading(false);
                     return;
                 }
              }

              // 1. Restore Columns (Upsert)
              if (data.columns.length > 0) {
                  // Ensure we only restore columns that match current user ID to avoid RLS issues if importing cross-user
                  const columnsToRestore = data.columns.map(c => ({
                      ...c,
                      user_id: user.id 
                  }));
                  
                  const { error: colError } = await supabase
                      .from('task_columns')
                      .upsert(columnsToRestore, { onConflict: 'id' });
                      
                  if (colError) throw new Error(`Erro ao restaurar colunas: ${colError.message}`);
              }

              // 2. Restore Tasks (Upsert)
              if (data.tasks.length > 0) {
                   const tasksToRestore = data.tasks.map(t => ({
                      ...t,
                      user_id: user.id
                  }));

                  const { error: taskError } = await supabase
                      .from('tasks')
                      .upsert(tasksToRestore, { onConflict: 'id' });
                      
                  if (taskError) throw new Error(`Erro ao restaurar tarefas: ${taskError.message}`);
              }
              
              // Refresh View
              await fetchData();
              toast({ 
                  title: "Restauração concluída", 
                  description: `${data.tasks.length} tarefas e ${data.columns.length} colunas processadas.` 
              });

          } catch (error) {
              console.error(error);
              toast({ 
                  variant: "destructive", 
                  title: "Falha na restauração", 
                  description: error.message 
              });
          } finally {
              setLoading(false);
          }
      };
      
      reader.readAsText(file);
  };


  const visibleTasks = tasks.filter(task => !task.is_template);
  const templates = tasks.filter(task => task.is_template);

  const filteredTasks = visibleTasks.filter(task => {
    // Search Filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type Filter
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let matchesType = true;
    if (filterType === 'overdue') {
        matchesType = task.due_date && new Date(task.due_date) < startOfDay && task.status !== 'done';
    } else if (filterType === 'today') {
        matchesType = task.due_date && new Date(task.due_date) >= startOfDay && new Date(task.due_date) < endOfDay;
    } else if (filterType === 'month') {
        matchesType = task.due_date && new Date(task.due_date) >= startOfMonth && new Date(task.due_date) <= endOfMonth;
    } else if (filterType === 'done') {
        matchesType = task.status === 'done';
    } else if (filterType === 'pending') {
        matchesType = task.status === 'todo';
    }

    // Filtro de Prioridade
    let matchesPriority = true;
    if (priorityFilter !== 'all') {
        matchesPriority = task.priority === priorityFilter;
    }

    // Filtro por Responsável
    let matchesResponsible = true;
    if (responsibleFilter.trim()) {
        matchesResponsible = task.assigned_to && task.assigned_to.toLowerCase().includes(responsibleFilter.toLowerCase());
    }

    return matchesSearch && matchesType && matchesPriority && matchesResponsible;
  });

  if (showAdmin) {
      return <AdminPanel user={user} onBack={() => setShowAdmin(false)} onBackup={handleBackup} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      <header className="h-auto md:h-16 border-b border-white/10 flex flex-col md:flex-row items-center justify-between px-6 py-2 md:py-0 bg-slate-900/50 backdrop-blur-md z-20 gap-2">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button variant="ghost" size="icon" onClick={onBackToPreload} title={t('back')}>
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Button>
          
          {/* User Avatar in Header */}
          <div className="relative">
             <Avatar className="w-9 h-9 border border-white/10 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setIsProfileOpen(true)}>
                 <AvatarImage src={userProfile?.avatar_url} />
                 <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                     {userProfile?.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                 </AvatarFallback>
             </Avatar>
             <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
          </div>

          <div className="flex flex-col justify-center h-full">
               <img 
                  src="https://horizons-cdn.hostinger.com/118e3182-05e0-4d1d-9b06-3261c5b8b9c3/6434ac960d8fa2aa480449f700cc6ab9.png" 
                  alt="Agiliza Tasks 2b" 
                  className="h-8 w-auto object-contain hidden md:block"
              />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Filtros */}
           <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[110px] h-8 bg-slate-900/50 border-slate-700 text-xs">
                    <Filter className="w-3 h-3 mr-1.5 text-slate-400" />
                    <SelectValue placeholder={t('filter')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="overdue">Atrasadas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="month">{t('thisMonth')}</SelectItem>
                    <SelectItem value="done">{t('doneFilter')}</SelectItem>
                    <SelectItem value="pending">{t('pendingFilter')}</SelectItem>
                </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[100px] h-8 bg-slate-900/50 border-slate-700 text-xs">
                    <span className="mr-1.5 text-slate-400">Prior:</span>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
            </Select>

            <div className="relative hidden md:block w-32">
                 <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                 <Input 
                    placeholder="Responsável..."
                    value={responsibleFilter}
                    onChange={(e) => setResponsibleFilter(e.target.value)}
                    className="h-8 bg-slate-900/50 border-slate-700 pl-7 text-xs"
                 />
            </div>

            <div className="relative w-full md:w-40">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input 
                id="main-search-input"
                placeholder="Pesquisar (Ctrl+B)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border-slate-700 pl-8 h-8 text-xs focus:ring-blue-500/50"
                />
            </div>

          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 hidden sm:flex">
            <button 
              onClick={() => setViewMode('board')}
              title={t('viewBoard')}
              className={`p-1 rounded-md transition-all ${viewMode === 'board' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              title={t('viewList')}
              className={`p-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button onClick={() => { setEditingTask(null); setIsTaskDialogOpen(true); }} className="h-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 whitespace-nowrap text-xs relative group">
            <Plus className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">{t('newTask')}</span>
            {showShortcuts && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded shadow-xl border border-white/10 z-50">Ctrl+N</span>}
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1 md:mx-2 hidden md:block" />
          
          {/* Hidden File Input for Restore */}
          <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".enc,.json" 
              onChange={handleRestore} 
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="w-4 h-4 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuLabel>{t('settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuLabel className="text-xs font-normal text-slate-500 uppercase">Tema</DropdownMenuLabel>
                <div className="grid grid-cols-4 gap-1 p-2">
                    <button onClick={() => setTheme('dark')} className={`w-6 h-6 rounded-full bg-slate-900 border ${theme === 'dark' ? 'ring-2 ring-white' : 'border-slate-600'}`} title="Escuro (Padrão)"></button>
                    <button onClick={() => setTheme('light')} className={`w-6 h-6 rounded-full bg-white border ${theme === 'light' ? 'ring-2 ring-blue-500' : 'border-slate-300'}`} title="Claro"></button>
                    <button onClick={() => setTheme('blue')} className={`w-6 h-6 rounded-full bg-blue-900 border ${theme === 'blue' ? 'ring-2 ring-white' : 'border-blue-700'}`} title="Azul"></button>
                    <button onClick={() => setTheme('fume')} className={`w-6 h-6 rounded-full bg-zinc-800 border ${theme === 'fume' ? 'ring-2 ring-white' : 'border-zinc-600'}`} title="Fumê"></button>
                </div>
                <DropdownMenuSeparator className="bg-slate-800" />
                
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="cursor-pointer hover:bg-slate-800">
                    <User className="w-4 h-4 mr-2" /> {t('myProfile')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleBackup} className="cursor-pointer hover:bg-slate-800">
                    <DatabaseBackup className="w-4 h-4 mr-2" /> {t('backup')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer hover:bg-slate-800 text-blue-400 hover:text-blue-300">
                    <UploadCloud className="w-4 h-4 mr-2" /> {t('restore')}
                </DropdownMenuItem>

                {/* Only show Admin Panel if authorised */}
                {user.email === 'data@agiliza2b.com' && (
                    <DropdownMenuItem onClick={() => setShowAdmin(true)} className="cursor-pointer hover:bg-slate-800 text-purple-400 hover:text-purple-300">
                        <Settings className="w-4 h-4 mr-2" /> {t('adminPanel')}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-slate-800">
                    <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        
        <div ref={scrollContainerRef} className="h-full overflow-x-auto p-4 md:p-6 scroll-smooth">
          {viewMode === 'board' ? (
            <KanbanBoard 
              tasks={filteredTasks} 
              columns={columns}
              loading={loading}
              onEditTask={(task) => { setEditingTask(task); setIsTaskDialogOpen(true); }}
              onDeleteTask={handleDeleteTask}
              onDuplicateTask={handleDuplicateTask}
              onSaveTemplate={handleSaveTemplate}
              onMoveTask={handleMoveTask}
              onAddColumn={handleAddColumn}
              onDeleteColumn={handleDeleteColumn}
              onUpdateColumn={handleUpdateColumn}
              onReorderColumn={handleReorderColumn}
            />
          ) : (
            <TaskList 
              tasks={filteredTasks} 
              onEdit={(task) => { setEditingTask(task); setIsTaskDialogOpen(true); }}
              onDelete={handleDeleteTask}
            />
          )}
        </div>
      </main>

      {/* Task Dialog */}
      <TaskDialog 
        open={isTaskDialogOpen} 
        onOpenChange={setIsTaskDialogOpen}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        columns={columns}
        templates={templates}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
        onSaveTemplate={handleSaveTemplate}
        onApplyTemplate={handleApplyTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        refreshUpdatesKey={refreshUpdatesKey}
      />

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
         <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
             <UserProfile user={user} onClose={() => setIsProfileOpen(false)} />
         </DialogContent>
      </Dialog>

    </div>
  );
};

export default TaskManager;