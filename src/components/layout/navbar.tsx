'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, LogOut, List, User as UserIcon, LogIn, Plus, Package, Users, Archive, LayoutDashboard, ShoppingCart, Eye, FileText, Bike, PlusSquare, Settings, ChevronDown, Bell, Tag } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { WhiskIcon } from '@/components/icons/whisk-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { Badge } from '../ui/badge';
import { useNotificationStore } from '@/stores/notification-store';


const mainNavLinks = [
  { href: '/pdv', label: 'PDV', icon: ShoppingCart },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/store-orders', label: 'Pedidos da Loja', icon: FileText, id: 'store-orders' },
];

const registrationLinks = [
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/customers', label: 'Clientes', icon: Users },
    { href: '/optionals', label: 'Opcionais', icon: PlusSquare },
    { href: '/product-categories', label: 'Categorias', icon: Tag },
];

const reportsLinks = [
    { href: '/reports', label: 'Visão Geral', icon: TrendingUp },
    { href: '/transactions', label: 'Lançamentos', icon: List },
];

const mobileNavLinks = [
  { href: '/pdv', label: 'PDV', icon: ShoppingCart },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { isUserLoading, user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { newOrdersBadgeCount, resetNewOrdersBadge } = useNotificationStore();
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
            if (permission === 'granted') {
                toast({ title: 'Notificações ativadas!', description: 'Você será avisado de novos pedidos.' });
                 new Notification('Tudo pronto!', {
                    body: 'Você receberá as notificações de novos pedidos por aqui.',
                    icon: '/icons/icon-192x192.png',
                });
            } else {
                toast({ variant: 'destructive', title: 'Notificações bloqueadas', description: 'Você precisará ativar as permissões nas configurações do seu navegador.' });
            }
        });
    } else {
        toast({ variant: 'destructive', title: 'Navegador incompatível', description: 'Seu navegador não suporta notificações.' });
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Você saiu!',
        description: 'Até a próxima!',
      });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível sair. Tente novamente.',
      });
    }
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'A';
    return email.charAt(0).toUpperCase();
  };
  
  const handleStoreOrdersClick = () => {
    resetNewOrdersBadge();
    router.push('/store-orders');
  };

  const NavButton = ({ href, label, icon: Icon, id, onClick }: { href?: string; label: string; icon: React.ElementType, id?: string; onClick?: () => void }) => {
    const isStoreOrders = id === 'store-orders';
    const showBadge = isStoreOrders && newOrdersBadgeCount > 0;
    const finalHref = href || '#';
    const isActive = href ? pathname === href : false;

    const content = (
        <div className="relative w-full">
            {showBadge && (
            <span className="absolute top-0 right-1 sm:right-2 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-white text-[10px]">{newOrdersBadgeCount}</span>
            </span>
            )}
            <Icon className="w-6 h-6 mb-0.5" />
            <span className="text-xs">{label}</span>
        </div>
    );

    const button = (
        <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
            'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
            isActive && 'text-primary font-semibold'
            )}
        >
            {content}
        </Button>
    )

    return href ? <Link href={finalHref} passHref>{button}</Link> : button;
  };
  
  const MobileMenuButton = ({ label, icon: Icon, links, activePaths }: { label: string; icon: React.ElementType; links: {href: string; label: string; icon: React.ElementType}[]; activePaths: string[] }) => {
    const isAnyActive = activePaths.some(path => pathname === path);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button
                    variant="ghost"
                    className={cn(
                    'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
                    isAnyActive && 'text-primary font-semibold'
                    )}
                >
                    <div>
                    <Icon className="w-6 h-6 mb-0.5" />
                    <span className="text-xs">{label}</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 mb-2" align="center" side="top">
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                {links.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} onSelect={() => router.push(href)}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  const isPOSPage = pathname === '/pdv';

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center space-x-2 text-primary-foreground">
          <WhiskIcon className="transform -rotate-12" width={40} height={40} fill="#FFFFFF" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Doçuras da Fran</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-1 bg-primary/80 p-1 rounded-full">
          {mainNavLinks.map(({ href, label, icon: Icon, id }) => {
            const isStoreOrders = id === 'store-orders';
            const showBadge = isStoreOrders && newOrdersBadgeCount > 0;
            return (
                <Button
                    key={href}
                    variant="ghost"
                    size="sm"
                    className={cn(
                    'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full px-3 relative',
                    pathname === href && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                    )}
                    onClick={isStoreOrders ? handleStoreOrdersClick : () => router.push(href)}
                >
                    {showBadge && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs animate-pulse">{newOrdersBadgeCount}</Badge>}
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                </Button>
            )
          })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full px-3',
                     reportsLinks.some(l => pathname.startsWith(l.href.replace('src/app/(admin)', ''))) && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                  )}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Relatórios
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {reportsLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} onSelect={() => router.push(href.replace('src/app/(admin)', '').replace('/page.tsx', ''))}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full px-3',
                    registrationLinks.some(l => pathname.startsWith(l.href)) && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                  )}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Cadastros
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {registrationLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} onSelect={() => router.push(href)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
            <ThemeToggle />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary-foreground text-primary font-bold">
                                {user?.isAnonymous ? <UserIcon /> : getInitials(user?.email)}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                   {user?.isAnonymous ? (
                     <>
                        <DropdownMenuLabel>Acesso Anônimo</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => router.push('/login')}>
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Fazer Login</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/signup')}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Criar Conta</span>
                        </DropdownMenuItem>
                     </>
                   ) : (
                    <>
                        <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => window.open('/loja', '_blank')}>
                           <Eye className="mr-2 h-4 w-4" />
                           Ver Loja
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => router.push('/settings')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações da Loja
                        </DropdownMenuItem>
                        {notificationPermission !== 'granted' && (
                            <DropdownMenuItem onSelect={handleRequestNotificationPermission}>
                                <Bell className="mr-2 h-4 w-4" />
                                <span>Ativar Notificações</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </>
                   )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </nav>
      
      {/* Mobile Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 grid grid-cols-5 items-center p-1.5 gap-1">
        {mobileNavLinks.map((link) => (
            <NavButton key={link.href} href={link.href} label={link.label} icon={link.icon} onClick={() => router.push(link.href)} />
        ))}
        
        <MobileMenuButton label="Relatórios" icon={TrendingUp} links={reportsLinks} activePaths={reportsLinks.map(l => l.href.replace('src/app/(admin)', '').replace('/page.tsx', ''))} />
        <MobileMenuButton label="Cadastros" icon={Archive} links={registrationLinks} activePaths={registrationLinks.map(l => l.href)} />
        <NavButton label="Pedidos" icon={FileText} id="store-orders" onClick={handleStoreOrdersClick} />


      </div>

    </header>
  );
}
