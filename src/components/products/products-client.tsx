'use client';
import { useProducts } from '@/app/lib/hooks/use-products';
import Loading from '@/app/(main)/loading';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AddProductDialog } from '../dashboard/add-product-dialog';
import { Package, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProductButton } from './delete-product-button';
import { EditProductDialog } from './edit-product-dialog';
import type { Product, ProductCategory } from '@/app/lib/types';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { AddProductCategoryDialog } from './add-product-category-dialog';

interface GroupedProducts {
  [categoryName: string]: Product[];
}

export function ProductsClient() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useProductCategories();

  const loading = productsLoading || categoriesLoading;

  const groupedProducts = useMemo(() => {
    const group: GroupedProducts = { 'Sem Categoria': [] };

    products.forEach(product => {
      const category = categories.find(c => c.id === product.categoryId);
      const categoryName = category ? category.name : 'Sem Categoria';
      if (!group[categoryName]) {
        group[categoryName] = [];
      }
      group[categoryName].push(product);
    });

    // Remove 'Sem Categoria' if it's empty and there are other categories
    if (Object.keys(group).length > 1 && group['Sem Categoria'].length === 0) {
        delete group['Sem Categoria'];
    }

    return group;
  }, [products, categories]);

  if (loading) {
    return <Loading />;
  }

  const categoryOrder = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'Sem Categoria') return 1;
    if (b === 'Sem Categoria') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Package className="w-8 h-8 mr-3" />
            Meus Produtos
        </h1>
        <div className="flex items-center gap-2">
            <AddProductCategoryDialog isPrimaryButton />
            <AddProductDialog />
        </div>
      </div>
      
      {products.length === 0 ? (
         <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
                <p>Nenhum produto cadastrado ainda.</p>
                <p className="text-sm">Clique em "Novo Produto" para começar.</p>
            </CardContent>
         </Card>
      ) : (
        <Accordion type="multiple" defaultValue={categoryOrder} className="w-full space-y-4">
            {categoryOrder.map(categoryName => (
                <AccordionItem value={categoryName} key={categoryName} className="border-b-0">
                    <Card>
                        <AccordionTrigger className="p-6 hover:no-underline">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Tag className="w-5 h-5 text-muted-foreground" />
                                {categoryName}
                                <span className="text-sm font-normal text-muted-foreground">({groupedProducts[categoryName].length})</span>
                            </h2>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {groupedProducts[categoryName].map((product) => (
                                    <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <EditProductDialog product={product} />
                                        <DeleteProductButton productId={product.id} />
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
}
