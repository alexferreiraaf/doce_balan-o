'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WhiskIcon } from '@/components/icons/whisk-icon';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-sm text-center">
            <WhiskIcon className="w-24 h-24 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-destructive">Ops! Algo deu errado.</h1>
            <p className="text-muted-foreground mt-2 mb-6">
              Ocorreu um erro inesperado. Nossa equipe já foi notificada. Por favor, tente recarregar a página.
            </p>
            <Button onClick={() => reset()}>
              Recarregar a página
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
