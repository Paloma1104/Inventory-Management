interface BadgeProps {
  status: string;
  label?: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-secondary-light text-secondary ring-secondary/20',
  inactive: 'bg-surface-muted text-navy-secondary ring-navy-secondary/20',
  in_stock: 'bg-primary-light text-primary ring-primary/20',
  low_stock: 'bg-accent-light text-accent ring-accent/30',
  out_of_stock: 'bg-accent-light text-accent-dark ring-accent/40',
  admin: 'bg-primary-light text-primary ring-primary/20',
  user: 'bg-surface-muted text-navy-secondary ring-navy-secondary/20',
  stock_in: 'bg-primary-light text-primary ring-primary/20',
  stock_out: 'bg-accent-light text-accent ring-accent/30',
  pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  approved: 'bg-primary-light text-primary ring-primary/20',
  rejected: 'bg-red-100 text-red-700 ring-red-600/10',
};

const statusLabels: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  admin: 'Admin',
  user: 'User',
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function Badge({ status, label }: BadgeProps) {
  const style = statusStyles[status] || 'bg-surface-muted text-navy-secondary ring-navy-secondary/20';
  const displayLabel = label || statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {displayLabel}
    </span>
  );
}
