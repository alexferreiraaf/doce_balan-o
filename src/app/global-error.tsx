'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WhiskIcon } from '@/components/icons/whisk-icon';

/**
 * Componente de tratamento de erros críticos globais.
 * Blinda a aplicação contra falhas no processo de recuperação.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento em desenvolvimento
    console.error('Erro Crítico Detectado pelo Sistema:', error);
  }, [error]);

  /**
   * Tenta recuperar o estado da aplicação de forma segura.
   * Evita o erro 'reset is not a function' recorrente no Next.js.
   */
  const handleReset = () => {
    try {
      // Verificação de segurança: nem sempre o Next.js injeta a função 'reset'
      if (typeof reset === 'function') {
        reset();
      } else {
        // Fallback: Recarregamento total da página
        window.location.reload();
      }
    } catch (e) {
      // Fallback final: Redireciona para o início do PDV
      window.location.href = '/pdv';
    }
  };

  return (
    <html>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-sm text-center bg-card p-8 rounded-xl shadow-xl border border-border">
            <WhiskIcon className="w-24 h-24 text-primary mx-auto mb-4 animate-bounce" />
            <h1 className="text-2xl font-bold text-primary mb-2">Ops! Algo deu errado.</h1>
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado ao processar sua solicitação. Por favor, tente recarregar a página.
            </p>
            <div className="space-y-3">
              <Button onClick={handleReset} className="w-full h-12 text-lg font-bold">
                Recarregar a página
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/pdv'} className="w-full">
                Ir para o PDV
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-muted text-[10px] text-left overflow-auto rounded max-h-40">
                <p className="font-bold mb-1">Log de Erro para Debug:</p>
                <pre className="whitespace-pre-wrap">{error?.message || 'Erro desconhecido'}</pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}