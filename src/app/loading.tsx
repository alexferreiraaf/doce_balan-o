import { WhiskIcon } from '@/components/icons/whisk-icon';
import { FirebaseClientProvider } from '@/firebase';

export default function Loading() {
  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="text-center text-primary">
          <WhiskIcon className="w-16 h-16 mx-auto" />
          <p className="mt-4 text-lg font-semibold tracking-tight">
            Carregando dados da Confeitaria...
          </p>
          <p className="text-sm text-muted-foreground">Aguarde a conexão segura.</p>
        </div>
      </div>
    </FirebaseClientProvider>
  );
}
