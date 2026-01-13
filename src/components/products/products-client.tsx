'use client';
import { useProducts } from '@/app/lib/hooks/use-products';
import Loading from '@/app/(admin)/loading-component';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AddProductDialog } from './add-product-dialog';
import { Package, Tag, ImageOff, Star, Percent } from 'lucide-react';
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
import type { Product } from '@/app/lib/types';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { AddProductCategoryDialog } from './add-product-category-dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                                    <TableHead className="w-[80px] hidden sm:table-cell">Imagem</TableHead>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {groupedProducts[categoryName].map((product) => (
                                    <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                                            {product.isFeatured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>}
                                            {product.isPromotion && <Percent className="w-4 h-4 text-red-500 fill-red-500"/>}
                                        </div>
                                        {product.imageUrl ? (
                                           <Image 
                                             src={product.imageUrl} 
                                             alt={product.name} 
                                             width={64} 
                                             height={64} 
                                             className="object-cover w-full h-full"
                                           />
                                        ) : (
                                          <ImageOff className="w-6 h-6 text-muted-foreground" />
                                        )}
                                      </div>
                                    </TableCell>
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

    