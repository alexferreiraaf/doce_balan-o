'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  Clock, 
  ChefHat, 
  PackageCheck, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, TransactionStatus } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { StoreOrderDetailsDialog } from './store-order-details-dialog';

interface OrderProgressBarProps {
  transaction: Transaction;
  onClose?: () => void;
  orderNumber?: string;
}

const statusConfig: Record<TransactionStatus, { 
  label: string; 
  icon: React.ElementType; 
  color: string; 
  progress: number;
  textColor: string;
}> = {
  pending: { 
    label: 'AGUARDANDO CONFIRMAÇÃO', 
    icon: Clock, 
    color: 'bg-amber-500', 
    progress: 20,
    textColor: 'text-amber-500'
  },
  preparing: { 
    label: 'EM PREPARO', 
    icon: ChefHat, 
    color: 'bg-blue-500', 
    progress: 50,
    textColor: 'text-blue-500'
  },
  ready: { 
    label: 'PRONTO PARA RETIRADA', 
    icon: PackageCheck, 
    color: 'bg-purple-500', 
    progress: 80,
    textColor: 'text-purple-500'
  },
  paid: { 
    label: 'PEDIDO FINALIZADO', 
    icon: CheckCircle2, 
    color: 'bg-green-500', 
    progress: 100,
    textColor: 'text-green-500'
  },
  cancelled: { 
    label: 'PEDIDO CANCELADO', 
    icon: XCircle, 
    color: 'bg-red-500', 
    progress: 100,
    textColor: 'text-red-500'
  },
};

export function OrderProgressBar({ transaction, onClose, orderNumber }: OrderProgressBarProps) {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const status = transaction.status || 'pending';
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const formattedDate = transaction.timestamp?.toDate 
    ? format(transaction.timestamp.toDate(), "dd/MM HH:mm", { locale: ptBR })
    : '';

  const displayOrderNumber = orderNumber || transaction.orderNumber?.toString() || transaction.id.slice(-5).toUpperCase();

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-background/80 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm sm:text-base">
              Acompanhe seu pedido <span className="text-muted-foreground font-normal">#{displayOrderNumber}</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-colors gap-1 px-3 shadow-sm active:scale-95 transition-transform" onClick={() => setIsDetailsOpen(true)}>
              <span className="text-xs font-bold uppercase">Detalhes</span>
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={onClose} title="Remover da tela">
                <XCircle className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        <StoreOrderDetailsDialog 
          transaction={transaction}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={cn("text-[10px] sm:text-xs font-black tracking-widest uppercase", config.textColor)}>
              {config.label}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-bold">
              {config.progress}%
            </span>
          </div>

          <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
             <div 
                className={cn("h-full transition-all duration-1000 ease-out rounded-full relative", config.color)}
                style={{ width: `${config.progress}%` }}
             >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
             </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1">
              {transaction.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}
            </div>
            <div>
              Realizado em {formattedDate}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
