'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Edit, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
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
import type { Product } from '@/app/lib/types';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { AddProductCategoryDialog } from './add-product-category-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, 'O nome do produto deve ter pelo menos 2 caracteres.'),
  price: z.coerce.number().positive('O preço deve ser maior que zero.'),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  imageFile: z.any()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE_BYTES, `O tamanho máximo da imagem é ${MAX_FILE_SIZE_MB}MB.`)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), 'Formato de arquivo não suportado (aceito: JPG, PNG, WEBP).')
    .optional(),
});


type ProductFormValues = z.infer<typeof formSchema>;

interface EditProductDialogProps {
    product: Product;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function EditProductDialog({ product }: EditProductDialogProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useProductCategories();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      price: product.price,
      categoryId: product.categoryId || '',
      imageUrl: product.imageUrl || '',
    },
  });

  const resetFormState = () => {
    form.reset({
        name: product.name,
        price: product.price,
        categoryId: product.categoryId || '',
        imageUrl: product.imageUrl || '',
    });
    setImagePreview(product.imageUrl || null);
    const fileInput = document.getElementById(`file-upload-${product.id}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  useEffect(() => {
    if (open) {
      resetFormState();
    }
  }, [open, product]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.setValue('imageFile', file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(product.imageUrl || null);
    }
  };
  
  const clearImage = () => {
    setImagePreview(null);
    form.setValue('imageFile', null);
    form.setValue('imageUrl', '');
    const fileInput = document.getElementById(`file-upload-${product.id}`) as HTMLInputElement;
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
          imageUrl = await fileToBase64(data.imageFile);
        }
      } catch (uploadError: any) {
        console.error('File conversion failed:', uploadError);
        toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível processar a imagem.'});
        return;
      }
      
      const docPath = `artifacts/${APP_ID}/products/${product.id}`;
      const productRef = doc(firestore, docPath);

      const productData = {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId || '',
        imageUrl: imageUrl || '',
      };

      updateDoc(productRef, productData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Produto atualizado.' });
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error updating product: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docPath,
              operation: 'update',
              requestResourceData: productData,
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
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize as informações do produto abaixo.
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
              name="imageFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <FormControl>
                    <Input 
                      id={`file-upload-${product.id}`}
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
