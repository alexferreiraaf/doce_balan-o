'use client';
import { useMemo } from 'react';
import { 
  Clock, 
  CheckCircle, 
  User, 
  Landmark, 
  FileText, 
  CreditCard, 
  Coins, 
  Calendar,
  ChefHat,
  PackageCheck,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(admin)/loading-component';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Badge } from '../ui/badge';
import type { PaymentMethod, Transaction, TransactionStatus } from '@/app/lib/types';
import { DeleteTransactionButton } from '../dashboard/delete-transaction-button';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { EditTransactionSheet } from '../transactions/edit-transaction-sheet';
import { OrderDetailsDialog } from './order-details-dialog';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

const paymentMethodDetails: Record<PaymentMethod, { text: string; icon: React.ElementType }> = {
    pix: { text: 'PIX', icon: Landmark },
    dinheiro: { text: 'Dinheiro', icon: Coins },
    cartao: { text: 'Cartão', icon: CreditCard },
    fiado: { text: 'Fiado', icon: User },
};

interface StoreOrdersClientProps {
  userIds: string[];
}

export function StoreOrdersClient({ userIds }: StoreOrdersClientProps) {
  const { transactions: allTransactions, loading: transactionsLoading } = useTransactions({ userIds });
  const { customers, loading: customersLoading } = useCustomers();
  const { isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const loading = transactionsLoading || customersLoading || isUserLoading;

  const ordersByStatus = useMemo(() => {
    const storeOrders = allTransactions.filter(t => t.category === 'Venda Online' || t.fromStorefront);
    
    return {
      pending: storeOrders.filter(t => t.status === 'pending'),
      preparing: storeOrders.filter(t => t.status === 'preparing'),
      ready: storeOrders.filter(t => t.status === 'ready'),
      paid: storeOrders.filter(t => t.status === 'paid'),
    };
  }, [allTransactions]);

  const updateOrderStatus = (transaction: Transaction, newStatus: TransactionStatus) => {
    if (isUserLoading || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário ou serviço indisponível." });
        return;
    }
    
    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${transaction.userId}/transactions/${transaction.id}`);
    const updateData = { status: newStatus };
    
    updateDoc(transactionRef, updateData)
      .then(() => {
        toast({ title: "Sucesso!", description: "Status do pedido atualizado." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o pedido." });
      });
  };

  if (loading) {
    return <Loading />;
  }

  const KanbanCard = ({ t }: { t: Transaction }) => {
    const customer = customers.find(c => c.id === t.customerId);
    const paymentInfo = t.paymentMethod ? paymentMethodDetails[t.paymentMethod] : null;
    
    return (
      <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary/40">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <span className="font-bold text-sm line-clamp-2">{t.description}</span>
            <EditTransactionSheet transaction={t} />
          </div>

          <div className="flex flex-col gap-1.5">
            {customer && (
              <div className="flex items-center text-xs text-muted-foreground">
                <User className="w-3 h-3 mr-1" />
                {customer.name}
              </div>
            )}
            {t.scheduledAt && (
              <div className="flex items-center text-xs font-semibold text-primary">
                <Calendar className="w-3 h-3 mr-1" />
                {format(t.scheduledAt.toDate(), "dd/MM 'às' HH:mm")}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {paymentInfo && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5">
                <paymentInfo.icon className="w-2.5 h-2.5 mr-1" />
                {paymentInfo.text}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] py-0 h-5 border-primary/20">
              {formatCurrency(t.amount)}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t gap-2">
            <div className="flex gap-1">
               {customer && <OrderDetailsDialog transaction={t} customer={customer} />}
               <DeleteTransactionButton transactionId={t.id} transactionUserId={t.userId} />
            </div>
            
            {t.status === 'pending' && (
              <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600" onClick={() => updateOrderStatus(t, 'preparing')}>
                <ChefHat className="w-3 h-3 mr-1" /> Preparar
              </Button>
            )}
            {t.status === 'preparing' && (
              <Button size="sm" className="h-8 text-xs bg-blue-500 hover:bg-blue-600" onClick={() => updateOrderStatus(t, 'ready')}>
                <PackageCheck className="w-3 h-3 mr-1" /> Pronto
              </Button>
            )}
            {t.status === 'ready' && (
              <Button size="sm" className="h-8 text-xs bg-green-500 hover:bg-green-600" onClick={() => updateOrderStatus(t, 'paid')}>
                <CheckCircle className="w-3 h-3 mr-1" /> Finalizar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn = ({ title, icon: Icon, orders, colorClass }: { title: string, icon: any, orders: Transaction[], colorClass: string }) => (
    <div className="flex flex-col min-w-[280px] w-full max-w-sm h-full">
      <div className={cn("flex items-center justify-between p-3 rounded-t-lg border-b-2 mb-4", colorClass)}>
        <h3 className="font-bold flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </h3>
        <Badge variant="secondary" className="rounded-full">{orders.length}</Badge>
      </div>
      <ScrollArea className="flex-1 px-1">
        <div className="pb-4">
          {orders.length > 0 ? (
            orders.map(t => <KanbanCard key={t.id} t={t} />)
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg opacity-40">
              <p className="text-xs">Nenhum pedido</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Quadro de Pedidos
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="w-4 h-4" />
            Total: {allTransactions.filter(t => t.category === 'Venda Online' || t.fromStorefront).length} pedidos
          </div>
      </div>
      
      <ScrollArea className="flex-1 -mx-4 sm:mx-0">
        <div className="flex gap-6 h-full p-4 min-h-[500px]">
          <KanbanColumn 
            title="Novos" 
            icon={Clock} 
            orders={ordersByStatus.pending} 
            colorClass="bg-amber-100/50 border-amber-500 text-amber-700" 
          />
          <KanbanColumn 
            title="Em Preparo" 
            icon={ChefHat} 
            orders={ordersByStatus.preparing} 
            colorClass="bg-blue-100/50 border-blue-500 text-blue-700" 
          />
          <KanbanColumn 
            title="Prontos" 
            icon={PackageCheck} 
            orders={ordersByStatus.ready} 
            colorClass="bg-purple-100/50 border-purple-500 text-purple-700" 
          />
          <KanbanColumn 
            title="Finalizados" 
            icon={CheckCircle} 
            orders={ordersByStatus.paid} 
            colorClass="bg-green-100/50 border-green-500 text-green-700" 
          />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
