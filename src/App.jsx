
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
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
  const [currentView, setCurrentView] = useState('preload'); // 'preload' | 'dashboard' | 'admin'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [appKey, setAppKey] = useState(0); 
  const [requireMfa, setRequireMfa] = useState(false);
  const [checkingMfa, setCheckingMfa] = useState(true);

  // Check MFA Status whenever user logs in or auth state changes
  useEffect(() => {
    const checkMfaStatus = async () => {
       if (!user) {
           setRequireMfa(false);
           setCheckingMfa(false);
           return;
       }
       
       try {
           // 1. Check if user has enrolled factors
           const { data: factors } = await supabase.auth.mfa.listFactors();
           
           if (!factors || factors.totp.length === 0) {
               setRequireMfa(false);
               setCheckingMfa(false);
               return;
           }

           // 2. Check assurance level
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

    // Listen for MFA events (like successful challenge)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'MFA_CHALLENGE_VERIFIED' || event === 'SIGNED_IN') {
             checkMfaStatus();
        }
    });

    return () => subscription.unsubscribe();

  }, [user]);

  // View Routing Effect
  useEffect(() => {
    if (user && !requireMfa && !checkingMfa) {
      if (user.email === 'data@agiliza2b.com') {
        setCurrentView('admin');
      } else {
        // Only reset to preload if we are not already navigating
        // We keep the current view state unless explicitly logged out
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

  // Not logged in
  if (!user) {
    return <AuthForm />;
  }

  // Logged in but needs MFA
  if (requireMfa) {
      return <MFAVerificationScreen onVerified={() => setRequireMfa(false)} />;
  }

  // Admin View
  if (currentView === 'admin' && user.email === 'data@agiliza2b.com') {
     return (
        <AdminPanel 
           user={user} 
           onBack={() => setCurrentView('dashboard')} 
        />
     );
  }

  // Preload Screen
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

  // Dashboard
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
    <AuthProvider>
      <LanguageProvider>
        <Helmet>
          <title>Agiliza2b - Gestão Inteligente de Tarefas</title>
          <meta name="description" content="Sistema corporativo de gestão de tarefas Agiliza2b" />
        </Helmet>
        <AppContent />
        <Toaster />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
