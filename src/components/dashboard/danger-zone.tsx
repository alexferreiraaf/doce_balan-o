'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { writeBatch, collection, getDocs, doc } from 'firebase/firestore';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useAuth, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Transaction } from '@/app/lib/types';

interface DangerZoneProps {
  transactions: Transaction[];
}

export function DangerZone({ transactions }: DangerZoneProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const showDangerZone = searchParams.get('showDangerZone') === 'true';

  const handleDeleteAllTransactions = async () => {
    if (!user || !firestore || transactions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Operação não permitida',
        description: 'Não há usuário autenticado ou não há lançamentos para excluir.',
      });
      return;
    }

    setIsDeleting(true);

    const collectionPath = `artifacts/${APP_ID}/users/${user.uid}/transactions`;
    const transactionsCollection = collection(firestore, collectionPath);

    try {
      // Use um batch para deletar em massa
      const batch = writeBatch(firestore);
      transactions.forEach((transaction) => {
        const docRef = doc(firestore, collectionPath, transaction.id);
        batch.delete(docRef);
      });

      await batch.commit();

      toast({
        title: 'Sucesso!',
        description: 'Todos os seus lançamentos foram excluídos.',
      });
    } catch (error) {
      console.error('Error deleting all transactions: ', error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: collectionPath,
          operation: 'delete',
        })
      );
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir lançamentos',
        description: 'Não foi possível apagar os dados. Verifique suas permissões ou tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!showDangerZone) {
    return null;
  }

  return (
    <Card className="border-destructive/50 mt-10">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          As ações abaixo são permanentes e não podem ser desfeitas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Zerar Todos os Lançamentos'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os seus dados de lançamentos
                (entradas, saídas e vendas a prazo) serão permanentemente
                excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteAllTransactions}
              >
                Sim, excluir tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-sm text-muted-foreground mt-2">
          Esta ação irá apagar todos os registros de transações da sua conta.
        </p>
      </CardContent>
    </Card>
  );
}
