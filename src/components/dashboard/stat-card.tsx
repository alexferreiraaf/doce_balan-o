import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass?: string;
}

export const StatCard = ({ title, value, icon: Icon, colorClass }: StatCardProps) => (
  <Card className={cn('transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl border-l-4', colorClass)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium opacity-80">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl md:text-3xl font-bold">
        {formatCurrency(value)}
      </div>
    </CardContent>
  </Card>
);
