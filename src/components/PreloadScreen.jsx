
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const PreloadScreen = ({ onEnterDashboard, onEnterAdmin, onSelectTask, user, onSignOut }) => {
  const [searchTasks, setSearchTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Load a lightweight list of tasks for the selector
    const loadTaskOptions = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20); 
      setSearchTasks(data || []);
      setLoading(false);
    };
    if (user) {
      loadTaskOptions();
    }
  }, [user]);

  const filteredOptions = searchTasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl relative overflow-hidden"
      >
        {/* Logo Mark Watermark */}
        <div className="absolute -top-10 -right-10 text-white/5 font-bold text-9xl select-none pointer-events-none">
            A2B
        </div>

        <div className="text-center mb-8 relative z-10 flex flex-col items-center">
          <img 
            src="https://horizons-cdn.hostinger.com/118e3182-05e0-4d1d-9b06-3261c5b8b9c3/6434ac960d8fa2aa480449f700cc6ab9.png" 
            alt="Agiliza Tasks 2b" 
            className="h-24 w-auto mb-6 drop-shadow-xl"
          />
          <h1 className="text-3xl font-bold text-white mb-2">{t('welcome')}</h1>
          <p className="text-slate-300">{t('selectTaskMsg')}</p>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('quickAccess')}
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            
            {/* Dropdown results */}
            {searchTerm && (
              <div className="absolute w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(task => (
                    <button
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="w-full text-left px-4 py-3 text-slate-200 hover:bg-white/10 hover:text-white transition-colors flex justify-between items-center"
                    >
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-500 text-sm">{t('noTasksFound')}</div>
                )}
              </div>
            )}
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">{t('actions')}</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={onEnterDashboard}
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg group"
              >
                <LayoutDashboard className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {t('accessDashboard')}
              </Button>
          </div>

          <button
            onClick={onSignOut}
            className="w-full text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 mt-4"
          >
            <LogOut className="w-4 h-4" />
            {t('exitAccount')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PreloadScreen;
