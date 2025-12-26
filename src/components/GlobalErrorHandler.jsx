import React, { createContext, useContext, useState, useEffect, Component } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Copy, RefreshCw, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// 1. Contexto para disparar erros manualmente de qualquer lugar
const ErrorContext = createContext();

export const useErrorLog = () => useContext(ErrorContext);

// 2. Componente Visual do Popup (Modal)
const ErrorDialog = ({ error, onClose }) => {
  const { toast } = useToast();

  if (!error) return null;

  const copyError = () => {
    const text = `Error: ${error.message}\nStack: ${error.stack || 'N/A'}\nLocation: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Log de erro copiado para a área de transferência." });
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Dialog open={!!error} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-950 border-red-900 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-red-950/30 -mx-6 -mt-6 p-6 border-b border-red-900/50">
          <DialogTitle className="flex items-center gap-2 text-red-400 text-xl">
            <AlertTriangle className="h-6 w-6" />
            Algo deu errado
          </DialogTitle>
          <DialogDescription className="text-red-200/70">
            O sistema encontrou um erro inesperado. Copie os detalhes abaixo e envie para o suporte.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Mensagem</label>
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-md text-red-200 font-mono text-sm break-words">
                    {error.message || "Erro desconhecido"}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Detalhes Técnicos (Stack Trace)</label>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-md text-slate-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {error.stack || "Sem stack trace disponível."}
                    {error.componentStack && (
                        <>
                            <br/><br/>--- Component Stack ---<br/>
                            {error.componentStack}
                        </>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between border-t border-white/10 pt-4 mt-2">
            <Button variant="outline" onClick={reloadPage} className="border-slate-700 hover:bg-slate-800 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Recarregar Página
            </Button>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={copyError} className="bg-slate-800 hover:bg-slate-700 text-white">
                    <Copy className="w-4 h-4 mr-2" /> Copiar Log
                </Button>
                <Button variant="destructive" onClick={onClose} className="bg-red-600 hover:bg-red-700">
                    <XCircle className="w-4 h-4 mr-2" /> Fechar
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 3. Error Boundary (Para pegar erros de renderização do React)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Passa o erro para o handler global
    this.props.onError(error, errorInfo);
  }

  render() {
    // Renderiza os filhos normalmente, o Popup Global cuidará da UI
    return this.props.children;
  }
}

// 4. Provider Principal (Engloba a aplicação)
export const GlobalErrorProvider = ({ children }) => {
  const [currentError, setCurrentError] = useState(null);

  // Função para chamar o erro manualmente (try/catch)
  const logError = (error, info = null) => {
    console.error("Global Error Caught:", error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    if (info?.componentStack) errorObj.componentStack = info.componentStack;
    setCurrentError(errorObj);
  };

  // Listeners globais para erros que não são do React (Promises, window)
  useEffect(() => {
    const handleGlobalError = (event) => {
      event.preventDefault(); // Evita log duplo no console as vezes
      logError(event.error || new Error(event.message));
    };

    const handlePromiseRejection = (event) => {
      event.preventDefault(); // Evita "Uncaught (in promise)" no console
      logError(event.reason instanceof Error ? event.reason : new Error(`Promise Rejection: ${event.reason}`));
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  return (
    <ErrorContext.Provider value={{ logError }}>
      <ErrorBoundary onError={logError}>
        {children}
      </ErrorBoundary>
      
      {/* O Popup vive fora da árvore principal para não ser desmontado em caso de erro */}
      <ErrorDialog error={currentError} onClose={() => setCurrentError(null)} />
    </ErrorContext.Provider>
  );
};