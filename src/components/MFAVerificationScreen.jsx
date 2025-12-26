
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MFAVerificationScreen = ({ onVerified }) => {
    const { signOut } = useAuth();
    const { toast } = useToast();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [factors, setFactors] = useState([]);

    useEffect(() => {
        const loadFactors = async () => {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (data && data.totp) {
                setFactors(data.totp);
            }
        };
        loadFactors();
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Try to verify with the first available TOTP factor (usually users have one)
            const factorId = factors[0]?.id;
            
            if (!factorId) throw new Error("Fator de autenticação não encontrado.");

            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code
            });

            if (error) throw error;

            toast({ title: "Autenticado com sucesso" });
            if (onVerified) onVerified();

        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Código inválido", 
                description: "Verifique o código e tente novamente." 
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <CardTitle>Autenticação em Duas Etapas</CardTitle>
                    <CardDescription className="text-slate-400">
                        Sua conta está protegida. Digite o código do seu aplicativo autenticador para continuar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                             <Input 
                                placeholder="000 000" 
                                className="bg-slate-800 border-slate-700 text-center text-2xl tracking-[0.5em] h-14 font-mono"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                autoFocus
                             />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={loading || code.length < 6}>
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verificar"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button variant="link" className="text-slate-500 hover:text-slate-300" onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" /> Cancelar e Sair
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default MFAVerificationScreen;
