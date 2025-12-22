'use client';
import { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Transaction, Customer } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Share2, FileDown } from 'lucide-react';
import { ReceiptTemplate } from './receipt-template';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';


interface SaleReceiptDialogProps {
  transaction: Transaction;
  customer?: Customer;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}


export function SaleReceiptDialog({
  transaction,
  customer,
  isOpen,
  onOpenChange,
}: SaleReceiptDialogProps) {
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const storage = getStorage();
  const firestore = useFirestore();
  const { user } = useUser();

  const generatePdf = async (): Promise<Blob> => {
    const input = receiptRef.current;
    if (!input) {
        throw new Error("Receipt element not found");
    }
    const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    return pdf.output('blob');
  };

  const uploadReceipt = async (pdfBlob: Blob, transactionId: string) => {
    if (!user) return;
    const receiptStorageRef = storageRef(storage, `receipts/${user.uid}/${transactionId}.pdf`);
    await uploadBytes(receiptStorageRef, pdfBlob);
    const downloadUrl = await getDownloadURL(receiptStorageRef);
    return downloadUrl;
  }

  const updateTransactionWithReceipt = async (transactionId: string, receiptUrl: string) => {
      if (!user || !firestore) return;
      const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions/${transactionId}`);
      await updateDoc(transactionRef, { receiptUrl });
  }

  useEffect(() => {
    if (isOpen && transaction && transaction.customerId && !transaction.receiptUrl) {
      const saveReceipt = async () => {
        try {
          // A small delay to ensure the component is fully rendered
          await new Promise(resolve => setTimeout(resolve, 500));
          const pdfBlob = await generatePdf();
          const url = await uploadReceipt(pdfBlob, transaction.id);
          if (url) {
            await updateTransactionWithReceipt(transaction.id, url);
             toast({
                title: 'Comprovante Salvo',
                description: 'O comprovante foi salvo no histórico do cliente.',
            });
          }
        } catch (error) {
          console.error("Failed to save receipt:", error);
           toast({
            variant: 'destructive',
            title: 'Erro ao Salvar Comprovante',
            description: 'Não foi possível salvar o comprovante automaticamente.',
          });
        }
      };
      saveReceipt();
    }
  }, [isOpen, transaction]);


  if (!transaction) {
    return null;
  }


  const handleShare = async () => {
    try {
      const pdfBlob = await generatePdf();
      const pdfFile = new File([pdfBlob], `comprovante-doçuras-da-fran.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Comprovante de Venda',
          text: `Segue o comprovante da sua compra na Doçuras da Fran.`,
          files: [pdfFile],
        });
        toast({
          title: 'Compartilhado!',
          description: 'O comprovante foi enviado com sucesso.',
        });
      } else {
        throw new Error("Navigator.share not supported for files.");
      }
    } catch (err) {
       console.error("Share failed", err);
       handleDownload();
    }
  };

  const handleDownload = async () => {
     try {
        const pdfBlob = await generatePdf();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `comprovante-doçuras-da-fran.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: 'Download iniciado!',
            description: 'Seu comprovante está sendo baixado.',
        });
     } catch (err) {
        console.error("Download failed", err);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível gerar o PDF para download.',
        });
     }
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Venda Finalizada!</DialogTitle>
          <DialogDescription>
            Abaixo está o comprovante da venda. Você pode compartilhá-lo com seu cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
             <div className="bg-white">
                <ReceiptTemplate ref={receiptRef} transaction={transaction} customer={customer} />
             </div>
          </div>
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {canShare ? (
            <Button onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
            </Button>
          ) : (
            <Button onClick={handleDownload}>
                <FileDown className="mr-2 h-4 w-4" />
                Baixar PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
