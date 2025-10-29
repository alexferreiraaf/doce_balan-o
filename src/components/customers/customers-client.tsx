'use client';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import Loading from '@/app/(main)/loading';
import { Card, CardContent } from '../ui/card';
import { AddCustomerDialog } from '../dashboard/add-customer-dialog';
import { Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCustomerButton } from './delete-customer-button';


export function CustomersClient() {
  const { customers, loading } = useCustomers();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
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
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
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
