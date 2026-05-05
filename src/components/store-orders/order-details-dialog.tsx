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
import { Eye, User, Phone, Home, Bike, Package, Landmark, Coins, CreditCard, Calendar } from "lucide-react";
import type { Transaction, Customer, PaymentMethod } from "@/app/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import { useState } from "react";
import { EditTransactionForm } from "../transactions/edit-transaction-form";

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
    const [isEditing, setIsEditing] = useState(false);
    const [open, setOpen] = useState(false);

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
        <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => {
                                setIsEditing(false);
                                setOpen(true);
                            }}>
                                <Eye className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ver Detalhes do Pedido</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{isEditing ? 'Editar Pedido' : 'Detalhes do Pedido'}</DialogTitle>
                        {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2 h-8 px-2 text-primary font-bold">
                                Editar
                            </Button>
                        )}
                    </div>
                    <DialogDescription>
                        {isEditing ? 'Ajuste as informações do pedido abaixo.' : 'Informações completas do pedido e do cliente.'}
                    </DialogDescription>
                </DialogHeader>
                {isEditing ? (
                    <div className="py-4">
                        <EditTransactionForm transaction={transaction} setSheetOpen={(isOpen) => {
                            if (!isOpen) {
                                setIsEditing(false);
                                setOpen(false);
                            }
                        }} />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                    
                    {/* Customer Info */}
                    <div className="space-y-2">
                         <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Cliente</h3>
                         <div className="pl-6 text-sm space-y-1">
                            <p>{customer.name}</p>
                            {customer.whatsapp && (
                                <a 
                                    href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                >
                                    <Phone className="w-4 h-4 text-muted-foreground"/>
                                    {customer.whatsapp}
                                </a>
                            )}
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

                    {/* Scheduling Info */}
                    {transaction.scheduledAt && (
                        <>
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />Agendamento</h3>
                                <div className="pl-6 text-sm">
                                    <p>{format(transaction.scheduledAt.toDate(), "dd/MM/yyyy 'às' HH:mm")}</p>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Order Info */}
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">Pedido</h3>
                        <div className="pl-6 text-sm space-y-2">
                            {transaction.cartItems && transaction.cartItems.length > 0 ? (
                                transaction.cartItems.map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium">{item.quantity}x {item.name}</span>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                        {item.selectedOptionals && item.selectedOptionals.length > 0 && (
                                            <div className="pl-3 space-y-0.5 border-l-2 border-primary/20">
                                                {item.selectedOptionals.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex justify-between text-[11px] text-muted-foreground">
                                                        <span>+ {opt.quantity}x {opt.name}</span>
                                                        <span>{formatCurrency(opt.price * opt.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>{transaction.description}</p>
                            )}
                            
                            <div className="pt-2 border-t space-y-1">
                                {transaction.deliveryFee && transaction.deliveryFee > 0 && (
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Taxa de Entrega</span>
                                        <span>{formatCurrency(transaction.deliveryFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base text-primary">
                                    <span>Total</span>
                                    <span>{formatCurrency(transaction.amount)}</span>
                                </div>
                            </div>
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
                )}
            </DialogContent>
        </Dialog>
    );
}