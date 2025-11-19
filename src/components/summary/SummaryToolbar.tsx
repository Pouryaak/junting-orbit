/**
 * Summary Tab Toolbar Component
 * Shows AI badge and history button
 */

import React from 'react';
import { Sparkles, History as HistoryIcon } from 'lucide-react';
import { Button } from '../ui/button';

interface SummaryToolbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  usagePlan?: string | null;
  usageLimit?: number | null;
  usageRemaining?: number | null;
}

export const SummaryToolbar: React.FC<SummaryToolbarProps> = ({ 
  historyCount,
  onOpenHistory,
  usagePlan,
  usageLimit,
  usageRemaining,
}) => {
  const normalizedLimit =
    typeof usageLimit === 'number' && !Number.isNaN(usageLimit)
      ? usageLimit
      : null;
  const normalizedRemaining =
    typeof usageRemaining === 'number' && !Number.isNaN(usageRemaining)
      ? usageRemaining
      : null;

  const planLabel = usagePlan
    ? `${usagePlan.charAt(0).toUpperCase()}${usagePlan.slice(1)}`
    : '—';

  const isPremium = usagePlan === 'premium';
  const remainingLabel = isPremium
    ? 'Unlimited analyses'
    : normalizedLimit !== null && normalizedRemaining !== null
      ? normalizedRemaining <= 0
        ? `Remaining today: 0/${normalizedLimit} · Fresh credits tomorrow ✨`
        : `Remaining today: ${normalizedRemaining}/${normalizedLimit}`
      : null;

  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">
            Evaluated by our career expert AI
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            Plan: {planLabel}
          </span>
          {remainingLabel && (
            <span
              className={`font-medium ${
                !isPremium && normalizedRemaining !== null && normalizedRemaining <= 0
                  ? 'text-accent'
                  : 'text-muted-foreground'
              }`}
            >
              {remainingLabel}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenHistory}
        className="h-9"
      >
        <HistoryIcon className="h-4 w-4" />
        {historyCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
            {historyCount}
          </span>
        )}
      </Button>
    </div>
  );
};
