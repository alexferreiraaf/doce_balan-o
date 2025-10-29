'use client';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import Loading from '@/app/(main)/loading';
import { Card, CardContent } from '../ui/card';
import { AddCustomerDialog } from '../dashboard/add-customer-dialog';
import { Users } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCustomerButton } from './delete-customer-button';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';


export function CustomersClient() {
  const { customers, loading } = useCustomers();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Users className="w-8 h-8 mr-3" />
            Meus Clientes
        </h1>
        <AddCustomerDialog />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Cliente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="group">
                    <TableCell className="font-medium">
                      <Link href={`/customers/${customer.id}`} className="flex items-center gap-2 hover:underline">
                        {customer.name}
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                        <DeleteCustomerButton customerId={customer.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
