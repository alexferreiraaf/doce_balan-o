'use client';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { EmployeePaymentForm } from './employee-payment-form';

export function AddEmployeePaymentSheet({ isMobile = false }: { isMobile?: boolean }) {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isMobile ? (
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center"
            >
              <Users className="w-6 h-6" />
            </Button>
        ) : (
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-semibold shadow-sm transition duration-300">
              <Users className="w-4 h-4 mr-2" />
              Pagar Funcionário
            </Button>
        )}
      </SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "bg-background w-full h-full sm:max-w-lg overflow-y-auto" : "bg-background w-full sm:max-w-lg overflow-y-auto"}>
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">Pagamento de Funcionário</SheetTitle>
          <SheetDescription>
            Registre o pagamento de diárias para seus funcionários. Isso será contabilizado como uma despesa.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <EmployeePaymentForm setSheetOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
