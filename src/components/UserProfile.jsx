
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2, Camera, Shield, ShieldAlert, Languages } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LanguageSelector from '@/components/LanguageSelector';

const UserProfile = ({ onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    avatar_url: '',
    preferences: {}
  });
  
  // MFA States
  const [mfaFactors, setMfaFactors] = useState([]);
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [factorIdToVerify, setFactorIdToVerify] = useState(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMfaFactors();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMfaFactors = async () => {
      try {
          const { data, error } = await supabase.auth.mfa.listFactors();
          if (error) throw error;
          // Filter only verified TOTP factors
          setMfaFactors(data.totp.filter(f => f.status === 'verified'));
      } catch (error) {
          console.error("Error fetching factors", error);
      }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          preferences: profile.preferences
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
          className: "bg-green-500 border-green-600 text-white"
      });
    } catch (error) {
      toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({
          title: "Foto atualizada",
          description: "Sua nova foto de perfil foi salva.",
          className: "bg-green-500 border-green-600 text-white"
      });

    } catch (error) {
      toast({
          variant: "destructive",
          title: "Erro no upload",
          description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // --- MFA Logic ---

  const startMfaSetup = async () => {
      try {
          const { data, error } = await supabase.auth.mfa.enroll({
              factorType: 'totp'
          });
          
          if (error) throw error;

          setFactorIdToVerify(data.id);
          setQrCodeUrl(data.totp.qr_code);
          setIsSettingUpMfa(true);

      } catch (error) {
          toast({
              variant: "destructive",
              title: "Erro ao iniciar MFA",
              description: error.message
          });
      }
  };

  const verifyAndEnableMfa = async () => {
      if (!verificationCode) return;

      try {
          const { data, error } = await supabase.auth.mfa.challengeAndVerify({
              factorId: factorIdToVerify,
              code: verificationCode
          });

          if (error) throw error;

          setIsSettingUpMfa(false);
          setVerificationCode('');
          setQrCodeUrl('');
          fetchMfaFactors(); // Refresh list
          
          toast({
            title: "2FA Ativado",
            description: "Autenticação de dois fatores configurada com sucesso.",
            className: "bg-green-500 border-green-600 text-white"
          });

      } catch (error) {
           toast({
              variant: "destructive",
              title: "Código inválido",
              description: error.message
          });
      }
  };

  const disableMfa = async (factorId) => {
      try {
          const { error } = await supabase.auth.mfa.unenroll({ factorId });
          if (error) throw error;

          fetchMfaFactors();
          toast({
            title: "2FA Desativado",
            description: "O fator de autenticação foi removido.",
            className: "bg-yellow-500 border-yellow-600 text-white"
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Erro ao desativar",
              description: error.message
          });
      }
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-slate-700">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-blue-600 text-xs">
                          {profile.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  {t('profile')}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
              </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="general" className="w-full">
                  <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full justify-start mb-6">
                      <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('general')}</TabsTrigger>
                      <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('security')}</TabsTrigger>
                      <TabsTrigger value="preferences" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('preferences')}</TabsTrigger>
                  </TabsList>

                  {/* General Tab */}
                  <TabsContent value="general" className="space-y-6">
                       <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                            <div className="relative group cursor-pointer">
                                <Avatar className="h-24 w-24 border-2 border-slate-700 group-hover:border-blue-500 transition-colors">
                                    <AvatarImage src={profile.avatar_url} />
                                    <AvatarFallback className="text-2xl bg-slate-800 text-slate-400">
                                        {profile.name?.charAt(0) || user.email.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="w-8 h-8 text-white" />
                                </label>
                                <input 
                                    id="avatar-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <p className="mt-4 text-sm text-slate-400">{t('changePhoto')}</p>
                       </div>

                       <div className="space-y-4">
                           <div className="grid gap-2">
                               <Label htmlFor="name" className="text-slate-300">{t('fullName')}</Label>
                               <Input 
                                   id="name" 
                                   value={profile.name || ''} 
                                   onChange={(e) => setProfile({...profile, name: e.target.value})}
                                   className="bg-slate-800 border-slate-700 text-white"
                               />
                           </div>
                           <div className="grid gap-2">
                               <Label htmlFor="email" className="text-slate-300">Email</Label>
                               <Input 
                                   id="email" 
                                   value={user.email} 
                                   disabled 
                                   className="bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
                               />
                           </div>
                       </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6">
                      <div className="p-4 rounded-xl border border-blue-900/30 bg-blue-900/10 mb-6">
                          <h3 className="text-lg font-semibold text-blue-100 mb-2 flex items-center gap-2">
                              <Shield className="w-5 h-5 text-blue-400" />
                              {t('security')}
                          </h3>
                      </div>

                      {mfaFactors.length > 0 ? (
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-green-500/20 rounded-full">
                                          <Shield className="w-5 h-5 text-green-400" />
                                      </div>
                                      <div>
                                          <p className="font-medium text-green-100">2FA Ativado</p>
                                          <p className="text-xs text-green-200/60">Sua conta está protegida.</p>
                                      </div>
                                  </div>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => disableMfa(mfaFactors[0].id)}
                                  >
                                      {t('disable2fa')}
                                  </Button>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {!isSettingUpMfa ? (
                                  <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-700/50 rounded-full">
                                              <ShieldAlert className="w-5 h-5 text-slate-400" />
                                          </div>
                                          <div>
                                              <p className="font-medium text-slate-200">2FA Desativado</p>
                                              <p className="text-xs text-slate-400">Recomendamos ativar para maior segurança.</p>
                                          </div>
                                      </div>
                                      <Button onClick={startMfaSetup} className="bg-blue-600 hover:bg-blue-500">
                                          {t('enable2fa')}
                                      </Button>
                                  </div>
                              ) : (
                                  <div className="border border-slate-700 rounded-lg p-6 space-y-6 bg-slate-800/30">
                                      <div className="text-center space-y-4">
                                          <h4 className="font-semibold text-white">{t('scanQr')}</h4>
                                          <p className="text-sm text-slate-400">
                                              Google Authenticator, Authy, etc.
                                          </p>
                                          
                                          {qrCodeUrl && (
                                              <div className="bg-white p-2 rounded-lg inline-block mx-auto">
                                                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                                              </div>
                                          )}
                                      </div>

                                      <div className="max-w-xs mx-auto space-y-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="code">{t('verifyCode')}</Label>
                                              <Input 
                                                  id="code" 
                                                  placeholder="000 000" 
                                                  className="text-center text-lg tracking-widest bg-slate-900 border-slate-700"
                                                  value={verificationCode}
                                                  onChange={(e) => setVerificationCode(e.target.value)}
                                              />
                                          </div>
                                          <div className="flex gap-2">
                                              <Button 
                                                  variant="outline" 
                                                  className="w-full border-slate-700 text-slate-300"
                                                  onClick={() => setIsSettingUpMfa(false)}
                                              >
                                                  {t('cancel')}
                                              </Button>
                                              <Button 
                                                  className="w-full bg-blue-600 hover:bg-blue-500"
                                                  onClick={verifyAndEnableMfa}
                                                  disabled={verificationCode.length < 6}
                                              >
                                                  {t('verifyCode')}
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </TabsContent>

                  {/* Preferences Tab */}
                  <TabsContent value="preferences" className="space-y-6">
                       <div className="space-y-4">
                           <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                               <div className="space-y-0.5">
                                   <Label className="text-base text-white">{t('confirmDeletes')}</Label>
                                   <p className="text-xs text-slate-400">
                                       {t('confirmDeletesDesc')}
                                   </p>
                               </div>
                               <div className="flex items-center gap-2">
                                   <input 
                                     type="checkbox"
                                     checked={profile.preferences?.confirm_delete !== false} // Default true
                                     onChange={(e) => setProfile({
                                         ...profile, 
                                         preferences: { ...profile.preferences, confirm_delete: e.target.checked }
                                     })}
                                     className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                                   />
                               </div>
                           </div>
                           
                           <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                               <div className="space-y-0.5">
                                   <Label className="text-base text-white flex items-center gap-2">
                                       <Languages className="w-4 h-4 text-slate-400" />
                                       {t('language')}
                                   </Label>
                               </div>
                               <div>
                                   <LanguageSelector />
                               </div>
                           </div>
                       </div>
                  </TabsContent>
              </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                  {t('cancel')}
              </Button>
              <Button onClick={handleUpdateProfile} disabled={loading} className="bg-blue-600 hover:bg-blue-500 min-w-[120px]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {t('save')}
              </Button>
          </div>

      </div>
    </div>
  );
};

export default UserProfile;
