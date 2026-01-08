'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useSettings } from '@/app/lib/hooks/use-settings';
import Loading from '@/app/(admin)/loading-component';
import { Textarea } from '../ui/textarea';

const settingsFormSchema = z.object({
  pixKey: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsClient() {
  const { settings, loading, updateSettings, isUpdating } = useSettings();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: {
      pixKey: settings?.pixKey || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    await updateSettings(data);
    toast({
      title: 'Configurações salvas!',
      description: 'Suas alterações foram salvas com sucesso.',
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
        <Settings className="w-8 h-8" />
        Configurações da Loja
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Loja</CardTitle>
          <CardDescription>
            Gerencie as informações públicas e de pagamento da sua loja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="pixKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite sua chave PIX (celular, e-mail, CPF/CNPJ ou aleatória)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(XX) 9XXXX-XXXX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da Loja</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Seu endereço completo para retirada de produtos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
