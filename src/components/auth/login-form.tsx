'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

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
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: 'Login bem-sucedido!',
          description: 'Bem-vindo(a) de volta!',
        });
        router.push('/'); // Redirect to the main dashboard
        router.refresh();
      } catch (error) {
        let description = 'Ocorreu um erro desconhecido. Tente novamente.';
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              description = 'Credenciais inválidas. Verifique seu e-mail e senha.';
              break;
            default:
              description = `Erro: ${error.message}`;
          }
        }
        toast({
          variant: 'destructive',
          title: 'Erro no Login',
          description,
        });
        console.error('Login error:', error);
      }
    });
  };

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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
         <p className="mt-4 text-center text-sm text-muted-foreground">
          Ou <Link href="/" className="font-semibold text-primary hover:underline">
            continue como anônimo
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
