'use client';

import React from 'react';
import type { Customer, Product, Transaction } from '@/app/lib/types';
import { useProducts } from '@/app/lib/hooks/use-products';
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

const parseCartFromDescription = (description: string, allProducts: Product[]): { name: string; quantity: number, price: number }[] => {
    if (!description.includes('x ')) return [];
    
    return description.split(', ').map(part => {
        const match = part.match(/(\d+)x (.*)/);
        if (match) {
            const quantity = parseInt(match[1], 10);
            const name = match[2].replace(/ \(.*/, ''); 
            const product = allProducts.find(p => p.name === name);
            return { quantity, name, price: product?.price || 0 };
        }
        return null;
    }).filter((item): item is { name: string; quantity: number, price: number } => item !== null);
};


export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ transaction, customer }, ref) => {
    const { products } = useProducts();
    const { transactions: allTransactions } = useTransactions();

    const receiptDetails = useMemo(() => {
        if (!transaction) return null;

        const saleDate = transaction.dateMs ? format(new Date(transaction.dateMs), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida';
        const orderNumber = (allTransactions.length).toString().padStart(4, '0');
        const parsedItems = parseCartFromDescription(transaction.description, products);
        const subtotal = parsedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
            saleDate,
            orderNumber,
            parsedItems,
            subtotal
        }
    }, [transaction, products, allTransactions]);

    if (!receiptDetails) return null;
    
    const { saleDate, orderNumber, parsedItems, subtotal } = receiptDetails;

    return (
      <div ref={ref} className="bg-white text-black p-6 font-mono text-xs w-[302px] mx-auto">
        <div className="text-center mb-4">
            <WhiskIcon className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-lg font-bold">Doçuras da Fran</h1>
            <p>Comprovante de Venda</p>
        </div>
        <hr className="border-dashed border-black my-2" />
        <div className="flex justify-between">
            <span>Pedido:</span>
            <span>#{orderNumber}</span>
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
            <div className="grid grid-cols-5 gap-1 font-bold">
                <div className="col-span-2">Item</div>
                <div>Qtd</div>
                <div className="text-right">V. Un.</div>
                <div className="text-right">Total</div>
            </div>
            {parsedItems.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-1">
                    <div className="col-span-2 truncate">{item.name}</div>
                    <div>{item.quantity}</div>
                    <div className="text-right">{formatCurrency(item.price)}</div>
                    <div className="text-right">{formatCurrency(item.price * item.quantity)}</div>
                </div>
            ))}
        </div>
        <hr className="border-dashed border-black my-2" />
        <div className="space-y-1">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            {transaction.discount && transaction.discount > 0 && (
                <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(transaction.discount)}</span>
                </div>
            )}
            {transaction.deliveryFee && transaction.deliveryFee > 0 && (
                <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(transaction.deliveryFee)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(transaction.amount)}</span>
            </div>
        </div>

        {(transaction.downPayment && transaction.downPayment > 0) || transaction.status === 'pending' ? (
            <>
                <hr className="border-dashed border-black my-2" />
                <div className="space-y-1 text-sm">
                    {transaction.downPayment && transaction.downPayment > 0 && (
                        <div className="flex justify-between">
                            <span>Entrada Paga:</span>
                            <span>{formatCurrency(transaction.downPayment)}</span>
                        </div>
                    )}
                     <div className="flex justify-between font-bold text-red-600">
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
                    <span>{transaction.paymentMethod}</span>
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
