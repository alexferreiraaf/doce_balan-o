'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, LogOut, List } from 'lucide-react';
import { signOut } from 'firebase/auth';

import { WhiskIcon } from '@/components/icons/whisk-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { useAuth, useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const navLinks = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/transactions', label: 'Lançamentos', icon: List },
  { href: '/reports', label: 'Relatórios', icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const { isUserLoading, user } = useAuth();
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

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
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center space-x-2 text-primary-foreground">
          <WhiskIcon className="w-8 h-8 transform -rotate-12" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Doce Balanço</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-2 bg-primary/80 p-1 rounded-full">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} passHref>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full',
                  pathname === href && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                )}
                asChild
              >
                <div>
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </div>
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
            {!isUserLoading && (
                <div className="hidden sm:block">
                    <AddTransactionSheet />
                </div>
            )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary-foreground text-primary font-bold">
                                {getInitials(user?.email)}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </nav>
      
      {/* Mobile Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 grid grid-cols-4 items-center p-1.5">
          {/* Início Link */}
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
                 pathname === '/' && 'text-primary font-semibold'
              )}
              asChild
            >
              <div>
                <Home className="w-6 h-6 mb-0.5" />
                <span className="text-xs">Início</span>
              </div>
            </Button>
          </Link>
          
          <Link href="/transactions" passHref>
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
                 pathname === '/transactions' && 'text-primary font-semibold'
              )}
              asChild
            >
              <div>
                <List className="w-6 h-6 mb-0.5" />
                <span className="text-xs">Lançamentos</span>
              </div>
            </Button>
          </Link>


          {/* Novo Lançamento Button */}
          <div className="flex justify-center">
             <AddTransactionSheet />
          </div>

          {/* Relatórios Link */}
          <Link href="/reports" passHref>
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
                 pathname === '/reports' && 'text-primary font-semibold'
              )}
              asChild
            >
              <div>
                <TrendingUp className="w-6 h-6 mb-0.5" />
                <span className="text-xs">Relatórios</span>
              </div>
            </Button>
          </Link>
      </div>

    </header>
  );
}
