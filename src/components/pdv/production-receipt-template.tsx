import React, { forwardRef, useMemo } from 'react';
import type { Transaction, CartItem, Customer } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductionReceiptTemplateProps {
  transaction: Transaction | null;
  customer?: Customer;
}

export const ProductionReceiptTemplate = forwardRef<HTMLDivElement, ProductionReceiptTemplateProps>(
  ({ transaction, customer }, ref) => {
    const receiptDetails = useMemo(() => {
        if (!transaction) return null;

        const saleDate = transaction.dateMs ? format(new Date(transaction.dateMs), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida';
        const orderNumberStr = transaction.orderNumber ? transaction.orderNumber.toString().padStart(4, '0') : transaction.id.slice(0, 4).toUpperCase();
        
        const parsedItems: CartItem[] = transaction.cartItems || [];
        const subtotal = parsedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        return { saleDate, orderNumberStr, parsedItems, subtotal }
    }, [transaction]);

    if (!receiptDetails || !transaction) return null;
    
    const { saleDate, orderNumberStr, parsedItems, subtotal } = receiptDetails;

    return (
      <div ref={ref} className="bg-white text-black p-4 font-sans text-sm w-[302px] mx-auto border border-black/10">
        
        <div className="text-center mb-3 pb-3 border-b-2 border-black">
            <h1 className="text-xl font-bold uppercase tracking-wider print:!text-black">Via da Loja</h1>
            <p className="text-sm font-semibold mt-1">Pedido: #{orderNumberStr}</p>
        </div>

        {/* Customer Section */}
        <div className="mb-3 pb-3 border-b border-dashed border-black">
            <h2 className="font-bold uppercase text-xs mb-1">Cliente</h2>
            {customer ? (
                <>
                    <p className="font-bold text-base">{customer.name}</p>
                    {customer.whatsapp && <p>Tel: {customer.whatsapp}</p>}
                </>
            ) : (
                <p>Cliente Avulso</p>
            )}
        </div>

        {/* Delivery / Date Section */}
        <div className="mb-3 pb-3 border-b border-dashed border-black">
            <h2 className="font-bold uppercase text-xs mb-1">Detalhes</h2>
            <p>Data: <span className="font-bold">{saleDate}</span></p>
            {transaction.scheduledAt && (
                <p className="mt-1 bg-black text-white p-1 inline-block rounded font-bold uppercase text-xs">
                    Para: {format(transaction.scheduledAt.toDate(), "dd/MM 'às' HH:mm")}
                </p>
            )}
            
            <p className="mt-2 font-bold">{transaction.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</p>
            
            {transaction.deliveryType === 'delivery' && customer && (
                <div className="mt-1 p-2 bg-gray-100 rounded border border-gray-300">
                    <p className="text-xs">Endereço:</p>
                    <p className="font-bold leading-tight">
                        {[
                            customer.street,
                            customer.number,
                            customer.complement,
                        ].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs leading-tight">
                        {[
                            customer.neighborhood,
                            customer.city,
                            customer.cep,
                        ].filter(Boolean).join(' - ')}
                    </p>
                </div>
            )}
        </div>

        {/* Items Section */}
        <div className="mb-3 pb-3 border-b-2 border-black">
            <h2 className="font-bold uppercase text-xs mb-2">Pedido</h2>
            <div className="space-y-3">
                {parsedItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                        <div className="font-bold text-base">{item.quantity}x</div>
                        <div>
                            <div className="font-bold text-base leading-tight">{item.name}</div>
                            {item.selectedOptionals && item.selectedOptionals.length > 0 && (
                                <ul className="text-xs ml-2 mt-1 list-disc list-inside">
                                    {item.selectedOptionals.map((opt, i) => (
                                        <li key={i}>{opt.quantity}x {opt.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Payment Section */}
        <div className="text-sm">
            <h2 className="font-bold uppercase text-xs mb-1">Pagamento</h2>
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {(transaction.deliveryFee || 0) > 0 && (
                <div className="flex justify-between">
                    <span>Taxa Entrega:</span>
                    <span>{formatCurrency(transaction.deliveryFee!)}</span>
                </div>
            )}
            
            {(transaction.discount || 0) > 0 && (
                <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(transaction.discount!)}</span>
                </div>
            )}

            <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>{formatCurrency(transaction.amount)}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-dashed border-black">
                {transaction.status === 'pending' || (transaction.downPayment || 0) > 0 ? (
                    <div className="font-bold uppercase text-center bg-black text-white py-1">
                        A Pagar: {formatCurrency(transaction.amount - (transaction.downPayment || 0))}
                    </div>
                ) : (
                    <div className="font-bold uppercase text-center border-2 border-black py-1">
                        Pago via {transaction.paymentMethod?.toUpperCase() || 'N/A'}
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }
);

ProductionReceiptTemplate.displayName = "ProductionReceiptTemplate";
