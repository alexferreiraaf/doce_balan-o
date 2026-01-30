'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, X } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import Image from 'next/image';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input, CurrencyInput } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { APP_ID } from '@/app/lib/constants';
import { useUser, useFirestore } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { AddProductCategoryDialog } from '../products/add-product-category-dialog';
import { Switch } from '../ui/switch';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';


const formSchema = z.object({
  name: z.string().min(2, 'O nome do produto deve ter pelo menos 2 caracteres.'),
  price: z.coerce.number().positive('O preço deve ser maior que zero.'),
  promotionalPrice: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isPromotion: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  imageFile: z.any().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


export function AddProductDialog() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useProductCategories();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      categoryId: '',
      imageUrl: '',
      isFeatured: false,
      isPromotion: false,
      promotionalPrice: 0,
      isAvailable: true,
    },
  });

  const isPromotion = form.watch("isPromotion");

  const resetFormState = () => {
    form.reset();
    setImagePreview(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.setValue('imageFile', file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };
  
  const clearImage = () => {
    setImagePreview(null);
    form.setValue('imageFile', null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }


  const onSubmit = async (data: ProductFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(async () => {
      let imageUrl: string | undefined = data.imageUrl;

      try {
        if (data.imageFile) {
          const file = data.imageFile as File;
          const base64 = await fileToBase64(file);
          const imageStorageRef = storageRef(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
          await uploadString(imageStorageRef, base64, 'data_url');
          imageUrl = await getDownloadURL(imageStorageRef);
        }
      } catch (uploadError: any) {
        console.error('File upload failed:', uploadError);
        toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar a imagem.'});
        return;
      }

      const collectionPath = `artifacts/${APP_ID}/products`;
      const productData = {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId || '',
        imageUrl: imageUrl || '',
        isFeatured: data.isFeatured,
        isPromotion: data.isPromotion,
        promotionalPrice: data.isPromotion ? data.promotionalPrice : null,
        salesCount: 0,
        isAvailable: data.isAvailable,
      };

      const productCollection = collection(firestore, collectionPath);

      addDoc(productCollection, productData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Produto adicionado.' });
          setOpen(false);
          resetFormState();
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
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(!isOpen) resetFormState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
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
                    <CurrencyInput placeholder="R$ 25,00" {...field} onValueChange={(value) => field.onChange(value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <FormControl>
                    <Input 
                      id="file-upload"
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleFileChange}
                      {...rest} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {imagePreview && (
              <div className="mt-4 relative w-32 h-32">
                  <Image src={imagePreview} alt="Pré-visualização" layout="fill" objectFit="cover" className="rounded-md" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImage}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
            )}
            
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
             <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Disponível para venda</FormLabel>
                    <FormDescription>
                      Se desativado, o produto aparecerá como "Em falta" na loja.
                    </FormDescription>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Destacar produto na loja</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPromotion"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Marcar como promoção</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isPromotion && (
                <FormField
                    control={form.control}
                    name="promotionalPrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preço Promocional (R$)</FormLabel>
                        <FormControl>
                        <CurrencyInput placeholder="R$ 19,90" {...field} onValueChange={(value) => field.onChange(value)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetFormState(); }}>
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
