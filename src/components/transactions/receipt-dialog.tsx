import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer } from 'lucide-react';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/app/lib/hooks/use-settings';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReceiptDialogProps {
  transaction: Transaction;
  children?: React.ReactNode;
}

export function ReceiptDialog({ transaction, children }: ReceiptDialogProps) {
  const { settings } = useSettings();
  const { customers } = useCustomers();
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const receiptElement = document.getElementById('receipt-container');
    if (!receiptElement) return;

    try {
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const fileName = `comprovante-${transaction.orderNumber || 'venda'}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Comprovante de Venda',
              text: 'Aqui está o seu comprovante da Doçuras da Fran!',
              files: [file],
            });
            return;
          } catch (shareError: any) {
             // User cancelled share or other error, fallback to download/clipboard below if needed
             if (shareError.name !== 'AbortError') {
                 console.error('Share failed', shareError);
             } else {
                 return;
             }
          }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast({ title: 'Copiado!', description: 'Comprovante copiado como imagem.' });
        } catch (e) {
            // Final fallback: download image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: 'Baixado!', description: 'O comprovante foi salvo no seu dispositivo.' });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating receipt image:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar a imagem do comprovante.' });
    }
  };

  const customer = transaction.customerId ? customers.find(c => c.id === transaction.customerId) : (transaction.customerInfo || null);
  
  let tDate: Date;
  const dateVal = transaction.timestamp || transaction.dateMs;
  if (typeof dateVal === 'number') {
    tDate = new Date(dateVal);
  } else if (dateVal && typeof (dateVal as any).toDate === 'function') {
    tDate = (dateVal as any).toDate();
  } else {
    tDate = new Date(dateVal as any);
  }

  const formattedDate = format(tDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Ver Comprovante
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-0">
        <DialogHeader>
          <DialogTitle className="print:hidden">Comprovante de Venda</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 bg-white text-black font-mono text-sm rounded-md mx-auto w-full max-w-[320px] shadow-sm border border-gray-200" id="receipt-container">
          <div className="text-center mb-4 flex flex-col items-center">
            <img src="/icons/icon-192x192.png" alt="Logo" className="w-12 h-12 mb-2 object-contain" />
            <h2 className="font-bold text-xl mb-1 text-pink-500">{settings?.storeName || 'Doçuras da Fran'}</h2>
            <p className="text-sm">Comprovante de Venda</p>
          </div>

          <div className="border-b border-dashed border-gray-400 mb-2"></div>

          <div className="py-2 space-y-1">
            {transaction.orderNumber && (
              <div className="flex justify-between">
                <span>Pedido:</span>
                <span>#{String(transaction.orderNumber).padStart(4, '0')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Data:</span>
              <span>{formattedDate}</span>
            </div>
            {customer && (
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span>{customer.name}</span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-gray-400 mb-2"></div>

          <div className="py-2">
            <div className="flex justify-between font-bold mb-2">
               <span className="flex-1">Item</span>
               <span className="w-8 text-center">Qtd</span>
               <span className="w-16 text-right">V. Un.</span>
               <span className="w-16 text-right">Total</span>
            </div>

            {transaction.cartItems && transaction.cartItems.length > 0 ? (
              transaction.cartItems.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between items-start">
                    <span className="flex-1 pr-2 break-words max-w-[140px]">{item.name}</span>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <span className="w-16 text-right">{formatCurrency(item.price).replace('R$', '').trim()}</span>
                    <span className="w-16 text-right">{formatCurrency(item.price * item.quantity).replace('R$', '').trim()}</span>
                  </div>
                  {item.selectedOptionals && item.selectedOptionals.map((opt, oIdx) => (
                    <div key={oIdx} className="flex justify-between items-start text-gray-600">
                      <span className="flex-1 pr-2 pl-2 break-words max-w-[140px]">+ {opt.name}</span>
                      <span className="w-8 text-center">{opt.quantity}</span>
                      <span className="w-16 text-right">{formatCurrency(opt.price).replace('R$', '').trim()}</span>
                      <span className="w-16 text-right">{formatCurrency(opt.price * opt.quantity).replace('R$', '').trim()}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="flex justify-between items-start mb-2">
                <span className="flex-1 pr-2 break-words max-w-[140px]">{transaction.description}</span>
                <span className="w-8 text-center">1</span>
                <span className="w-16 text-right">{formatCurrency(transaction.amount).replace('R$', '').trim()}</span>
                <span className="w-16 text-right">{formatCurrency(transaction.amount).replace('R$', '').trim()}</span>
              </div>
            )}
            
            {transaction.deliveryFee ? (
               <div className="flex justify-between items-start mb-2">
                <span className="flex-1 pr-2">Taxa de Entrega</span>
                <span className="w-8 text-center">1</span>
                <span className="w-16 text-right">{formatCurrency(transaction.deliveryFee).replace('R$', '').trim()}</span>
                <span className="w-16 text-right">{formatCurrency(transaction.deliveryFee).replace('R$', '').trim()}</span>
               </div>
            ) : null}
            
            {transaction.discount ? (
               <div className="flex justify-between items-start mb-2 text-gray-700">
                <span className="flex-1 pr-2">Desconto</span>
                <span className="w-8 text-center">-</span>
                <span className="w-16 text-right">-</span>
                <span className="w-16 text-right">-{formatCurrency(transaction.discount).replace('R$', '').trim()}</span>
               </div>
            ) : null}
          </div>

          <div className="border-b border-dashed border-gray-400 mb-2"></div>

          <div className="py-2">
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span>{formatCurrency(transaction.amount)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-400 mb-2"></div>

          <div className="py-2">
            <div className="flex justify-between font-bold text-sm">
              <span>PAGAMENTO:</span>
              <span className="uppercase">{transaction.paymentMethod || 'Não informado'}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-400 mb-4"></div>
          
          <div className="text-center text-sm mb-4">
            <p>Obrigado pela preferência!</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4 print:hidden flex-wrap">
          <Button variant="outline" onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            Compartilhar Imagem
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
