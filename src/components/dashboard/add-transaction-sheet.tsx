'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TransactionForm } from './transaction-form';

export function AddTransactionSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold shadow-lg transition duration-300 transform hover:scale-105">
          <Plus className="w-5 h-5 mr-1" />
          Novo Lançamento
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">Nova Transação</SheetTitle>
          <SheetDescription>
            Registre uma nova entrada ou saída para manter suas finanças em dia.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <TransactionForm setSheetOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
