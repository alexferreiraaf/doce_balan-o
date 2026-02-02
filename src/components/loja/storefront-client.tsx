'use client';

import { useProducts } from '@/app/lib/hooks/use-products';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import type { AppSettings, DayOfWeek, Product } from '@/app/lib/types';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Package, ShoppingCart, Tag, Trash2, X, Plus, Minus, Flame, Clock, Percent, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { WhiskIcon } from '../icons/whisk-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { AddTransactionSheet } from '../dashboard/add-transaction-sheet';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettings } from '@/app/lib/hooks/use-settings';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ThemeToggle } from '../layout/theme-toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { cn } from '@/lib/utils';

interface CartItem extends Product {
  quantity: number;
}

const weekDayMap: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const getStoreStatus = (settings?: AppSettings): { isOpen: boolean; message: string } => {
  if (!settings?.openingHours) {
    return { isOpen: true, message: '' }; // Default to open if not configured
  }

  const now = new Date();
  const currentDay = weekDayMap[now.getDay()];
  const todaySettings = settings.openingHours[currentDay];

  if (!todaySettings || !todaySettings.enabled) {
    return { isOpen: false, message: 'Hoje estamos fechados.' };
  }

  const [openHour, openMinute] = todaySettings.open.split(':').map(Number);
  const [closeHour, closeMinute] = todaySettings.close.split(':').map(Number);
  
  const openTime = new Date();
  openTime.setHours(openHour, openMinute, 0, 0);

  const closeTime = new Date();
  closeTime.setHours(closeHour, closeMinute, 0, 0);

  if (now >= openTime && now < closeTime) {
    return { isOpen: true, message: '' };
  } else if (now < openTime) {
    return { isOpen: false, message: `Abrimos hoje às ${todaySettings.open}.` };
  } else {
     return { isOpen: false, message: `Fechamos hoje às ${todaySettings.close}.` };
  }
};


export function StorefrontClient() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useProductCategories();
  const { settings, loading: settingsLoading } = useSettings();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [showPromotions, setShowPromotions] = useState(false);

  const loading = productsLoading || categoriesLoading || settingsLoading;
  const storeStatus = getStoreStatus(settings);

  const { promotionalProducts, featuredProducts, bestSellerThreshold, regularProducts } = useMemo(() => {
    if (products.length === 0) {
      return { promotionalProducts: [], featuredProducts: [], bestSellerThreshold: 0, regularProducts: [] };
    }

    const promotions = products.filter(p => p.isPromotion);
    const featured = products.filter(p => p.isFeatured).slice(0, 4);

    const salesCounts = products.map(p => p.salesCount || 0).sort((a, b) => b - a);
    const threshold = salesCounts.length > 3 ? salesCounts[2] : 0;
    
    return { 
      promotionalProducts: promotions,
      featuredProducts: featured,
      bestSellerThreshold: threshold,
      regularProducts: products, // All products for the main grid
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return regularProducts;
    }
    return regularProducts.filter(p => p.categoryId === selectedCategoryId);
  }, [regularProducts, selectedCategoryId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.promotionalPrice ?? item.price) * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    if (!product.isAvailable) {
      toast({
       variant: 'destructive',
       title: 'Produto em Falta!',
       description: 'Este item não está disponível no momento.',
     });
     return;
   }
    if (!storeStatus.isOpen) {
       toast({
        variant: 'destructive',
        title: 'Loja Fechada!',
        description: storeStatus.message,
      });
      return;
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart(currentCart => {
      if (quantity <= 0) {
        return currentCart.filter(item => item.id !== productId);
      }
      return currentCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleFinalizeClick = () => {
    if (!storeStatus.isOpen) {
      toast({
        variant: 'destructive',
        title: 'Loja Fechada!',
        description: storeStatus.message,
      });
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  const handleSaleFinalized = () => {
    setIsCheckoutOpen(false);
    setCart([]);
    toast({
      title: "Pedido Recebido!",
      description: "Seu pedido foi enviado. Entraremos em contato em breve para confirmar.",
    });
  };

  if (loading) {
    return null; // The loading skeleton is handled by Suspense
  }

  const ProductCard = ({ product }: { product: Product }) => {
    const isBestSeller = (product.salesCount || 0) > 0 && (product.salesCount || 0) >= bestSellerThreshold;
    const hasPromo = product.isPromotion && product.promotionalPrice != null && product.promotionalPrice >= 0;
    const displayPrice = hasPromo ? product.promotionalPrice! : product.price;
    const isAvailable = product.isAvailable ?? true;
    
    return (
       <Card className={cn("overflow-hidden flex flex-col group h-full", !isAvailable && "opacity-60")}>
            <CardHeader className="p-0">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {!isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                            <p className="text-white font-bold text-lg">Em Falta</p>
                        </div>
                    )}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                        {isBestSeller && (
                            <div className="bg-black/70 text-white text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400"/>
                                Mais Pedido
                            </div>
                        )}
                        {hasPromo && (
                           <div className="bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1">
                                <Percent className="w-3 h-3"/>
                                Promoção
                            </div>
                        )}
                    </div>
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
                    <div className="flex flex-col items-start">
                        {hasPromo && (
                            <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</p>
                        )}
                        <p className="text-xl font-bold text-primary">{formatCurrency(displayPrice)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddToCart(product)} disabled={!isAvailable}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Pedir
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <WhiskIcon className="w-16 h-16 text-primary" />
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">Cardápio Doçuras da Fran</h1>
                <p className="text-muted-foreground mt-1">Escolha seus doces favoritos e faça seu pedido!</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="default" className="bg-primary hover:bg-primary/90" onClick={() => setShowPromotions(!showPromotions)} aria-expanded={showPromotions}>
              <Percent className="w-4 h-4 mr-2" />
              Promoções
            </Button>
            <ThemeToggle />
        </div>
      </header>

      {!storeStatus.isOpen && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertTitle>Loja Fechada</AlertTitle>
          <AlertDescription>
            {storeStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <Collapsible open={showPromotions} className="w-full">
        <CollapsibleContent className="animate-in fade-in-0 zoom-in-95">
            {promotionalProducts.length > 0 ? (
                <div className='space-y-4'>
                    <h2 className="text-2xl font-bold tracking-tight">✨ Promoções</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {promotionalProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <p className="font-semibold">Nenhuma promoção ativa no momento.</p>
                <p className="text-sm">Volte em breve para conferir as novidades!</p>
                </div>
            )}
        </CollapsibleContent>
      </Collapsible>

      {products.length === 0 ? (
        <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Nenhum produto no cardápio</h2>
            <p className="mt-2 text-muted-foreground">Volte em breve para ver nossas delícias!</p>
        </div>
      ) : (
        <div className="space-y-12">
            {featuredProducts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">✨ Destaques da Casa</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => (
                           <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}
          
            <div className='space-y-6'>
                <h2 className="text-2xl font-bold tracking-tight">Todos os Produtos</h2>
                <div className="max-w-xs">
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" className="rounded-full shadow-lg h-16" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="w-6 h-6 mr-3" />
            <div className="text-left">
              <span className="font-bold">{totalItems} {totalItems > 1 ? 'itens' : 'item'}</span>
              <div className="text-sm">{formatCurrency(cartTotal)}</div>
            </div>
          </Button>
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-2xl">Seu Pedido</SheetTitle>
          </SheetHeader>
          {cart.length > 0 ? (
            <>
              <ScrollArea className="flex-grow my-4">
                <div className="space-y-4 pr-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-start gap-4">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground"/>
                        </div>
                      )}
                      <div className="flex-grow">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.promotionalPrice ?? item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-lg w-5 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency((item.promotionalPrice ?? item.price) * item.quantity)}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 mt-2 text-muted-foreground hover:text-destructive" onClick={() => handleUpdateQuantity(item.id, 0)}>
                           <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <SheetFooter className="mt-auto pt-4 border-t">
                <div className="w-full space-y-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button size="lg" className="w-full h-12 text-lg" onClick={handleFinalizeClick} disabled={!storeStatus.isOpen}>
                     {storeStatus.isOpen ? 'Finalizar Pedido' : 'Loja Fechada'}
                  </Button>
                   {!storeStatus.isOpen && <p className="text-center text-sm text-destructive">{storeStatus.message}</p>}
                </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">Seu carrinho está vazio</p>
              <p>Adicione produtos para começar um pedido.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AddTransactionSheet 
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={cart}
        cartTotal={cartTotal}
        onSaleFinalized={handleSaleFinalized}
        fromStorefront={true}
      />

    </div>
  );
}

  