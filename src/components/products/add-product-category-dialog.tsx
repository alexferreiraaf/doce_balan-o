'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';

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
  name: z.string().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.'),
});

type CategoryFormValues = z.infer<typeof formSchema>;

export function AddProductCategoryDialog() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const collectionPath = `artifacts/${APP_ID}/product-categories`;
      const categoryData = {
        name: data.name,
      };

      const categoryCollection = collection(firestore, collectionPath);

      addDoc(categoryCollection, categoryData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Categoria adicionada.' });
          form.reset();
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error adding category: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: collectionPath,
              operation: 'create',
              requestResourceData: categoryData,
            })
          );
          toast({
            variant: 'destructive',
            title: 'Erro ao Adicionar Categoria',
            description: 'Não foi possível salvar a categoria. Verifique suas permissões ou tente novamente.',
          });
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="p-0 h-auto">
          <Plus className="mr-1 h-3 w-3" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
          <DialogDescription>
            Crie uma nova categoria para organizar seus produtos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bolos de Festa" {...field} />
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
                Salvar
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
