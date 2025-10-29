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
  cep: z.string().optional(),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
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
      name: customer.name,
      cep: customer.cep || '',
      address: customer.address || '',
      whatsapp: customer.whatsapp || '',
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
            form.setValue('address', '');
        } else {
            const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
            form.setValue('address', fullAddress);
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
        cep: data.cep || '',
        address: data.address || '',
        whatsapp: data.whatsapp || '',
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                  <FormLabel>CEP (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o CEP para buscar" {...field} onBlur={handleCepBlur} />
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
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Preenchido pelo CEP ou manualmente" {...field} disabled={isFetchingCep} />
                  </FormControl>
                  {isFetchingCep && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Buscando endereço...</div>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
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
