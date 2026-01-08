'use client';
import { useDeliveryZones } from '@/app/lib/hooks/use-delivery-zones';
import Loading from '@/app/(admin)/loading-component';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bike } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';
import { AddDeliveryZoneDialog } from './add-delivery-zone-dialog';
import { EditDeliveryZoneDialog } from './edit-delivery-zone-dialog';
import { DeleteDeliveryZoneButton } from './delete-delivery-zone-button';


export function DeliveryClient() {
  const { deliveryZones, loading } = useDeliveryZones();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-grow">
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
                <Bike className="w-8 h-8 mr-3" />
                Configurar Entregas
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie os bairros e as taxas de entrega para seus clientes.</p>
        </div>
        <AddDeliveryZoneDialog />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bairro</TableHead>
                <TableHead>Taxa de Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryZones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhuma zona de entrega cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                deliveryZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>{formatCurrency(zone.fee)}</TableCell>
                    <TableCell className="text-right">
                        <EditDeliveryZoneDialog zone={zone} />
                        <DeleteDeliveryZoneButton zoneId={zone.id} />
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
