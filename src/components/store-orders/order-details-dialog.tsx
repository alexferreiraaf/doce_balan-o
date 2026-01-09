'use client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Eye, User, Phone, Home, Bike, Package, Landmark, Coins, CreditCard } from "lucide-react";
import type { Transaction, Customer, PaymentMethod } from "@/app/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "../ui/separator";

interface OrderDetailsDialogProps {
    transaction: Transaction;
    customer: Customer;
}

const paymentMethodDetails: Record<string, { text: string; icon: React.ElementType }> = {
    pix: { text: 'PIX', icon: Landmark },
    dinheiro: { text: 'Dinheiro', icon: Coins },
    cartao: { text: 'Cartão', icon: CreditCard },
};

export function OrderDetailsDialog({ transaction, customer }: OrderDetailsDialogProps) {
    if (!customer) return null;

    const fullAddress = [
        customer.street,
        customer.number,
        customer.complement,
        customer.neighborhood,
        customer.city,
        customer.state,
        customer.cep,
    ].filter(Boolean).join(', ');

    const deliveryType = transaction.description.includes('Entrega') ? 'delivery' : 'pickup';
    const paymentInfo = transaction.paymentMethod ? paymentMethodDetails[transaction.paymentMethod] : null;

    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Eye className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ver Detalhes do Pedido</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalhes do Pedido</DialogTitle>
                    <DialogDescription>
                        Informações completas do pedido e do cliente.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    
                    {/* Customer Info */}
                    <div className="space-y-2">
                         <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Cliente</h3>
                         <div className="pl-6 text-sm space-y-1">
                            <p>{customer.name}</p>
                            {customer.whatsapp && <p className="text-muted-foreground">{customer.whatsapp}</p>}
                         </div>
                    </div>

                    <Separator />

                    {/* Delivery Info */}
                    <div className="space-y-2">
                        {deliveryType === 'delivery' ? (
                            <>
                                <h3 className="font-semibold flex items-center gap-2"><Bike className="w-4 h-4 text-muted-foreground" />Endereço de Entrega</h3>
                                <div className="pl-6 text-sm">
                                    {fullAddress ? <p>{fullAddress}</p> : <p className="text-muted-foreground">Endereço não fornecido.</p>}
                                </div>
                            </>
                        ) : (
                             <h3 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" />Retirada no Local</h3>
                        )}
                    </div>

                    <Separator />

                    {/* Order Info */}
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">Pedido</h3>
                        <div className="pl-6 text-sm space-y-1">
                            <p>{transaction.description}</p>
                            {transaction.deliveryFee && transaction.deliveryFee > 0 && <p className="text-muted-foreground">Taxa de Entrega: {formatCurrency(transaction.deliveryFee)}</p>}
                            <p className="font-bold">Total: {formatCurrency(transaction.amount)}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Payment Info */}
                     <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">Pagamento</h3>
                        <div className="pl-6 text-sm">
                             {paymentInfo ? (
                                <div className="flex items-center gap-2">
                                    <paymentInfo.icon className="w-4 h-4 text-muted-foreground" />
                                    <p>{paymentInfo.text}</p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Forma de pagamento não especificada.</p>
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
