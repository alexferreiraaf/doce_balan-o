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
import type { Product } from '@/app/lib/types';

interface CartItem extends Product {
  quantity: number;
}

interface AddTransactionSheetProps {
  isMobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  cart?: CartItem[];
  cartTotal?: number;
}

export function AddTransactionSheet({ isMobile = false, open: controlledOpen, onOpenChange: setControlledOpen, cart, cartTotal }: AddTransactionSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const title = cart ? 'Finalizar Venda' : 'Nova Transação';
  const description = cart ? 'Confira os detalhes e finalize a venda.' : 'Registre uma nova entrada ou saída para manter suas finanças em dia.';

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && setControlledOpen) {
        setControlledOpen(isOpen);
    }
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-full w-16 h-16 bg-primary text-primary-foreground shadow-lg flex flex-col items-center justify-center transform -translate-y-4"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-background w-full h-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">{title}</SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <TransactionForm setSheetOpen={handleOpenChange} cart={cart} cartTotal={cartTotal} />
        </div>
      </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold shadow-lg transition duration-300 transform hover:scale-105">
          <Plus className="w-5 h-5 mr-1" />
          Novo Lançamento
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">{title}</SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <TransactionForm setSheetOpen={handleOpenChange} cart={cart} cartTotal={cartTotal} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
