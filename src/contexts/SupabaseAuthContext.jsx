
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(() => {
     return localStorage.getItem('agiliza_remember_me') === 'true';
  });

  // Heartbeat to update last_seen_at
  const updateHeartbeat = async (userId) => {
    if (!userId) return;
    try {
        await supabase
            .from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', userId);
    } catch (err) {
        // Silent fail for heartbeat to prevent error loops
        console.warn("Heartbeat update failed", err);
    }
  };

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    
    // Only update state if user ID actually changed to prevent unnecessary re-renders
    setUser(prev => (prev?.id === currentUser?.id ? prev : currentUser));
    setLoading(false);

    // If we have a user, update their "last seen" status immediately
    if (currentUser) {
        updateHeartbeat(currentUser.id);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            // Handle specific session errors by clearing local state
            if (
                error.message.includes("Refresh Token Not Found") || 
                error.message.includes("Invalid Refresh Token") ||
                error.code === 'session_not_found'
            ) {
                console.warn("Invalid session detected. Clearing local state.");
                // Force local signout to clean up storage
                await supabase.auth.signOut().catch(() => {}); 
                if (mounted) {
                    setSession(null);
                    setUser(null);
                }
            }
            throw error;
        }
        
        if (mounted) handleSession(session);
      } catch (error) {
        console.error("Session check failed", error);
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
            if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                setSession(null);
                setUser(null);
                setLoading(false);
            } else {
                handleSession(session);
            }
            
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    await supabase.from('system_logs').insert({
                        user_id: session.user.id,
                        action: 'LOGIN',
                        details: { email: session.user.email, timestamp: new Date().toISOString() }
                    });
                } catch (e) { 
                    // Ignore log errors
                }
            }
        }
      }
    );

    const heartbeatInterval = setInterval(() => {
        if (session?.user) {
            updateHeartbeat(session.user.id);
        }
    }, 5 * 60 * 1000);

    return () => {
        mounted = false;
        subscription.unsubscribe();
        clearInterval(heartbeatInterval);
    };
  }, [handleSession, session?.user?.id]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no cadastro",
        description: error.message || "Algo deu errado",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password, shouldRemember = false) => {
    // Save preference
    setRememberMe(shouldRemember);
    localStorage.setItem('agiliza_remember_me', shouldRemember);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no login",
        description: error.message || "Algo deu errado",
      });
    }

    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
        const { error } = await supabase.auth.signOut();
        
        // If the session is already not found on server (403), we treat it as a success locally
        if (error && !error.message?.includes('session_not_found') && error.status !== 403) {
             throw error;
        }
    } catch (error) {
        console.error("Sign out error:", error);
        // We don't show a toast for session_not_found as it's confusing for the user
        // Only show real errors
        if (!error.message?.includes('session_not_found') && error.status !== 403) {
             toast({
                variant: "destructive",
                title: "Aviso ao sair",
                description: "Sua sessão foi encerrada localmente.",
            });
        }
    } finally {
        // Always clear local state regardless of server response
        setUser(null);
        setSession(null);
        // Clear any potential stale data in local storage if needed
        localStorage.removeItem('sb-access-token'); 
        localStorage.removeItem('sb-refresh-token');
    }

    return { error: null };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    rememberMe,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, rememberMe, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
