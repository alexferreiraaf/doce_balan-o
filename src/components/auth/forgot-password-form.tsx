'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/firebase';

const formSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    startTransition(async () => {
      try {
        await sendPasswordResetEmail(auth, data.email);
        setIsSubmitted(true);
        toast({
          title: 'E-mail enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
      } catch (error) {
        let description = 'Ocorreu um erro ao enviar o e-mail de redefinição.';
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/user-not-found':
              description = 'Não encontramos uma conta com este e-mail.';
              break;
            default:
              description = `Erro: ${error.message}`;
          }
        }
        toast({
          variant: 'destructive',
          title: 'Erro!',
          description,
        });
        console.error('Password reset error:', error);
      }
    });
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-semibold text-primary">Verifique seu e-mail</h2>
            <p className="text-muted-foreground text-sm">
              Enviamos um link de redefinição de senha para <strong>{form.getValues('email')}</strong>.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Voltar para o Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Link de Redefinição
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
