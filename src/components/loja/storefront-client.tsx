'use client';

import { useProducts } from '@/app/lib/hooks/use-products';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import type { Product, ProductCategory } from '@/app/lib/types';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Package, ShoppingCart, Tag } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { WhiskIcon } from '../icons/whisk-icon';

interface GroupedProducts {
  [categoryName: string]: Product[];
}

export function StorefrontClient() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useProductCategories();

  const loading = productsLoading || categoriesLoading;

  const groupedProducts = useMemo(() => {
    const group: GroupedProducts = {};

    categories.forEach(cat => {
      group[cat.name] = [];
    });
    group['Outros'] = [];

    products.forEach(product => {
      const category = categories.find(c => c.id === product.categoryId);
      const categoryName = category ? category.name : 'Outros';
      group[categoryName].push(product);
    });

    // Clean up empty categories
    Object.keys(group).forEach(key => {
      if (group[key].length === 0) {
        delete group[key];
      }
    });

    return group;
  }, [products, categories]);
  
  const categoryOrder = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'Outros') return 1;
    if (b === 'Outros') return -1;
    return a.localeCompare(b);
  });

  if (loading) {
    return null; // The loading skeleton is handled by Suspense
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <WhiskIcon className="w-16 h-16 text-primary" />
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">Cardápio Doçuras da Fran</h1>
                <p className="text-muted-foreground mt-1">Escolha seus doces favoritos e faça seu pedido!</p>
            </div>
        </div>
        <Button size="lg" className="w-full sm:w-auto">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Meu Carrinho
        </Button>
      </header>

      {categoryOrder.length === 0 ? (
        <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Nenhum produto no cardápio</h2>
            <p className="mt-2 text-muted-foreground">Volte em breve para ver nossas delícias!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {categoryOrder.map(categoryName => (
            <section key={categoryName}>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
                <Tag className="w-6 h-6 text-primary/80" />
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedProducts[categoryName].map(product => (
                  <Card key={product.id} className="overflow-hidden flex flex-col group">
                    <CardHeader className="p-0">
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package className="w-16 h-16 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                      <div className="flex justify-between items-end mt-4">
                        <p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
                        <Button variant="outline" size="sm">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Pedir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
