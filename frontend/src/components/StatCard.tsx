import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'navy';
}

const colorMap = {
  primary: 'bg-primary-light text-primary',
  secondary: 'bg-secondary-light text-secondary',
  accent: 'bg-accent-light text-accent',
  navy: 'bg-surface-muted text-navy',
};

const valueColorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  navy: 'text-navy',
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  return (
    <div className="card hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-secondary">{title}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${valueColorMap[color]}`}>{value}</p>
          {trend && <p className="mt-1 text-xs text-navy-secondary/80">{trend}</p>}
        </div>
        <div className={`rounded-lg p-3 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
