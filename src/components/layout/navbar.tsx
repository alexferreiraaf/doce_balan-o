'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Plus } from 'lucide-react';

import { WhiskIcon } from '@/components/icons/whisk-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { useAuth } from '@/firebase';

const navLinks = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/reports', label: 'Relatórios', icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const { isUserLoading } = useAuth();

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

        {!isUserLoading && <div className="hidden sm:block"><AddTransactionSheet /></div>}
      </nav>
      
      {/* Mobile Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 flex justify-around items-center p-1.5">
          {/* Início Link */}
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-24',
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

          {/* Novo Lançamento Button */}
          <div className="flex-shrink-0">
             <AddTransactionSheet />
          </div>

          {/* Relatórios Link */}
          <Link href="/reports" passHref>
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-24',
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
