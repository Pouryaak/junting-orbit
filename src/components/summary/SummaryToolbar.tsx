/**
 * Summary Tab Toolbar Component
 * Shows AI badge and history button
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface SummaryToolbarProps {
  usagePlan?: string | null;
  usageLimit?: number | null;
  usageRemaining?: number | null;
  isQuotaDepleted: boolean;
}

import { UsageIndicator } from './UsageIndicator';

interface SummaryToolbarProps {
  usagePlan?: string | null;
  usageLimit?: number | null;
  usageRemaining?: number | null;
  isQuotaDepleted: boolean;
}

export const SummaryToolbar: React.FC<SummaryToolbarProps> = ({ 
  usagePlan,
  usageLimit,
  usageRemaining,
  isQuotaDepleted,
}) => {
  const planLabel = usagePlan
    ? `${usagePlan.charAt(0).toUpperCase()}${usagePlan.slice(1)}`
    : '—';

  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b">
      <div className="flex flex-col gap-1 w-full min-[590px]:w-auto">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">
            Evaluated by our career expert AI
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            Plan: {planLabel}
          </span>
        </div>
      </div>
      
      {/* Hide on small screens as it's shown in the sticky header */}
      <div className="hidden min-[590px]:flex flex-col items-end gap-1">
        <UsageIndicator 
          usagePlan={usagePlan}
          usageLimit={usageLimit}
          usageRemaining={usageRemaining}
          isQuotaDepleted={isQuotaDepleted}
        />
      </div>
    </div>
  );
};
