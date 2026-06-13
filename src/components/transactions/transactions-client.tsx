'use client';
import { useMemo, useState } from 'react';
import { Clock, CheckCircle, User, Edit, Banknote, Landmark, CircleArrowDown, Calendar, Package, Search, Share2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(admin)/loading-component';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Badge } from '../ui/badge';
import type { PaymentMethod } from '@/app/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteTransactionButton } from '../dashboard/delete-transaction-button';
import { TransactionList } from './transaction-list';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { EditTransactionSheet } from './edit-transaction-sheet';
import { AddTransactionSheet } from '../dashboard/add-transaction-sheet';
import { AddEmployeePaymentSheet } from '../dashboard/add-employee-payment-sheet';

export function TransactionsClient() {
  const [fiadoSearchTerm, setFiadoSearchTerm] = useState('');
  const [upcomingSearchTerm, setUpcomingSearchTerm] = useState('');
  const { user, isUserLoading } = useUser();
  // Fetch transactions only for the logged-in user on this page
  const { transactions, loading: transactionsLoading } = useTransactions({ userIds: [user?.uid] });
  const { customers, loading: customersLoading } = useCustomers();
  const firestore = useFirestore();
  const { toast } = useToast();

  const loading = transactionsLoading || customersLoading || isUserLoading;

  const { paidTransactions, pendingFiado, totalFiadoValue, upcomingDeliveries } = useMemo(() => {
    // Any transaction (even from POS or Storefront) that is scheduled and not delivered
    const upcoming = transactions.filter(t => {
        if (!t.scheduledAt) return false;
        if (t.isDelivered) return false;

        // Legacy fallback: if it's paid and has no isDelivered flag, we assume it's delivered 
        // if it was scheduled for more than 3 days ago.
        if (t.status === 'paid' && t.isDelivered === undefined) {
             const threeDaysAgo = new Date();
             threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
             if (t.scheduledAt.toMillis() < threeDaysAgo.getTime()) {
                 return false;
             }
        }
        return true;
    });

    // Exclude storefront orders from the manual transactions page logic for general income/expense
    const manualTransactions = transactions.filter(t => t.category !== 'Venda Online' && !t.fromStorefront);
    
    const paid = manualTransactions.filter(t => t.status !== 'pending' && !upcoming.some(u => u.id === t.id));

    // Fiado: Any transaction that is pending and payment method is fiado, and not currently an upcoming delivery
    const fiado = transactions.filter((t) => t.status === 'pending' && t.paymentMethod === 'fiado' && !upcoming.some(u => u.id === t.id));
    
    const fiadoValue = fiado.reduce((sum, t) => {
        const remainingAmount = t.amount - (t.downPayment || 0);
        return sum + remainingAmount;
    }, 0);

    return {
      paidTransactions: paid,
      pendingFiado: fiado,
      totalFiadoValue: fiadoValue,
      upcomingDeliveries: upcoming.sort((a, b) => a.scheduledAt!.toMillis() - b.scheduledAt!.toMillis())
    };
  }, [transactions]);

  const filteredPendingFiado = useMemo(() => {
      return pendingFiado.filter((t) => {
          if (!fiadoSearchTerm.trim()) return true;
          const customerName = customers.find(c => c.id === t.customerId)?.name || t.customerInfo?.name || '';
          const lowerSearch = fiadoSearchTerm.toLowerCase();
          return customerName.toLowerCase().includes(lowerSearch) || 
                 t.description.toLowerCase().includes(lowerSearch);
      });
  }, [pendingFiado, fiadoSearchTerm, customers]);

  const filteredTotalFiadoValue = useMemo(() => {
      return filteredPendingFiado.reduce((sum, t) => {
          const remainingAmount = t.amount - (t.downPayment || 0);
          return sum + remainingAmount;
      }, 0);
  }, [filteredPendingFiado]);

  const filteredUpcomingDeliveries = useMemo(() => {
      return upcomingDeliveries.filter((t) => {
          if (!upcomingSearchTerm.trim()) return true;
          const customerName = customers.find(c => c.id === t.customerId)?.name || t.customerInfo?.name || t.description.match(/Cliente: (.*?)(?: -|$)/)?.[1] || '';
          const lowerSearch = upcomingSearchTerm.toLowerCase();
          return customerName.toLowerCase().includes(lowerSearch) || 
                 t.description.toLowerCase().includes(lowerSearch) ||
                 (t.orderNumber && t.orderNumber.toString().includes(lowerSearch));
      });
  }, [upcomingDeliveries, upcomingSearchTerm, customers]);

  const filteredTotalUpcomingValue = useMemo(() => {
      return filteredUpcomingDeliveries.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredUpcomingDeliveries]);

  const handleShareWhatsApp = () => {
      if (filteredPendingFiado.length === 0) return;
      
      let message = `Olá, tudo bem?\nPassando para informar que há um saldo pendente de *${formatCurrency(filteredTotalFiadoValue)}* referente aos seguintes pedidos:\n\n`;
      
      filteredPendingFiado.forEach(t => {
          const dateStr = formatDate(t.timestamp || t.dateMs);
          const remainingAmount = t.amount - (t.downPayment || 0);
          message += `- ${t.description.replace(/ \(Entrada de R\$\d+,\d+\)/, '')}: *${formatCurrency(remainingAmount)}* (${dateStr})\n`;
      });
      
      message += `\nQualquer dúvida, estou à disposição!`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleMarkAsPaid = (transactionId: string, paymentMethod: PaymentMethod) => {
    if (isUserLoading || !user || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
        return;
    }

    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions/${transactionId}`);
    const updateData: any = { paymentMethod: paymentMethod, isDelivered: true };
    
    if (paymentMethod === 'fiado') {
        updateData.status = 'pending';
    } else {
        updateData.status = 'paid';
    }
    
    updateDoc(transactionRef, updateData)
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
        console.error("Error updating transaction: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar a venda." });
      });
  };

  const handleMarkAsDelivered = (transactionId: string) => {
    if (isUserLoading || !user || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
        return;
    }

    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions/${transactionId}`);
    const updateData: any = { isDelivered: true };
    
    updateDoc(transactionRef, updateData)
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
        console.error("Error updating transaction: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar a venda." });
      });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Meus Lançamentos</h1>
            <div className="hidden sm:flex gap-2 items-center">
                <AddEmployeePaymentSheet />
                <AddTransactionSheet />
            </div>
        </div>
        
        {pendingFiado.length > 0 && (
          <Card>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                              <Clock className="w-5 h-5 mr-2 text-amber-600" />
                              Vendas a Prazo (Fiado) Pendentes
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                              {fiadoSearchTerm.trim() ? 'Total filtrado: ' : 'Total pendente: '}
                              <span className="font-bold">{formatCurrency(filteredTotalFiadoValue)}</span>
                          </p>
                      </div>
                      <div className="flex w-full sm:w-auto items-center gap-2">
                          <div className="relative w-full sm:w-64">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                  type="text"
                                  placeholder="Buscar cliente..."
                                  className="pl-8 bg-white"
                                  value={fiadoSearchTerm}
                                  onChange={(e) => setFiadoSearchTerm(e.target.value)}
                              />
                          </div>
                          {fiadoSearchTerm.trim() && filteredPendingFiado.length > 0 && (
                              <Button 
                                  variant="outline" 
                                  onClick={handleShareWhatsApp} 
                                  title="Compartilhar lista via WhatsApp"
                                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                              >
                                  <Share2 className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Cobrar</span>
                              </Button>
                          )}
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-3">
                  {filteredPendingFiado.map((t) => {
                      const customerName = customers.find(c => c.id === t.customerId)?.name || t.customerInfo?.name;
                      const remainingAmount = t.amount - (t.downPayment || 0);
                      const hasDownPayment = (t.downPayment || 0) > 0;
                      return (
                      <li
                        key={t.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg bg-amber-100/60 gap-2"
                      >
                      <div className="flex-grow flex flex-col gap-2 w-full">
                          <span className="font-semibold text-card-foreground">{t.description.replace(/ \(Entrada de R\$\d+,\d+\)/, '')}</span>
                          <div className='flex items-center gap-2 flex-wrap'>
                              {customerName && (
                                  <Badge variant="outline" className="text-xs border-primary/50">
                                      <User className="w-3 h-3 mr-1" />
                                      {customerName}
                                  </Badge>
                              )}
                              {hasDownPayment && (
                                  <>
                                  <Badge variant="secondary" className="text-xs">
                                      <Banknote className="w-3 h-3 mr-1" />
                                      Total: {formatCurrency(t.amount)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs bg-green-200 text-green-800 border-green-300">
                                      <CircleArrowDown className="w-3 h-3 mr-1" />
                                      Entrada: {formatCurrency(t.downPayment!)}
                                    </Badge>
                                  </>
                              )}
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(t.timestamp || t.dateMs)}
                              </Badge>
                              <Badge variant="destructive" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pendente: {formatCurrency(remainingAmount)}
                              </Badge>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button
                                      size="sm" 
                                      className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                                      disabled={isUserLoading}
                                  >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Marcar como Pago
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'pix')}>PIX</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'dinheiro')}>Dinheiro</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'cartao')}>Cartão</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                          <EditTransactionSheet transaction={t} />
                          <DeleteTransactionButton transactionId={t.id} transactionUserId={t.userId} />
                      </div>
                      </li>
                  )})}
                  </ul>
              </CardContent>
          </Card>
        )}

        {upcomingDeliveries.length > 0 && (
          <Card>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                              Pedidos Agendados / A Produzir
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                              {upcomingSearchTerm.trim() ? 'Total filtrado: ' : 'Total a produzir: '}
                              <span className="font-bold">{formatCurrency(filteredTotalUpcomingValue)}</span>
                          </p>
                      </div>
                      <div className="flex w-full sm:w-auto items-center gap-2">
                          <div className="relative w-full sm:w-64">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                  type="text"
                                  placeholder="Buscar pedido..."
                                  className="pl-8 bg-white"
                                  value={upcomingSearchTerm}
                                  onChange={(e) => setUpcomingSearchTerm(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-3">
                  {filteredUpcomingDeliveries.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground">
                          <p>Nenhum pedido encontrado para este filtro.</p>
                      </div>
                  ) : filteredUpcomingDeliveries.map((t) => {
                      const customerName = customers.find(c => c.id === t.customerId)?.name || t.customerInfo?.name || t.description.match(/Cliente: (.*?)(?: -|$)/)?.[1];
                      const deliveryDate = t.scheduledAt ? format(t.scheduledAt.toDate(), "dd/MM/yyyy 'às' HH:mm") : '';
                      const isStorefront = t.fromStorefront || t.category === 'Venda Online';
                      
                      return (
                      <li
                        key={t.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg bg-blue-50/60 gap-2 border border-blue-100"
                      >
                      <div className="flex-grow flex flex-col gap-2 w-full">
                          <span className="font-semibold text-card-foreground">
                              {t.orderNumber && <span className="text-blue-600 mr-1">#{t.orderNumber}</span>}
                              {t.description}
                          </span>
                          <div className='flex items-center gap-2 flex-wrap'>
                              {customerName && (
                                  <Badge variant="outline" className="text-xs border-blue-200">
                                      <User className="w-3 h-3 mr-1" />
                                      {customerName}
                                  </Badge>
                              )}
                              <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Para: {deliveryDate}
                              </Badge>
                              {isStorefront && (
                                  <Badge variant="outline" className="text-xs">
                                      <Package className="w-3 h-3 mr-1" />
                                      Loja Online
                                  </Badge>
                              )}
                          </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {t.status === 'paid' ? (
                              <Button
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                                  onClick={() => handleMarkAsDelivered(t.id)}
                                  disabled={isUserLoading}
                              >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Entregue
                              </Button>
                          ) : (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button
                                          size="sm" 
                                          className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                                          disabled={isUserLoading}
                                      >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Concluir
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'pix')}>Pago via PIX</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'dinheiro')}>Pago em Dinheiro</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'cartao')}>Pago no Cartão</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'fiado')}>Entregue (Vendido Fiado)</DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )}
                          <EditTransactionSheet transaction={t} />
                          <DeleteTransactionButton transactionId={t.id} transactionUserId={t.userId} />
                      </div>
                      </li>
                  )})}
                  </ul>
              </CardContent>
          </Card>
        )}

        <TransactionList 
          transactions={paidTransactions}
          title="Lançamentos Concluídos"
        />
      </div>
      <div className="sm:hidden fixed bottom-20 right-4 z-50 flex flex-col gap-2 items-center">
        <AddEmployeePaymentSheet isMobile={true} />
        <AddTransactionSheet isMobile={true}/>
      </div>
    </>
  );
}
