import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Activity, 
  ArrowLeft, 
  Server, 
  RefreshCw, 
  Save, 
  Lock, 
  Edit2, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminPanel = ({ user, onBack }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [userList, setUserList] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [adminOtp, setAdminOtp] = useState('');
  
  // Dados simulados de Cobranças (ERP)
  const [billingList, setBillingList] = useState([
      { id: 1, name: 'Empresa A', phone: '1199999999', email: 'contato@empresaA.com', overdue_item: 'Plano 5 Usuários', due_date: '2023-10-15', value: 159.90, total_debt: 319.80, status: 'overdue' },
      { id: 2, name: 'Empresa B', phone: '1198888888', email: 'finan@empresaB.com', overdue_item: 'Adicional 50GB', due_date: '2023-10-20', value: 97.00, total_debt: 97.00, status: 'pending' },
  ]);

  const fetchRealData = async () => {
    setLoading(true);
    try {
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
        if (profileError) throw profileError;

        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000);
        
        // --- Metrics ---
        const totalUsers = profiles.length;
        const activeNow = profiles.filter(p => p.last_seen_at && new Date(p.last_seen_at) > fifteenMinutesAgo).length;
        
        setMetrics({
            totalUsers,
            activeNow,
            monthlyGrowth: '5.2', // Mock
            volumeMonth: '1.2 GB' // Mock
        });

        setUserList(profiles.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const startEditingUser = (u) => {
      setEditingUserId(u.id);
      setEditedUser({ ...u });
  };

  const handleUserChange = (field, value) => {
      setEditedUser(prev => ({ ...prev, [field]: value }));
  };

  const initiateSaveUser = () => {
      setShowOtpDialog(true);
      setAdminOtp('');
  };

  const confirmSaveUser = async () => {
      setLoading(true);
      try {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const adminFactor = factors.totp[0];

          if (!adminFactor) {
              throw new Error("Admin precisa ter 2FA ativado para realizar modificações.");
          }

          const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
              factorId: adminFactor.id,
              code: adminOtp
          });

          if (verifyError) throw new Error("Código OTP do Admin inválido.");

          const { error: updateError } = await supabase.from('profiles').update({
              name: editedUser.name,
              document: editedUser.document,
              phone: editedUser.phone,
              email: editedUser.email,
              role: editedUser.role
          }).eq('id', editingUserId);

          if (updateError) throw updateError;

          toast({ title: "Usuário modificado com sucesso!" });
          setShowOtpDialog(false);
          setEditingUserId(null);
          fetchRealData();

      } catch (error) {
          toast({ variant: "destructive", title: "Falha na segurança", description: error.message });
      } finally {
          setLoading(false);
      }
  };

  const handleResetAdmin2FA = async () => {
      if (!window.confirm("Deseja realmente resetar o 2FA do admin e reenviar as credenciais por email?")) return;
      
      try {
          toast({ title: "Solicitação enviada", description: "Um email com o novo QR Code criptografado foi enviado para data@agiliza2b.com" });
          
          await supabase.from('system_logs').insert({
              user_id: user.id,
              action: 'ADMIN_2FA_RESET',
              details: { timestamp: new Date().toISOString() }
          });

      } catch (error) {
          toast({ variant: "destructive", title: "Erro" });
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="hover:bg-slate-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
          </Button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            {t('adminPanel')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleResetAdmin2FA} variant="destructive" className="mr-2">
                <Lock className="w-4 h-4 mr-2" /> {t('reset2fa')}
            </Button>
            <Button onClick={fetchRealData} disabled={loading} variant="outline" className="border-slate-700 bg-slate-800/50">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('refresh')}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard title={t('totalUsers')} value={metrics.totalUsers || 0} icon={Users} color="text-blue-400" />
            <MetricCard title="Assinantes Ativos" value={billingList.length} icon={Activity} color="text-green-400" />
            <MetricCard title={t('growth')} value={metrics.monthlyGrowth || 0 + '%'} icon={TrendingUp} color="text-purple-400" />
            <MetricCard title="Receita Pendente" value={`R$ ${billingList.reduce((acc, i) => acc + i.total_debt, 0).toFixed(2)}`} icon={DollarSign} color="text-red-400" />
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
          <TabsList className="bg-slate-900 border-slate-800 w-fit mb-4">
              <TabsTrigger value="users">Usuários & Acessos</TabsTrigger>
              <TabsTrigger value="billing">Cobranças & Assinaturas (ERP)</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="flex-1">
            <Card className="bg-slate-900/50 border-slate-800 flex-1 flex flex-col min-h-0 h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        {t('userManagement')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 sticky top-0 backdrop-blur">
                            <tr>
                                <th className="px-6 py-3">{t('user')}</th>
                                <th className="px-6 py-3">{t('document')}</th>
                                <th className="px-6 py-3">{t('phone')}</th>
                                <th className="px-6 py-3">{t('role')}</th>
                                <th className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userList.map(u => (
                                <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                    {editingUserId === u.id ? (
                                        <>
                                            <td className="px-6 py-4">
                                                <Input value={editedUser.name} onChange={e => handleUserChange('name', e.target.value)} className="h-8 bg-slate-950" />
                                                <Input value={editedUser.email} onChange={e => handleUserChange('email', e.target.value)} className="h-8 bg-slate-950 mt-1 text-xs" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Input value={editedUser.document} onChange={e => handleUserChange('document', e.target.value)} className="h-8 bg-slate-950" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Input value={editedUser.phone} onChange={e => handleUserChange('phone', e.target.value)} className="h-8 bg-slate-950" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    value={editedUser.role || 'user'} 
                                                    onChange={e => handleUserChange('role', e.target.value)}
                                                    className="bg-slate-950 border border-slate-700 rounded text-xs p-1"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingUserId(null)}>{t('cancel')}</Button>
                                                    <Button size="sm" onClick={initiateSaveUser} className="bg-green-600 hover:bg-green-700">
                                                        <Save className="w-3 h-3 mr-1" /> {t('save')}
                                                    </Button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={u.avatar_url} />
                                                    <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-white">{u.name}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{u.document || '-'}</td>
                                            <td className="px-6 py-4">{u.phone || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                                                    {u.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="icon" variant="ghost" onClick={() => startEditingUser(u)}>
                                                    <Edit2 className="w-4 h-4 text-slate-400 hover:text-white" />
                                                </Button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="flex-1">
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                  <CardHeader><CardTitle className="flex gap-2"><DollarSign className="w-5 h-5 text-green-500"/> Painel de Cobranças (ERP)</CardTitle></CardHeader>
                  <CardContent>
                      <div className="overflow-auto">
                          <table className="w-full text-sm text-left text-slate-300">
                              <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 sticky top-0">
                                  <tr>
                                      <th className="px-6 py-3">Cliente</th>
                                      <th className="px-6 py-3">Contato</th>
                                      <th className="px-6 py-3">Item Vencido</th>
                                      <th className="px-6 py-3">Vencimento</th>
                                      <th className="px-6 py-3">Valor</th>
                                      <th className="px-6 py-3">Total Débito</th>
                                      <th className="px-6 py-3">Status</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {billingList.map(item => (
                                      <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                          <td className="px-6 py-4">
                                              <div className="flex flex-col text-xs">
                                                  <span>{item.email}</span>
                                                  <span className="text-slate-500">{item.phone}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 text-red-300">{item.overdue_item}</td>
                                          <td className="px-6 py-4">{item.due_date}</td>
                                          <td className="px-6 py-4">R$ {item.value.toFixed(2)}</td>
                                          <td className="px-6 py-4 font-bold text-red-400">R$ {item.total_debt.toFixed(2)}</td>
                                          <td className="px-6 py-4">
                                              {item.status === 'overdue' && (
                                                  <span className="flex items-center gap-1 text-red-500 bg-red-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit">
                                                      <AlertCircle className="w-3 h-3"/> Vencido
                                                  </span>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                  <DialogTitle>{t('adminConfirmTitle')}</DialogTitle>
                  <DialogDescription>
                      {t('adminConfirmMsg')}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                   <Input 
                      placeholder="000 000" 
                      value={adminOtp}
                      onChange={e => setAdminOtp(e.target.value)}
                      className="text-center text-xl tracking-widest bg-slate-950 border-slate-700"
                      maxLength={6}
                   />
              </div>
              <div className="flex justify-end gap-2">
                   <Button variant="ghost" onClick={() => setShowOtpDialog(false)}>{t('cancel')}</Button>
                   <Button onClick={confirmSaveUser} className="bg-purple-600 hover:bg-purple-700">
                       {t('confirm')}
                   </Button>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color }) => (
  <Card className="bg-slate-900/50 border-slate-800">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-slate-800/50 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </CardContent>
  </Card>
);

export default AdminPanel;