import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  borderColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  borderColor = 'border-l-primary',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('border-l-4', borderColor, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {icon}
            </div>
          )}
        </div>
        {trend && trend !== 'neutral' && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span
              className={cn(
                'font-medium',
                trend === 'up' ? 'text-green-600' : 'text-red-600',
              )}
            >
              {trend === 'up' ? '↑' : '↓'}
            </span>
            <span className="text-muted-foreground">
              {trend === 'up' ? 'Crescimento' : 'Redução'} no período
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
