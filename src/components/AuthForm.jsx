
import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSelector from '@/components/LanguageSelector';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
    } catch (error) {
      // Error handled in context toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-white overflow-hidden">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden md:flex w-1/2 lg:w-[60%] bg-slate-900 relative items-center justify-center overflow-hidden border-r border-slate-800">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 via-slate-900 to-purple-900/20"></div>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl mix-blend-screen"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl mix-blend-screen"></div>

            <div className="relative z-10 flex flex-col items-center max-w-lg text-center p-12">
                <motion.img 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    src="https://horizons-cdn.hostinger.com/118e3182-05e0-4d1d-9b06-3261c5b8b9c3/6434ac960d8fa2aa480449f700cc6ab9.png" 
                    alt="Agiliza Tasks 2b" 
                    className="h-32 w-auto mb-8 drop-shadow-2xl"
                />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-6"
                >
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        Gestão Inteligente para <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Equipes de Alta Performance
                        </span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Organize tarefas, colabore em tempo real e alcance seus objetivos com o Agiliza2b.
                    </p>

                    <div className="flex flex-col gap-4 mt-8 items-start pl-8">
                        {['Kanban Intuitivo', 'Segurança Avançada (2FA)', 'Relatórios em Tempo Real'].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-300">
                                <div className="p-1 rounded-full bg-blue-500/20 text-blue-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 lg:w-[40%] flex items-center justify-center p-6 md:p-12 relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 md:hidden"></div>
             
             {/* Language Selector Top Right */}
             <div className="absolute top-6 right-6 z-20">
                 <LanguageSelector />
             </div>

             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8"
             >
                <div className="text-center md:text-left">
                    {/* Mobile Logo */}
                    <img 
                        src="https://horizons-cdn.hostinger.com/118e3182-05e0-4d1d-9b06-3261c5b8b9c3/6434ac960d8fa2aa480449f700cc6ab9.png" 
                        alt="Agiliza Tasks 2b" 
                        className="h-20 mx-auto md:hidden mb-6"
                    />

                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {isLogin ? t('welcomeBack') : t('createAccount')}
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {isLogin 
                            ? t('enterCredentials')
                            : t('fillDetails')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">{t('corporateEmail')}</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-blue-500 h-11"
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" classname="text-slate-300">{t('password')}</Label>
                                {isLogin && (
                                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300">
                                        {t('forgotPassword')}
                                    </button>
                                )}
                            </div>
                            <Input 
                                id="password" 
                                type="password" 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:ring-blue-500 h-11"
                                required 
                            />
                        </div>
                    </div>

                    {isLogin && (
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="remember" 
                                checked={rememberMe}
                                onCheckedChange={setRememberMe}
                                className="border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300 cursor-pointer select-none"
                            >
                                {t('rememberMe')}
                            </label>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-900/20"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLogin ? t('accessPlatform') : t('createFreeAccount')}
                        {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-950 px-2 text-slate-500">{t('orContinueWith')}</span>
                    </div>
                </div>

                <div className="text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        {isLogin ? (
                            <>{t('noAccount')} <span className="text-blue-400 font-medium">{t('register')}</span></>
                        ) : (
                            <>{t('haveAccount')} <span className="text-blue-400 font-medium">{t('login')}</span></>
                        )}
                    </button>
                </div>
             </motion.div>

             {/* Footer Info */}
             <div className="absolute bottom-6 text-center text-xs text-slate-600">
                 &copy; {new Date().getFullYear()} Agiliza2b. Todos os direitos reservados.
             </div>
        </div>
    </div>
  );
};

export default AuthForm;
