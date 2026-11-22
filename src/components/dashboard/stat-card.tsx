'use client';

import { useState } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  isVisible,
  onToggleVisibility,
}: StatCardProps) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const visible = isVisible !== undefined ? isVisible : internalVisible;
  const handleToggle = onToggleVisibility ?? (() => setInternalVisible((prev) => !prev));

  return (
    <Card className={cn('transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl border-l-4', colorClass)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium opacity-80">{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleToggle}
            title={visible ? 'Ocultar valor' : 'Mostrar valor'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl md:text-3xl font-bold select-none">
          {visible ? formatCurrency(value) : 'R$ •••••'}
        </div>
      </CardContent>
    </Card>
  );
};
