import React from 'react';

interface UsageIndicatorProps {
  usagePlan?: string | null;
  usageLimit?: number | null;
  usageRemaining?: number | null;
  isQuotaDepleted: boolean;
  compact?: boolean;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  usagePlan,
  usageLimit,
  usageRemaining,
  isQuotaDepleted,
  compact = false,
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

  const isPremium = usagePlan === 'premium';

  if (isPremium) {
    return (
      <span className="text-xs font-semibold text-primary">
        Unlimited runs unlocked. Go wild! 🚀
      </span>
    );
  }

  if (normalizedLimit === null || used === null) {
    return (
      <span className="text-xs text-muted-foreground">
        Usage details will appear after your first analysis.
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'items-start' : 'items-end'} gap-1`}>
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
      {isQuotaDepleted && !compact && (
        <span className="text-[11px] text-accent font-medium">
          Fresh credits drop tomorrow ✨
        </span>
      )}
    </div>
  );
};
