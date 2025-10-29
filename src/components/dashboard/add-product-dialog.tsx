'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Tag } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { AddProductCategoryDialog } from '../products/add-product-category-dialog';

const formSchema = z.object({
  name: z.string().min(2, 'O nome do produto deve ter pelo menos 2 caracteres.'),
  price: z.coerce.number().positive('O preço deve ser maior que zero.'),
  categoryId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

export function AddProductDialog() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useProductCategories();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      categoryId: '',
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const collectionPath = `artifacts/${APP_ID}/products`;
      const productData = {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId || '',
      };

      const productCollection = collection(firestore, collectionPath);

      addDoc(productCollection, productData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Produto adicionado.' });
          form.reset();
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error adding product: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: collectionPath,
              operation: 'create',
              requestResourceData: productData,
            })
          );
          toast({
            variant: 'destructive',
            title: 'Erro ao Adicionar Produto',
            description: 'Não foi possível salvar o produto. Verifique suas permissões ou tente novamente.',
          });
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Cadastre um novo produto para usar nos lançamentos de entrada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bolo de Chocolate" {...field} />
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
                    <Input type="number" step="0.01" placeholder="25,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                   <div className="flex justify-between items-center">
                     <FormLabel>Categoria (Opcional)</FormLabel>
                     <AddProductCategoryDialog />
                   </div>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={categoriesLoading}>
                        <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Salvar Produto
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
