import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href: string }>;
  className?: string;
}

export function AdminHeader({
  title,
  description,
  icon: Icon,
  actions,
  breadcrumbs,
  className
}: AdminHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="inline-flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                <Link 
                  to={crumb.href} 
                  className={cn(
                    "text-sm font-medium",
                    index === breadcrumbs.length - 1 
                      ? "text-gray-900 cursor-default pointer-events-none" 
                      : "text-gray-500 hover:text-purple-600 transition-colors"
                  )}
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/10 flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 data-testid="admin-header-title" className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {description && <p className="text-gray-500 mt-1 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
