'use client';
import Loading from '@/app/(admin)/loading-component';
import { Card, CardContent } from '../ui/card';
import { PlusSquare } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOptionals } from '@/app/lib/hooks/use-optionals';
import { AddOptionalDialog } from './add-optional-dialog';
import { EditOptionalDialog } from './edit-optional-dialog';
import { DeleteOptionalButton } from './delete-optional-button';

export function OptionalsClient() {
  const { optionals, loading } = useOptionals();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <PlusSquare className="w-8 h-8 mr-3" />
            Meus Opcionais
        </h1>
        <AddOptionalDialog />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Opcional</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optionals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum opcional cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                optionals.map((optional) => (
                  <TableRow key={optional.id} className="group">
                    <TableCell className="font-medium">
                        {optional.name}
                    </TableCell>
                    <TableCell>{formatCurrency(optional.price)}</TableCell>
                    <TableCell className="text-right">
                        <EditOptionalDialog optional={optional} />
                        <DeleteOptionalButton optionalId={optional.id} />
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
