'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface DeleteTransactionButtonProps {
  transactionId: string;
  transactionUserId: string; // The owner of the transaction
}

export function DeleteTransactionButton({ transactionId, transactionUserId }: DeleteTransactionButtonProps) {
  const { user, isUserLoading: isAuthLoading } = useUser(); // The currently logged-in user (admin)
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
    // Use the passed transactionUserId to build the correct path
    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${transactionUserId}/transactions/${transactionId}`);

    try {
      await deleteDoc(transactionRef);
      toast({ title: 'Sucesso!', description: 'Lançamento excluído.' });
      setIsAlertOpen(false);
    } catch (error) {
      console.error('Error deleting transaction: ', error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: transactionRef.path,
          operation: 'delete',
        })
      );
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o lançamento.',
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento dos nossos servidores.
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isAuthLoading}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
            onSelect={() => setIsAlertOpen(true)}
            disabled={isAuthLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}