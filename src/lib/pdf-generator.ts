import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';
import type { Product, ProductCategory } from '@/app/lib/types';

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
        return {
            logo: '',
            name: p.name,
            price: p.isPromotion && p.promotionalPrice ? `${formatCurrency(p.promotionalPrice)} (Promoção)` : formatCurrency(p.price),
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

