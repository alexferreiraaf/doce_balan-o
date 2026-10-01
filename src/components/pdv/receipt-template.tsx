'use client';

import React from 'react';
import type { Customer, Transaction, CartItem } from '@/app/lib/types';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { WhiskIcon } from '../icons/whisk-icon';

interface ReceiptTemplateProps {
  transaction: Transaction;
  customer?: Customer;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ transaction, customer }, ref) => {
    const { transactions: allTransactions } = useTransactions();

    const receiptDetails = useMemo(() => {
        if (!transaction) return null;

        const saleDate = transaction.dateMs ? format(new Date(transaction.dateMs), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida';
        const orderNumberStr = transaction.orderNumber ? transaction.orderNumber.toString().padStart(4, '0') : transaction.id.slice(0, 4).toUpperCase();
        
        const parsedItems: CartItem[] = transaction.cartItems || [];
        
        const subtotal = parsedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
            saleDate,
            orderNumberStr,
            parsedItems,
            subtotal
        }
    }, [transaction, allTransactions]);

    if (!receiptDetails) return null;
    
    const { saleDate, orderNumberStr, parsedItems, subtotal } = receiptDetails;

    return (
      <div ref={ref} className="bg-white text-black p-6 font-mono text-xs w-[302px] mx-auto">
        <div className="text-center mb-4">
            <WhiskIcon className="w-12 h-12 mx-auto print:!fill-black" fill="#D94686" />
            <h1 className="text-lg font-bold print:!text-black" style={{color: "#D94686"}}>Doçuras da Fran</h1>
            <p className="text-black">Comprovante de Venda</p>
        </div>
        <hr className="border-dashed border-black my-2" />
        <div className="flex justify-between">
            <span>Pedido:</span>
            <span>#{orderNumberStr}</span>
        </div>
        <div className="flex justify-between">
            <span>Data:</span>
            <span>{saleDate}</span>
        </div>
        {customer && (
            <div className="flex justify-between">
                <span>Cliente:</span>
                <span>{customer.name}</span>
            </div>
        )}
        <hr className="border-dashed border-black my-2" />
        <div>
            <div className="grid grid-cols-12 gap-1 font-bold">
                <div className="col-span-5">Item</div>
                <div className="col-span-1">Qtd</div>
                <div className="text-right col-span-3">V. Un.</div>
                <div className="text-right col-span-3">Total</div>
            </div>
            {parsedItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-1 items-start">
                    <div className="col-span-5">{item.name}</div>
                    <div className="col-span-1">{item.quantity}</div>
                    <div className="text-right col-span-3">{formatCurrency(item.price)}</div>
                    <div className="text-right col-span-3">{formatCurrency(item.price * item.quantity)}</div>
                </div>
            ))}
        </div>
        
        {((transaction.additionalValue || 0) > 0 || (transaction.deliveryFee || 0) > 0 || (transaction.discount || 0) > 0) && (
            <>
                <hr className="border-dashed border-black my-2" />
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                     {(transaction.additionalValue || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>{transaction.additionalDescription || 'Adicional'}:</span>
                            <span>{formatCurrency(transaction.additionalValue!)}</span>
                        </div>
                    )}
                    {(transaction.deliveryFee || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Taxa de Entrega:</span>
                            <span>{formatCurrency(transaction.deliveryFee!)}</span>
                        </div>
                    )}
                    {(transaction.discount || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Desconto:</span>
                            <span>-{formatCurrency(transaction.discount!)}</span>
                        </div>
                    )}
                </div>
            </>
        )}
       
        <hr className="border-dashed border-black my-2" />
        <div className="flex justify-between font-bold text-sm pt-1">
            <span>TOTAL:</span>
            <span>{formatCurrency(transaction.amount)}</span>
        </div>

        {(transaction.downPayment || 0) > 0 || transaction.status === 'pending' ? (
            <>
                <hr className="border-dashed border-black my-2" />
                <div className="space-y-1 text-sm">
                    {(transaction.downPayment || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Entrada Paga:</span>
                            <span>{formatCurrency(transaction.downPayment!)}</span>
                        </div>
                    )}
                     <div className="flex justify-between font-bold" style={{color: "#DC2626"}}>
                        <span>VALOR PENDENTE:</span>
                        <span>{formatCurrency(transaction.amount - (transaction.downPayment || 0))}</span>
                    </div>
                </div>
            </>
        ) : (
             <>
                <hr className="border-dashed border-black my-2" />
                <div className="flex justify-between font-bold">
                    <span>PAGAMENTO:</span>
                    <span>{transaction.paymentMethod?.toUpperCase()}</span>
                </div>
             </>
        )}
        
        <hr className="border-dashed border-black my-2" />
        <p className="text-center mt-4">Obrigado pela preferência!</p>
      </div>
    );
  }
);

ReceiptTemplate.displayName = "ReceiptTemplate";
