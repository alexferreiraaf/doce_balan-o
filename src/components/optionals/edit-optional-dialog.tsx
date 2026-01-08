'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Edit } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

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
import type { Optional } from '@/app/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'O nome do opcional deve ter pelo menos 2 caracteres.'),
  price: z.coerce.number().min(0, 'O preço deve ser zero ou maior.'),
});

type OptionalFormValues = z.infer<typeof formSchema>;

interface EditOptionalDialogProps {
    optional: Optional;
}

export function EditOptionalDialog({ optional }: EditOptionalDialogProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<OptionalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: optional.name,
      price: optional.price,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: optional.name,
        price: optional.price,
      });
    }
  }, [open, optional, form]);


  const onSubmit = (data: OptionalFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const docPath = `artifacts/${APP_ID}/optionals/${optional.id}`;
      const optionalRef = doc(firestore, docPath);

      const optionalData = {
        name: data.name,
        price: data.price,
      };

      updateDoc(optionalRef, optionalData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Opcional atualizado.' });
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error updating optional: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docPath,
              operation: 'update',
              requestResourceData: optionalData,
            })
          );
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Opcional</DialogTitle>
          <DialogDescription>
            Atualize as informações do opcional abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Opcional</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mais Nutella" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="5,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
                </Button>
                <Button type="submit" disabled={isPending || isAuthLoading}>
                {(isPending || isAuthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
                </Button>
            </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
