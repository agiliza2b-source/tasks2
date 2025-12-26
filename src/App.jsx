import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GlobalErrorProvider } from '@/components/GlobalErrorHandler'; // <--- Importe aqui
import { Toaster } from '@/components/ui/toaster';
import TaskManager from '@/components/TaskManager';
import AuthForm from '@/components/AuthForm';
import PreloadScreen from '@/components/PreloadScreen';
import AdminPanel from '@/components/AdminPanel';
import MFAVerificationScreen from '@/components/MFAVerificationScreen';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const AppContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('preload'); 
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [appKey, setAppKey] = useState(0); 
  const [requireMfa, setRequireMfa] = useState(false);
  const [checkingMfa, setCheckingMfa] = useState(true);

  useEffect(() => {
    const checkMfaStatus = async () => {
       if (!user) {
           setRequireMfa(false);
           setCheckingMfa(false);
           return;
       }
       
       try {
           const { data: factors } = await supabase.auth.mfa.listFactors();
           
           if (!factors || factors.totp.length === 0) {
               setRequireMfa(false);
               setCheckingMfa(false);
               return;
           }

           const { data: authLevel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
           
           if (authLevel.currentLevel === 'aal1') {
               setRequireMfa(true);
           } else {
               setRequireMfa(false);
           }
       } catch (error) {
           console.error("MFA Check Error", error);
       } finally {
           setCheckingMfa(false);
       }
    };

    checkMfaStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'MFA_CHALLENGE_VERIFIED' || event === 'SIGNED_IN') {
             checkMfaStatus();
        }
    });

    return () => subscription.unsubscribe();

  }, [user]);

  useEffect(() => {
    if (user && !requireMfa && !checkingMfa) {
      if (user.email === 'data@agiliza2b.com') {
        setCurrentView('admin');
      } else {
        if (currentView === 'preload' && !selectedTaskId) {
            // Maintain preload
        } 
      }
    } else if (!user) {
      setCurrentView('preload');
    }
  }, [user, requireMfa, checkingMfa]);

  if (authLoading || (user && checkingMfa)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (requireMfa) {
      return <MFAVerificationScreen onVerified={() => setRequireMfa(false)} />;
  }

  if (currentView === 'admin' && user.email === 'data@agiliza2b.com') {
     return (
        <AdminPanel 
           user={user} 
           onBack={() => setCurrentView('dashboard')} 
        />
     );
  }

  if (currentView === 'preload') {
    return (
      <PreloadScreen 
        key={`preload-${appKey}`}
        user={user}
        onEnterDashboard={() => setCurrentView('dashboard')}
        onEnterAdmin={() => {
            if (user.email === 'data@agiliza2b.com') {
               setCurrentView('admin');
            }
        }}
        onSelectTask={(taskId) => {
            setSelectedTaskId(taskId);
            setCurrentView('dashboard');
        }}
        onSignOut={signOut}
      />
    );
  }

  return (
    <TaskManager 
      key={`manager-${appKey}`}
      initialShowAdmin={false}
      initialTaskId={selectedTaskId}
      onBackToPreload={() => setCurrentView('preload')}
    />
  );
};

function App() {
  return (
    // Adicionado GlobalErrorProvider aqui no topo
    <GlobalErrorProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Helmet>
              <title>Agiliza2b - Gestão Inteligente de Tarefas</title>
              <meta name="description" content="Sistema corporativo de gestão de tarefas Agiliza2b" />
            </Helmet>
            <AppContent />
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </GlobalErrorProvider>
  );
}

export default App;