import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';
import type { Product, ProductCategory, Transaction, Customer } from '@/app/lib/types';

const getBase64Image = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};

export const generateProductsPDF = async (
  products: Product[],
  categories: ProductCategory[],
  storeName?: string | null
) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('pt-BR');

  // Configurações do cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(190, 24, 93); // Cor primária (rosa/bordô)
  doc.text(storeName || 'Relatório de Produtos', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${date}`, 14, 30);

  // Agrupar produtos por categoria
  const groupedProducts: { [key: string]: Product[] } = {};
  
  categories.forEach(cat => {
    groupedProducts[cat.name] = products.filter(p => p.categoryId === cat.id);
  });

  const uncategorized = products.filter(p => !p.categoryId);
  if (uncategorized.length > 0) {
    groupedProducts['Sem Categoria'] = uncategorized;
  }

  let finalY = 35;

  for (const [categoryName, productsInCategory] of Object.entries(groupedProducts)) {
    if (productsInCategory.length === 0) continue;

    // Título da categoria
    doc.setFontSize(14);
    doc.setTextColor(190, 24, 93);
    doc.text(categoryName, 14, finalY + 10);
    
    const tableData = await Promise.all(productsInCategory.map(async (p) => {
        const imageBase64 = p.imageUrl ? await getBase64Image(p.imageUrl) : null;
        
        let priceDisplay = '';
        if (p.sizes && p.sizes.length > 0) {
            priceDisplay = p.sizes.map(s => `${s.name}: ${formatCurrency(s.price)}`).join('\n');
        } else {
            priceDisplay = p.isPromotion && p.promotionalPrice ? `${formatCurrency(p.promotionalPrice)} (Promoção)` : formatCurrency(p.price);
        }

        return {
            logo: '',
            name: p.name,
            price: priceDisplay,
            available: p.isAvailable ? 'Sim' : 'Não',
            imageBase64: imageBase64
        };
    }));

    autoTable(doc, {
      startY: finalY + 12,
      columns: [
        { header: 'Logo', dataKey: 'logo' },
        { header: 'Produto', dataKey: 'name' },
        { header: 'Preço', dataKey: 'price' },
        { header: 'Disp.', dataKey: 'available' },
      ],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [190, 24, 93] },
      columnStyles: {
        logo: { cellWidth: 20 }, 
        name: { cellWidth: 'auto' },
        price: { cellWidth: 40 },
        available: { cellWidth: 20 },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.dataKey === 'logo') {
          const rowData = data.row.raw as any;
          const imageBase64 = rowData.imageBase64;
          if (imageBase64) {
            try {
                doc.addImage(imageBase64, 'JPEG', data.cell.x + 2, data.cell.y + 2, 16, 16);
            } catch (e) {
                console.error("Error adding image to PDF:", e);
            }
          }
        }
      },
      styles: {
        minCellHeight: 20,
        valign: 'middle'
      },
      margin: { left: 14, right: 14 },
    });



    finalY = (doc as any).lastAutoTable.finalY;
    
    // Deixar um espaço antes da próxima categoria
    if (finalY > 240) { // Reduzi um pouco para garantir espaço para a próxima categoria e tabela
        doc.addPage();
        finalY = 20;
    }
  }

  doc.save('relatorio-produtos.pdf');
};

export const generateFinancialReportPDF = async (
  transactions: Transaction[],
  dateRange: { startDate: Date; endDate: Date },
  storeName?: string | null
) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const startStr = dateRange.startDate.toLocaleDateString('pt-BR');
  const endStr = dateRange.endDate.toLocaleDateString('pt-BR');

  // 1. Calculations (matching summary-report.tsx exactly)
  const paidIncome = transactions.filter(
    t => t.type === 'income' && (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado'))
  );
  const expenses = transactions.filter(t => t.type === 'expense');
  const pending = transactions.filter(
    t => t.type === 'income' && (t.status === 'pending' || (!t.status && t.paymentMethod === 'fiado'))
  );

  const totalIncome = paidIncome.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  
  let totalCmv = 0;
  paidIncome.forEach(t => {
     if (t.cartItems) {
         t.cartItems.forEach(item => {
             totalCmv += (item.cost || 0) * item.quantity;
         });
     }
  });

  const totalPending = pending.reduce((sum, t) => {
      const remainingAmount = Number(t.amount || 0) - Number(t.downPayment || 0);
      return sum + remainingAmount;
  }, 0);
  
  const grossProfit = totalIncome - totalCmv;
  const balance = grossProfit - totalExpense;

  const groupByCategory = (trans: Transaction[]) => {
    return trans.reduce((acc, t) => {
      const categoryName = t.category || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount || 0);
      return acc;
    }, {} as Record<string, number>);
  };

  const incomeByCategory = groupByCategory(paidIncome);
  const expenseByCategory = groupByCategory(expenses);

  const topIncomeCategories = Object.entries(incomeByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, total]) => ({ name, total }));

  const topExpenseCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, total]) => ({ name, total }));

  // 2. Build the PDF Document
  // Title Banner
  doc.setFillColor(190, 24, 93); // Primary theme color: Be185d
  doc.rect(0, 0, 210, 40, 'F');

  const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/icons/icon-192x192.png' : '';
  const logoBase64 = logoUrl ? await getBase64Image(logoUrl) : null;

  doc.setTextColor(255, 255, 255);
  if (logoBase64) {
      try {
          doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
      } catch (e) {
          console.error("Error adding logo:", e);
      }
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(storeName || 'DOÇURAS DA FRAN', 48, 18);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório Financeiro do Período: ${startStr} a ${endStr}`, 48, 26);
      doc.text(`Gerado em: ${dateStr}`, 48, 32);
  } else {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(storeName || 'DOÇURAS DA FRAN', 14, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório Financeiro do Período: ${startStr} a ${endStr}`, 14, 28);
      doc.text(`Gerado em: ${dateStr}`, 14, 34);
  }

  // Financial Summary Table
  doc.setFontSize(14);
  doc.setTextColor(190, 24, 93);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro', 14, 52);

  const summaryData = [
    { label: 'Faturamento', value: formatCurrency(totalIncome) },
    { label: 'Custo (CMV)', value: formatCurrency(totalCmv) },
    { label: 'Lucro Bruto', value: formatCurrency(grossProfit) },
    { label: 'Despesas', value: formatCurrency(totalExpense) },
    { label: 'Lucro Líquido', value: formatCurrency(balance) },
    { label: 'Vendas A Prazo (Fiado)', value: formatCurrency(totalPending) },
  ];

  autoTable(doc, {
    startY: 56,
    head: [['Métrica / Indicador', 'Valor']],
    body: summaryData.map(d => [d.label, d.value]),
    theme: 'grid',
    headStyles: { fillColor: [190, 24, 93] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 'auto' },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 50 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index === 4) {
        if (balance >= 0) {
          doc.setTextColor(5, 150, 105);
        } else {
          doc.setTextColor(220, 38, 38);
        }
      }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // Top Categories
  doc.setFontSize(14);
  doc.setTextColor(190, 24, 93);
  doc.setFont('helvetica', 'bold');
  doc.text('Maiores Fontes de Receita e Despesa', 14, currentY);

  const categoriesBody = [];
  const maxCats = Math.max(topIncomeCategories.length, topExpenseCategories.length);
  for (let i = 0; i < maxCats; i++) {
    const inc = topIncomeCategories[i];
    const exp = topExpenseCategories[i];
    categoriesBody.push([
      inc ? inc.name : '-',
      inc ? formatCurrency(inc.total) : '-',
      exp ? exp.name : '-',
      exp ? formatCurrency(exp.total) : '-',
    ]);
  }

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Receita - Categoria', 'Valor', 'Despesa - Categoria', 'Valor']],
    body: categoriesBody,
    theme: 'striped',
    headStyles: { fillColor: [190, 24, 93] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'right', cellWidth: 40 },
      2: { cellWidth: 50 },
      3: { halign: 'right', cellWidth: 40 },
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  if (currentY > 180) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(190, 24, 93);
  doc.setFont('helvetica', 'bold');
  doc.text('Histórico de Lançamentos do Período', 14, currentY);

  const transactionsData = transactions.map(t => {
    let typeDisplay = t.type === 'income' ? 'Receita' : 'Despesa';
    let methodDisplay = '';
    if (t.paymentMethod === 'pix') methodDisplay = 'PIX';
    else if (t.paymentMethod === 'dinheiro') methodDisplay = 'Dinheiro';
    else if (t.paymentMethod === 'cartao') methodDisplay = 'Cartão';
    else if (t.paymentMethod === 'fiado') methodDisplay = 'Fiado';
    else methodDisplay = '-';

    let statusDisplay = '';
    if (t.status === 'paid') statusDisplay = 'Pago';
    else if (t.status === 'pending') statusDisplay = 'Pendente';
    else if (t.status === 'cancelled') statusDisplay = 'Cancelado';
    else statusDisplay = '-';

    let dateFormatted = formatDate(t.dateMs);

    return {
      date: dateFormatted,
      desc: t.description || t.category || '-',
      type: typeDisplay,
      method: methodDisplay,
      status: statusDisplay,
      amount: (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount),
      rawType: t.type
    };
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Data', 'Descrição / Categoria', 'Tipo', 'Meio Pagto', 'Status', 'Valor']],
    body: transactionsData.map(t => [t.date, t.desc, t.type, t.method, t.status, t.amount]),
    theme: 'striped',
    headStyles: { fillColor: [190, 24, 93] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const rawRow = transactionsData[data.row.index];
        if (rawRow.rawType === 'income') {
          doc.setTextColor(5, 150, 105);
        } else {
          doc.setTextColor(220, 38, 38);
        }
      }
    }
  });

  doc.save(`relatorio-financeiro-${startStr.replace(/\//g, '-')}-a-${endStr.replace(/\//g, '-')}.pdf`);
};

export const generateTermSalesPDF = async (
  transactions: Transaction[],
  customers: Customer[],
  dateRange: { startDate: Date; endDate: Date },
  storeName?: string | null
) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const startStr = dateRange.startDate.toLocaleDateString('pt-BR');
  const endStr = dateRange.endDate.toLocaleDateString('pt-BR');

  // Title Banner in Pink/Theme Color
  doc.setFillColor(190, 24, 93); // Pink/Bordo
  doc.rect(0, 0, 210, 40, 'F');

  const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/icons/icon-192x192.png' : '';
  const logoBase64 = logoUrl ? await getBase64Image(logoUrl) : null;

  doc.setTextColor(255, 255, 255);
  if (logoBase64) {
      try {
          doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
      } catch (e) {
          console.error("Error adding logo:", e);
      }
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(storeName || 'DOÇURAS DA FRAN', 48, 18);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório de Vendas a Prazo (Contas em Aberto)`, 48, 26);
      doc.text(`Período do Relatório: ${startStr} a ${endStr}   |   Gerado em: ${dateStr}`, 48, 32);
  } else {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(storeName || 'DOÇURAS DA FRAN', 14, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório de Vendas a Prazo (Contas em Aberto)`, 14, 28);
      doc.text(`Período do Relatório: ${startStr} a ${endStr}   |   Gerado em: ${dateStr}`, 14, 34);
  }

  // Filter pending/fiado transactions
  const pendingTransactions = transactions.filter(
    t => t.type === 'income' && (t.status === 'pending' || (!t.status && t.paymentMethod === 'fiado'))
  );

  const totalPendingAmount = pendingTransactions.reduce((sum, t) => {
    const remainingAmount = Number(t.amount || 0) - Number(t.downPayment || 0);
    return sum + remainingAmount;
  }, 0);

  // Total Debt Summary Box
  doc.setFillColor(253, 242, 248);
  doc.rect(14, 48, 182, 18, 'F');
  doc.setDrawColor(190, 24, 93);
  doc.rect(14, 48, 182, 18, 'S');

  doc.setFontSize(11);
  doc.setTextColor(190, 24, 93);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL A RECEBER EM ABERTO NO PERÍODO:`, 20, 59);

  doc.setFontSize(14);
  doc.text(formatCurrency(totalPendingAmount), 140, 60);

  let currentY = 76;

  doc.setFontSize(14);
  doc.setTextColor(190, 24, 93);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalhamento de Devedores e Prazos', 14, currentY);

  const calculateDaysOwing = (dateMs: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = new Date(dateMs);
    transactionDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - transactionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return '1 dia';
    return `${diffDays} dias`;
  };

  const termSalesData = pendingTransactions.map(t => {
    const customer = customers.find(c => c.id === t.customerId) || t.customerInfo;
    const customerName = customer ? customer.name : (t.description || 'Cliente Não Identificado');
    const totalVal = Number(t.amount || 0);
    const paidVal = Number(t.downPayment || 0);
    const remainingVal = totalVal - paidVal;
    const timeOwing = calculateDaysOwing(t.dateMs);
    const formattedDate = formatDate(t.dateMs);

    return {
      date: formattedDate,
      customer: customerName,
      desc: t.description || 'Venda',
      total: formatCurrency(totalVal),
      paid: formatCurrency(paidVal),
      due: formatCurrency(remainingVal),
      time: timeOwing
    };
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Data', 'Devedor (Cliente)', 'Descrição', 'Valor Total', 'Sinal Pago', 'Valor Aberto', 'Tempo']],
    body: termSalesData.map(t => [t.date, t.customer, t.desc, t.total, t.paid, t.due, t.time]),
    theme: 'grid',
    headStyles: { fillColor: [190, 24, 93] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 25 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 20 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        doc.setTextColor(220, 38, 38);
      }
    }
  });

  doc.save(`vendas-a-prazo-${startStr.replace(/\//g, '-')}-a-${endStr.replace(/\//g, '-')}.pdf`);
};

