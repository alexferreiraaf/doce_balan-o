'use client';
import { useState } from 'react';
import { Edit } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '../ui/button';
import type { Transaction } from '@/app/lib/types';
import { EditTransactionForm } from './edit-transaction-form';

interface EditTransactionSheetProps {
  transaction: Transaction;
}

export function EditTransactionSheet({ transaction }: EditTransactionSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">Editar Transação</SheetTitle>
          <SheetDescription>
            Ajuste os detalhes do seu lançamento abaixo.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <EditTransactionForm transaction={transaction} setSheetOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
