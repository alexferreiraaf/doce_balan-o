'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Link as LinkIcon, Upload, X } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
import { useUser, useFirestore, useStorage } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { AddProductCategoryDialog } from '../products/add-product-category-dialog';
import { Progress } from '../ui/progress';

const formSchema = z.object({
  name: z.string().min(2, 'O nome do produto deve ter pelo menos 2 caracteres.'),
  price: z.coerce.number().positive('O preço deve ser maior que zero.'),
  categoryId: z.string().optional(),
  imageUrl: z.string().url('Por favor, insira uma URL válida.').optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof formSchema>;

export function AddProductDialog() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useProductCategories();

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      categoryId: '',
      imageUrl: '',
    },
  });

  const resetFormState = () => {
    form.reset();
    setImagePreview(null);
    setUploadProgress(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user || !storage) {
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para fazer upload." });
        return;
    }

    setImagePreview(URL.createObjectURL(file));
    form.setValue('imageUrl', '');

    const storageRef = ref(storage, `product-images/${user.uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        toast({ variant: "destructive", title: "Falha no Upload", description: "Não foi possível enviar a imagem. Tente novamente." });
        setUploadProgress(null);
        setImagePreview(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          form.setValue('imageUrl', downloadURL);
          setUploadProgress(100);
        });
      }
    );
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    form.setValue('imageUrl', url);
    setImagePreview(url || null);
  };
  
  const clearImage = () => {
    setImagePreview(null);
    form.setValue('imageUrl', '');
    setUploadProgress(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }


  const onSubmit = (data: ProductFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }
    if (uploadProgress !== null && uploadProgress < 100) {
      toast({ variant: 'destructive', title: 'Aguarde', description: 'O upload da imagem ainda está em andamento.' });
      return;
    }

    startTransition(() => {
      const collectionPath = `artifacts/${APP_ID}/products`;
      const productData = {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId || '',
        imageUrl: data.imageUrl || '',
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
                    <Input type="number" step="0.01" placeholder="25,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel>Imagem do Produto</FormLabel>
                <div className="flex items-center gap-2">
                    <FormControl>
                        <Input 
                            placeholder="https://exemplo.com/imagem.jpg" 
                            onChange={handleUrlChange}
                            value={form.watch('imageUrl')}
                            className="flex-grow"
                            disabled={uploadProgress !== null}
                        />
                    </FormControl>
                    <Button type="button" variant="outline" asChild className="relative overflow-hidden cursor-pointer" disabled={!!form.watch('imageUrl')}>
                        <div>
                            <Upload className="mr-2 h-4 w-4" />
                            <span>Upload</span>
                            <Input id="file-upload" type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                        </div>
                    </Button>
                </div>
                 {uploadProgress !== null && (
                    <div className="mt-2">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-muted-foreground mt-1">{uploadProgress < 100 ? `Enviando... ${uploadProgress.toFixed(0)}%` : 'Upload concluído!'}</p>
                    </div>
                 )}
                 {imagePreview && (
                    <div className="mt-4 relative w-32 h-32">
                        <Image src={imagePreview} alt="Pré-visualização" layout="fill" objectFit="cover" className="rounded-md" />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImage}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                 )}
                <FormMessage />
            </FormItem>
            
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
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetFormState(); }}>
                Cancelar
                </Button>
                <Button type="submit" disabled={isPending || isAuthLoading || (uploadProgress !== null && uploadProgress < 100)}>
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
