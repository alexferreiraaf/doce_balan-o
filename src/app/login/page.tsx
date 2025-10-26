import { LoginForm } from '@/components/auth/login-form';
import { WhiskIcon } from '@/components/icons/whisk-icon';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <WhiskIcon className="w-40 h-40 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary">Bem-vindo(a) de volta!</h1>
            <p className="text-muted-foreground">Acesse sua conta para gerenciar suas finanças.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
