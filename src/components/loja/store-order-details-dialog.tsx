'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
    Package, 
    Bike, 
    Calendar, 
    Clock, 
    Landmark, 
    Coins, 
    CreditCard, 
    User,
    MapPin,
    ShoppingBag
} from "lucide-react";
import type { Transaction, PaymentMethod } from "@/app/lib/types";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StoreOrderDetailsDialogProps {
    transaction: Transaction;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const paymentMethodDetails: Record<string, { text: string; icon: React.ElementType }> = {
    pix: { text: 'PIX', icon: Landmark },
    dinheiro: { text: 'Dinheiro', icon: Coins },
    cartao: { text: 'Cartão', icon: CreditCard },
    fiado: { text: 'Fiado', icon: User },
};

export function StoreOrderDetailsDialog({ transaction, open, onOpenChange }: StoreOrderDetailsDialogProps) {
    const paymentInfo = transaction.paymentMethod ? paymentMethodDetails[transaction.paymentMethod] : null;
    const isDelivery = transaction.deliveryType === 'delivery';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        Pedido #{transaction.orderNumber || transaction.id.slice(-5).toUpperCase()}
                    </DialogTitle>
                    <DialogDescription>
                        Confira abaixo todos os detalhes do seu pedido.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <Badge variant="secondary" className="px-4 py-1 text-sm font-bold uppercase tracking-wider">
                            {transaction.status === 'pending' && 'Aguardando Confirmação'}
                            {transaction.status === 'preparing' && 'Em Preparo'}
                            {transaction.status === 'ready' && 'Pronto para Retirada'}
                            {transaction.status === 'paid' && 'Pedido Finalizado'}
                            {transaction.status === 'cancelled' && 'Pedido Cancelado'}
                        </Badge>
                    </div>

                    <Separator />

                    {/* Items Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                            <Package className="w-4 h-4" /> Itens do Pedido
                        </h3>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                            {transaction.cartItems && transaction.cartItems.length > 0 ? (
                                transaction.cartItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm">{transaction.description}</p>
                            )}
                            
                            {transaction.deliveryFee ? (
                                <div className="flex justify-between text-sm text-muted-foreground border-t pt-2">
                                    <span>Taxa de Entrega</span>
                                    <span>{formatCurrency(transaction.deliveryFee)}</span>
                                </div>
                            ) : null}

                            {transaction.discount ? (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Desconto</span>
                                    <span>-{formatCurrency(transaction.discount)}</span>
                                </div>
                            ) : null}

                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                                <span>Total</span>
                                <span className="text-primary">{formatCurrency(transaction.amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timing Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                                <Calendar className="w-4 h-4" /> Data
                            </h3>
                            <p className="text-xs pl-6">
                                {transaction.scheduledAt 
                                    ? format(transaction.scheduledAt.toDate(), "dd 'de' MMMM", { locale: ptBR })
                                    : format(transaction.timestamp.toDate(), "dd 'de' MMMM", { locale: ptBR })
                                }
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                                <Clock className="w-4 h-4" /> Horário
                            </h3>
                            <p className="text-xs pl-6">
                                {transaction.scheduledAt 
                                    ? format(transaction.scheduledAt.toDate(), "HH:mm")
                                    : format(transaction.timestamp.toDate(), "HH:mm")
                                }
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Delivery Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                            {isDelivery ? <Bike className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            {isDelivery ? 'Entrega' : 'Retirada'}
                        </h3>
                        <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs leading-relaxed">
                                {isDelivery 
                                    ? 'Seu pedido será entregue no endereço informado durante a compra.' 
                                    : 'Você deve retirar seu pedido em nossa loja no horário agendado.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                            <CreditCard className="w-4 h-4" /> Pagamento
                        </h3>
                        <div className="flex items-center gap-2 pl-6">
                            {paymentInfo && <paymentInfo.icon className="w-4 h-4 text-muted-foreground" />}
                            <span className="text-sm">{paymentInfo?.text || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
