'use client';

import { useState, useTransition } from 'react';
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
import type { DeliveryZone } from '@/app/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'O nome da zona deve ter pelo menos 2 caracteres.'),
  fee: z.coerce.number().min(0, 'A taxa deve ser um valor positivo.'),
});

type DeliveryZoneFormValues = z.infer<typeof formSchema>;

interface EditDeliveryZoneDialogProps {
    zone: DeliveryZone;
}

export function EditDeliveryZoneDialog({ zone }: EditDeliveryZoneDialogProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<DeliveryZoneFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: zone.name,
      fee: zone.fee,
    },
  });

  const onSubmit = (data: DeliveryZoneFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const docPath = `artifacts/${APP_ID}/delivery-zones/${zone.id}`;
      const zoneRef = doc(firestore, docPath);
      const zoneData = {
        name: data.name,
        fee: data.fee,
      };
      
      updateDoc(zoneRef, zoneData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Zona de entrega atualizada.' });
          setOpen(false);
        })
        .catch((error) => {
          console.error('Error updating delivery zone: ', error);
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docPath,
              operation: 'update',
              requestResourceData: zoneData,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Zona de Entrega</DialogTitle>
          <DialogDescription>
            Atualize o bairro e a taxa de entrega.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Entrega (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="5,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
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
