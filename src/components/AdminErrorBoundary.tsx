import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AdminErrorBoundary] Uncaught administrative render failure:", error, errorInfo);
  }

  private handleResetAndRetry = async () => {
    try {
      const email = localStorage.getItem('modivah_admin_email') || '';
      
      // Clear administrative storage credentials securely without touching public catalog/store caches
      sessionStorage.removeItem('modivah_admin_auth');
      sessionStorage.removeItem('modivah_admin_token');
      sessionStorage.removeItem('modivah_admin_email');
      localStorage.removeItem('modivah_admin_auth');
      localStorage.removeItem('modivah_admin_token');
      localStorage.removeItem('modivah_admin_email');
      
      sessionStorage.removeItem('admin_cache_list_admins');
      localStorage.removeItem('admin_cache_list_admins');

      // Dispatch backend lockout recovery request
      try {
        await fetch("/api/auth/reset-lockout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });
      } catch (backendErr) {
        console.warn("Lockout backend auto-reset omitted or failed in error recovery step:", backendErr);
      }

      // Hard redirect to clear any broken state
      window.location.href = '/admin';
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-zinc-300 font-sans select-none" id="admin-error-boundary-screen">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-rose-500/10 rounded-full text-rose-400 mb-2 border border-rose-500/20">
              <span className="text-2xl font-mono">⚠️</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Ocorreu um imprevisto na renderização</h2>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Houve uma inconsistência ao iniciar os módulos visuais do painel. <strong className="text-emerald-500 font-medium">Fique tranquilo, o seu acervo virtual, anúncios e fotos estão completamente preservados</strong> e ativos na loja oficial!
              </p>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg text-left overflow-x-auto text-[10px] font-mono text-zinc-500 max-h-32 border border-neutral-900/50">
              {this.state.error?.toString() || "Erro técnico indefinido de runtime."}
            </div>

            <button
              onClick={this.handleResetAndRetry}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-lg transition duration-200 cursor-pointer shadow-lg active:scale-95"
            >
              ⚠️ Limpar sessão admin e tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
