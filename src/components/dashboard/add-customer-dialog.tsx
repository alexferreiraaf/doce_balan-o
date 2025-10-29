'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
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

const formSchema = z.object({
  name: z.string().min(2, 'O nome do cliente deve ter pelo menos 2 caracteres.'),
  cep: z.string().optional(),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof formSchema>;

export function AddCustomerDialog() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cep: '',
      address: '',
      whatsapp: '',
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
      const collectionPath = `artifacts/${APP_ID}/customers`;
      const customerData = {
        name: data.name,
        cep: data.cep || '',
        address: data.address || '',
        whatsapp: data.whatsapp || '',
      };

      const customerCollection = collection(firestore, collectionPath);

      addDoc(customerCollection, customerData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Cliente adicionado.' });
          form.reset();
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error adding customer: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: collectionPath,
              operation: 'create',
              requestResourceData: customerData,
            })
          );
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente para usar nos lançamentos de entrada.
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
                Salvar Cliente
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
