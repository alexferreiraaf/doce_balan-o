'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useProducts } from '@/app/lib/hooks/use-products';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Product, ProductCategory, Transaction, Customer } from '@/app/lib/types';
import { MinusCircle, PlusCircle, Search, ShoppingCart, Package, ImageOff } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '../ui/badge';
import { AddTransactionSheet } from '../dashboard/add-transaction-sheet';
import { SaleReceiptDialog } from './sale-receipt-dialog';

interface CartItem extends Product {
  quantity: number;
}

interface ProductFiltersProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

function ProductFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onSearchTermChange,
}: ProductFiltersProps) {
  return (
    <Card className="p-3 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Procurar delícias..."
            className="pl-10 h-11 text-base"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className={cn("rounded-full h-11", selectedCategory !== 'all' && 'bg-card')}
              onClick={() => onSelectCategory('all')}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className={cn("rounded-full h-11", selectedCategory !== category.id && 'bg-card')}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
        </div>
      </div>
    </Card>
  );
}


function POSLoading() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
            <div className="lg:col-span-2">
                 <ScrollArea className="h-full pr-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(12)].map((_, i) => (
                             <Card key={i} className="animate-pulse">
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-5 w-1/2" />
                                </div>
                             </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <div className="lg:col-span-1">
                 <Card className="h-full flex flex-col p-4 animate-pulse">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    <div className="flex-grow space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="mt-auto pt-4 border-t">
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

function ProductGrid({ products, onProductClick }: { products: Product[], onProductClick: (product: Product) => void }) {
    if (products.length === 0) {
        return (
            <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary transition-all flex flex-col overflow-hidden"
                onClick={() => onProductClick(product)}
              >
                <div className="w-full h-32 bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                        <Image 
                            src={product.imageUrl} 
                            alt={product.name} 
                            width={150} 
                            height={150} 
                            className="object-cover w-full h-full" 
                        />
                    ) : (
                        <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                </div>
                <div className="p-3 flex flex-col justify-between h-full flex-grow">
                  <h3 className="font-semibold text-card-foreground leading-tight">{product.name}</h3>
                  <p className="text-primary font-bold mt-2">{formatCurrency(product.price)}</p>
                </div>
              </Card>
            ))}
        </div>
    );
}

function CartView({ cart, onUpdateQuantity, onFinalize, total }: { cart: CartItem[], onUpdateQuantity: (id: string, qty: number) => void, onFinalize: () => void, total: number}) {
     return (
        <Card className="flex flex-col max-h-full">
          <div className="p-4 border-b flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6"/> Venda Atual</h2>
          </div>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground h-full flex items-center justify-center py-10">
                  <p>Selecione produtos para iniciar uma venda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <div className="flex-grow">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                          <MinusCircle className="w-4 h-4 text-destructive" />
                        </Button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                          <PlusCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 mt-auto border-t space-y-3 flex-shrink-0">
             <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
             </div>
            <Button className="w-full h-12 text-lg" disabled={cart.length === 0} onClick={onFinalize}>
              Finalizar Venda
            </Button>
          </div>
        </Card>
    );
}

export function POSClient() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useProductCategories();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFinalizeSheet, setShowFinalizeSheet] = useState(false);
  const [lastSale, setLastSale] = useState<{transaction: Transaction, customer?: Customer} | null>(null);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState('products');

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (selectedCategory === 'all') return true;
        return product.categoryId === selectedCategory;
      })
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [products, selectedCategory, searchTerm]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
     if(isMobile) setMobileTab('cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    });
  };
  
  const handleFinalize = () => {
    if (cart.length > 0) {
      setShowFinalizeSheet(true);
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    setShowFinalizeSheet(open);
  }

  const handleSaleFinalized = (transaction: Transaction, customer?: Customer) => {
    setShowFinalizeSheet(false);
    setLastSale({transaction, customer});
    setCart([]); // Clear cart after sale is finalized
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const loading = productsLoading || categoriesLoading;
  if (loading) {
    return <POSLoading />;
  }

  if (isMobile) {
      return (
          <>
            <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-col h-full">
                <div className="p-4 pb-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="products"><Package className="w-4 h-4 mr-2" />Produtos</TabsTrigger>
                        <TabsTrigger value="cart">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Venda
                            {cart.length > 0 && <Badge className="ml-2">{cart.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="products" className="flex-grow overflow-hidden">
                    <div className="p-4 h-full flex flex-col gap-4">
                        <ProductFilters
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            searchTerm={searchTerm}
                            onSearchTermChange={setSearchTerm}
                        />
                        <ScrollArea className="flex-grow">
                            <ProductGrid products={filteredProducts} onProductClick={addToCart} />
                        </ScrollArea>
                    </div>
                </TabsContent>
                <TabsContent value="cart" className="flex-grow p-4 overflow-hidden">
                    <CartView cart={cart} onUpdateQuantity={updateQuantity} onFinalize={handleFinalize} total={total} />
                </TabsContent>
            </Tabs>
            <AddTransactionSheet
                open={showFinalizeSheet}
                onOpenChange={handleSheetOpenChange}
                cart={cart}
                cartTotal={total}
                onSaleFinalized={handleSaleFinalized}
            />
            {lastSale && (
                <SaleReceiptDialog
                    transaction={lastSale.transaction}
                    customer={lastSale.customer}
                    isOpen={!!lastSale}
                    onOpenChange={(open) => { if (!open) setLastSale(null); }}
                />
            )}
        </>
      )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
      {/* Product Selection */}
      <div className="lg:col-span-2 bg-card border rounded-lg flex flex-col">
        <ProductFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
        />
        <ScrollArea className="flex-grow p-4">
          <ProductGrid products={filteredProducts} onProductClick={addToCart} />
        </ScrollArea>
      </div>

      {/* Sale Summary */}
      <div className="lg:col-span-1">
        <CartView cart={cart} onUpdateQuantity={updateQuantity} onFinalize={handleFinalize} total={total} />
      </div>

      <AddTransactionSheet
        open={showFinalizeSheet}
        onOpenChange={handleSheetOpenChange}
        cart={cart}
        cartTotal={total}
        onSaleFinalized={handleSaleFinalized}
      />

       {lastSale && (
          <SaleReceiptDialog
              transaction={lastSale.transaction}
              customer={lastSale.customer}
              isOpen={!!lastSale}
              onOpenChange={(open) => { if (!open) setLastSale(null); }}
          />
      )}
    </div>
  );
}
