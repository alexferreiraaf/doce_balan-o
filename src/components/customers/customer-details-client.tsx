'use client';
import { useCustomer } from '@/app/lib/hooks/use-customer';
import Loading from '@/app/(main)/loading';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { User, Home, Phone, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { EditCustomerDialog } from './edit-customer-dialog';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionList } from '../transactions/transaction-list';

interface CustomerDetailsClientProps {
  customerId: string;
}

export function CustomerDetailsClient({ customerId }: CustomerDetailsClientProps) {
  const { customer, loading: customerLoading } = useCustomer(customerId);
  const { transactions, loading: transactionsLoading } = useTransactions();

  const customerTransactions = useMemo(() => {
    return transactions.filter(t => t.customerId === customerId);
  }, [transactions, customerId]);

  const loading = customerLoading || transactionsLoading;

  if (loading) {
    return <Loading />;
  }

  if (!customer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <p className="text-muted-foreground">O cliente que você está procurando não existe ou foi removido.</p>
        <Button asChild className="mt-4">
            <Link href="/customers">Voltar para Clientes</Link>
        </Button>
      </div>
    );
  }
  
  const fullAddress = [
    customer.street,
    customer.number,
    customer.complement,
    customer.neighborhood,
    customer.city,
    customer.state,
    customer.cep,
  ].filter(Boolean).join(', ');

  const hasAdditionalInfo = customer.whatsapp || fullAddress;

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <User className="w-8 h-8 mr-3" />
            {customer.name}
        </h1>
        <div className="flex items-center gap-2">
            <EditCustomerDialog customer={customer} />
            <Button asChild variant="outline">
                <Link href="/customers">Voltar</Link>
            </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <User className="w-4 h-4 mr-2" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="history">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Dados Cadastrais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {customer.whatsapp && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {customer.whatsapp}
                            </a>
                        </div>
                    )}
                    {fullAddress && (
                        <div className="flex items-start gap-3">
                            <Home className="w-5 h-5 text-muted-foreground mt-1" />
                            <p className="text-card-foreground">{fullAddress}</p>
                        </div>
                    )}
                    {!hasAdditionalInfo && (
                        <p className="text-muted-foreground">Nenhuma informação adicional cadastrada.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="history">
            <div className="mt-4">
                <TransactionList transactions={customerTransactions} title="Histórico de Compras" />
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
