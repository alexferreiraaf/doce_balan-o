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
import { formatCurrency } from '@/lib/utils';
import type { Transaction, Customer, Product } from '@/app/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';
import { useMemo } from 'react';
import { useProducts } from '@/app/lib/hooks/use-products';


interface SaleReceiptDialogProps {
  transaction: Transaction;
  customer?: Customer;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to parse cart items from the transaction description
const parseCartFromDescription = (description: string, allProducts: Product[]): { name: string; quantity: number, price: number }[] => {
    // Example description: "1x Bolo de Chocolate, 2x Torta de Limão"
    if (!description.includes('x ')) return [];
    
    return description.split(', ').map(part => {
        const match = part.match(/(\d+)x (.*)/);
        if (match) {
            const quantity = parseInt(match[1], 10);
            const name = match[2];
            const product = allProducts.find(p => p.name === name);
            return { quantity, name, price: product?.price || 0 };
        }
        return null;
    }).filter((item): item is { name: string; quantity: number, price: number } => item !== null);
};


export function SaleReceiptDialog({
  transaction,
  customer,
  isOpen,
  onOpenChange,
}: SaleReceiptDialogProps) {
  const { toast } = useToast();
  const { products } = useProducts();

  const receiptDetails = useMemo(() => {
    if (!transaction) return null;

    const saleDate = transaction.timestamp?.toDate ? format(transaction.timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida';
    const orderNumber = transaction.id.slice(-6).toUpperCase();

    // Reconstruct cart from description
    const parsedItems = parseCartFromDescription(transaction.description, products);
    const subtotal = transaction.amount - (transaction.deliveryFee || 0) + (transaction.discount || 0);

    const receiptLines = [
      'receipt',
      '***************************',
      '      COMPROVANTE DE VENDA       ',
      '***************************',
      `Pedido: #${orderNumber}`,
      `Data: ${saleDate}`,
      customer ? `Cliente: ${customer.name}` : '',
      '',
      '--- Itens ---',
      ...parsedItems.map(item => `${item.quantity}x ${item.name} (${formatCurrency(item.price)})`),
      '',
      '--- Totais ---',
      `Subtotal: ${formatCurrency(subtotal)}`,
      transaction.discount ? `Desconto: -${formatCurrency(transaction.discount)}` : '',
      transaction.deliveryFee ? `Taxa de Entrega: ${formatCurrency(transaction.deliveryFee)}` : '',
      `TOTAL: ${formatCurrency(transaction.amount)}`,
      '',
      transaction.downPayment && transaction.downPayment > 0 ? `Entrada: ${formatCurrency(transaction.downPayment)}` : '',
      transaction.status === 'pending' ? `VALOR PENDENTE: ${formatCurrency(transaction.amount - (transaction.downPayment || 0))}` : '',
      '',
      'Obrigado pela preferência!',
      'Doçuras da Fran',
    ];

    return receiptLines.filter(line => line !== '').join('\n');
  }, [transaction, customer, products]);


  if (!transaction) {
    return null;
  }
  
  const receiptText = receiptDetails || '';

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
