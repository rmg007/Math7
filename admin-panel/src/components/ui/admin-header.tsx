import { cn } from '@/lib/utils';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  /** Optional route to navigate back to (renders a back arrow) */
  backTo?: string;
}

export function AdminHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
  backTo
}: AdminHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-8 w-full overflow-hidden", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {backTo && (
            <Link
              to={backTo}
              className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center shadow-lg shadow-teal-500/10 flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 data-testid="admin-header-title" className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap overflow-hidden">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
