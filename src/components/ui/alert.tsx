/**
 * Alert Component
 * Reusable alert component for displaying validation errors and info messages
 * Based on shadcn/ui patterns with Tailwind CSS
 */

import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import React from 'react';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  description: string;
  suggestion?: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; IconComponent: React.ElementType }> = {
  default: {
    container: 'bg-background border-border text-foreground',
    icon: 'text-foreground',
    IconComponent: Info,
  },
  destructive: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: 'text-red-600',
    IconComponent: AlertCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    icon: 'text-yellow-600',
    IconComponent: AlertTriangle,
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-900',
    icon: 'text-green-600',
    IconComponent: CheckCircle2,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    IconComponent: Info,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  title,
  description,
  suggestion,
  onClose,
  className,
}) => {
  const styles = variantStyles[variant];
  const IconComponent = styles.IconComponent;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 shadow-sm',
        styles.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-sm mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm leading-relaxed">
            {description}
          </p>
          {suggestion && (
            <p className="text-sm mt-2 leading-relaxed opacity-90">
              <span className="font-medium">💡 Tip:</span> {suggestion}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
