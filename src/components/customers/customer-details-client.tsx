'use client';
import { useCustomer } from '@/app/lib/hooks/use-customer';
import Loading from '@/app/(main)/loading';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { User, Home, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

interface CustomerDetailsClientProps {
  customerId: string;
}

export function CustomerDetailsClient({ customerId }: CustomerDetailsClientProps) {
  const { customer, loading } = useCustomer(customerId);

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

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <User className="w-8 h-8 mr-3" />
            Detalhes do Cliente
        </h1>
        <Button asChild variant="outline">
            <Link href="/customers">Voltar</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
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
             {customer.address && (
                <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-muted-foreground mt-1" />
                    <p className="text-card-foreground">{customer.address}</p>
                </div>
            )}
            {!customer.whatsapp && !customer.address && (
                <p className="text-muted-foreground">Nenhuma informação adicional cadastrada.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
