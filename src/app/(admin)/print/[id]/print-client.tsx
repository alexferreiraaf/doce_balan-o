'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { doc, getDoc } from 'firebase/firestore';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReceiptTemplate } from '@/components/pdv/receipt-template';
import { ProductionReceiptTemplate } from '@/components/pdv/production-receipt-template';
import { useSearchParams } from 'next/navigation';

interface PrintClientProps {
  id: string;
}

export function PrintClient({ id }: PrintClientProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      if (!user || !firestore) return;
      try {
        const docRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions/${id}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const transactionData = { id: docSnap.id, ...docSnap.data() } as Transaction;
          
          if (transactionData.customerId && !transactionData.customerInfo) {
              const custRef = doc(firestore, `artifacts/${APP_ID}/customers/${transactionData.customerId}`);
              const custSnap = await getDoc(custRef);
              if (custSnap.exists()) {
                  transactionData.customerInfo = { id: custSnap.id, ...custSnap.data() } as any;
              }
          }
          
          setTransaction(transactionData);
          // Wait a bit for render, then print automatically
          setTimeout(() => {
            window.print();
          }, 500);
        } else {
          setError('Pedido não encontrado.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar pedido.');
      } finally {
        setLoading(false);
      }
    }
    fetchTransaction();
  }, [id, user, firestore]);

  const searchParams = useSearchParams();
  const printType = searchParams?.get('type') || 'cliente';

  if (loading) {
    return <div className="p-8 text-center">Carregando cupom...</div>;
  }

  if (error || !transaction) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="print:m-0 print:p-0 mx-auto bg-white flex justify-center" id="receipt">
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                @page { margin: 0; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
            }
        `}} />
        
        <div className="w-[302px] print:w-full print:max-w-[80mm]">
           {printType === 'loja' ? (
               <ProductionReceiptTemplate transaction={transaction} customer={transaction.customerInfo as any} />
           ) : (
               <ReceiptTemplate transaction={transaction} customer={transaction.customerInfo as any} />
           )}
        </div>
        
        <div className="fixed bottom-4 left-0 right-0 text-center print:hidden">
            <button 
                onClick={() => window.print()} 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold shadow-lg hover:opacity-90"
            >
                Imprimir Novamente
            </button>
        </div>
    </div>
  );
}
