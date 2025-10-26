import { SignupForm } from '@/components/auth/signup-form';
import { WhiskIcon } from '@/components/icons/whisk-icon';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
       <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <WhiskIcon className="w-24 h-24 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary">Crie sua Conta</h1>
            <p className="text-muted-foreground">Comece a adocicar suas finanças em segundos.</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
