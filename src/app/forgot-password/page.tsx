import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { WhiskIcon } from '@/components/icons/whisk-icon';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <WhiskIcon className="w-40 h-40 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary">Esqueceu sua senha?</h1>
            <p className="text-muted-foreground">Não se preocupe! Insira seu e-mail abaixo para receber um link de redefinição.</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
