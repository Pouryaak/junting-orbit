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

export const SummaryToolbar: React.FC<SummaryToolbarProps> = ({ 
  usagePlan,
  usageLimit,
  usageRemaining,
  isQuotaDepleted,
}) => {
  const normalizedLimit =
    typeof usageLimit === 'number' && !Number.isNaN(usageLimit)
      ? usageLimit
      : null;
  const normalizedRemaining =
    typeof usageRemaining === 'number' && !Number.isNaN(usageRemaining)
      ? usageRemaining
      : null;
  const used =
    normalizedLimit !== null && normalizedRemaining !== null
      ? Math.max(normalizedLimit - normalizedRemaining, 0)
      : null;
  const usagePercent =
    normalizedLimit && used !== null && normalizedLimit > 0
      ? Math.min(100, Math.round((used / normalizedLimit) * 100))
      : 0;

  const planLabel = usagePlan
    ? `${usagePlan.charAt(0).toUpperCase()}${usagePlan.slice(1)}`
    : '—';

  const isPremium = usagePlan === 'premium';

  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b">
      <div className="flex flex-col gap-1">
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
      <div className="flex flex-col items-end gap-1">
        {isPremium ? (
          <span className="text-xs font-semibold text-primary">
            Unlimited runs unlocked. Go wild! 🚀
          </span>
        ) : normalizedLimit !== null && used !== null ? (
          <>
            <span className="text-xs font-medium text-muted-foreground">
              Today's usage
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isQuotaDepleted ? 'bg-accent' : 'bg-primary'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {used}/{normalizedLimit}
              </span>
            </div>
            {isQuotaDepleted && (
              <span className="text-[11px] text-accent font-medium">
                Fresh credits drop tomorrow ✨
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Usage details will appear after your first analysis.
          </span>
        )}
      </div>
    </div>
  );
};
