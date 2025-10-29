'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface DeleteProductButtonProps {
  productId: string;
}

export function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isAuthLoading || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }
    
    setIsDeleting(true);
    const productRef = doc(firestore, `artifacts/${APP_ID}/products/${productId}`);

    try {
      await deleteDoc(productRef);
      toast({ title: 'Sucesso!', description: 'Produto excluído.' });
      setIsAlertOpen(false);
    } catch (error) {
      console.error('Error deleting product: ', error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: productRef.path,
          operation: 'delete',
        })
      );
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o produto.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || isAuthLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Button variant="ghost" size="icon" onClick={() => setIsAlertOpen(true)} disabled={isAuthLoading}>
          <Trash2 className="w-4 h-4 text-destructive" />
       </Button>
    </>
  );
}
