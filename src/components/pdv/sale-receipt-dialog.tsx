'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import type { Transaction, Customer, Product } from '@/app/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';

interface CartItem extends Product {
  quantity: number;
}

interface SaleReceiptDialogProps {
  transaction: Transaction;
  customer?: Customer;
  cart?: CartItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleReceiptDialog({
  transaction,
  customer,
  cart,
  isOpen,
  onOpenChange,
}: SaleReceiptDialogProps) {
  const { toast } = useToast();

  if (!transaction) {
    return null;
  }

  const saleDate = transaction.timestamp?.toDate ? format(transaction.timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida';
  const orderNumber = transaction.id.slice(-6).toUpperCase();

  const receiptLines = [
    'receipt',
    '************************',
    '      COMPROVANTE       ',
    '************************',
    `Pedido: #${orderNumber}`,
    `Data: ${saleDate}`,
    customer ? `Cliente: ${customer.name}` : '',
    '',
    '--- Itens ---',
    ...(cart?.map(item => `${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`) || [transaction.description]),
    '',
    '--- Totais ---',
    `Subtotal: ${formatCurrency(transaction.amount - (transaction.deliveryFee || 0) + (transaction.discount || 0))}`,
    transaction.discount ? `Desconto: -${formatCurrency(transaction.discount)}` : '',
    transaction.deliveryFee ? `Taxa de Entrega: ${formatCurrency(transaction.deliveryFee)}` : '',
    `TOTAL: ${formatCurrency(transaction.amount)}`,
    '',
    transaction.downPayment ? `Entrada: ${formatCurrency(transaction.downPayment)}` : '',
    transaction.status === 'pending' ? `VALOR PENDENTE: ${formatCurrency(transaction.amount - (transaction.downPayment || 0))}` : '',
    '',
    'Obrigado pela preferência!',
    'Doçuras da Fran',
  ];

  const receiptText = receiptLines.filter(line => line !== '').join('\n');

  const handleShare = async () => {
    const shareData = {
      title: 'Comprovante de Venda',
      text: receiptText.replace('receipt\n',''),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: 'Compartilhado!',
          description: 'O comprovante foi enviado com sucesso.',
        });
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast({
          title: 'Copiado!',
          description: 'O comprovante foi copiado para a área de transferência.',
        });
      }
    } catch (err) {
       console.error("Share/Copy failed", err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível compartilhar ou copiar o comprovante.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Venda Finalizada com Sucesso!</DialogTitle>
          <DialogDescription>
            Aqui está o comprovante da venda. Você pode compartilhá-lo com seu cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
            {receiptText.replace('receipt\n','')}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
