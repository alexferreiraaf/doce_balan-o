'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Edit } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { APP_ID } from '@/app/lib/constants';
import { useUser, useFirestore } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import type { Customer } from '@/app/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'O nome do cliente deve ter pelo menos 2 caracteres.'),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof formSchema>;

interface EditCustomerDialogProps {
    customer: Customer;
}

export function EditCustomerDialog({ customer }: EditCustomerDialogProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer.name || '',
      whatsapp: customer.whatsapp || '',
      cep: customer.cep || '',
      street: customer.street || '',
      number: customer.number || '',
      complement: customer.complement || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
    },
  });

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        return;
    }

    setIsFetchingCep(true);
    try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (data.erro) {
            toast({ variant: 'destructive', title: 'CEP não encontrado' });
            form.setValue('street', '');
            form.setValue('neighborhood', '');
            form.setValue('city', '');
            form.setValue('state', '');
        } else {
            form.setValue('street', data.logradouro);
            form.setValue('neighborhood', data.bairro);
            form.setValue('city', data.localidade);
            form.setValue('state', data.uf);
            form.setFocus('number');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: 'Não foi possível buscar o endereço. Tente novamente.' });
        console.error("CEP search error:", error);
    } finally {
        setIsFetchingCep(false);
    }
  };


  const onSubmit = (data: CustomerFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const docPath = `artifacts/${APP_ID}/customers/${customer.id}`;
      const customerRef = doc(firestore, docPath);

      const customerData = {
        name: data.name,
        whatsapp: data.whatsapp || '',
        cep: data.cep || '',
        street: data.street || '',
        number: data.number || '',
        complement: data.complement || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
      };

      updateDoc(customerRef, customerData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Cliente atualizado.' });
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error updating customer: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docPath,
              operation: 'update',
              requestResourceData: customerData,
            })
          );
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome do Cliente</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
                <FormItem>
                <FormLabel>WhatsApp (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: (11) 99999-8888" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                    <Input placeholder="Digite o CEP para buscar" {...field} onBlur={handleCepBlur} />
                </FormControl>
                {isFetchingCep && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Buscando endereço...</div>}
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Rua</FormLabel>
                <FormControl>
                    <Input placeholder="Rua, Avenida, etc." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: 123" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                        <Input placeholder="Apto, Bloco" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                    <Input placeholder="Bairro" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                        <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                        <Input placeholder="SP" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
                </Button>
                <Button type="submit" disabled={isPending || isAuthLoading || isFetchingCep}>
                {(isPending || isAuthLoading || isFetchingCep) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
                </Button>
            </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
