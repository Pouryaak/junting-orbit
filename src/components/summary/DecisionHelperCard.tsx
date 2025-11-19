/**
 * Decision Helper Card Component
 * Displays AI recommendation for job application
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDecisionColor, getDecisionDescription } from './utils';
import type { DecisionHelper } from './types';

interface DecisionHelperCardProps {
  decision: DecisionHelper;
}

export const DecisionHelperCard: React.FC<DecisionHelperCardProps> = ({ decision }) => {
  return (
    <div className={cn("rounded-lg border-2 p-4", getDecisionColor(decision))}>
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="h-5 w-5" style={{ color: 'inherit' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'inherit' }}>
          Recommendation
        </h3>
      </div>
      <p className="text-base font-bold mb-2" style={{ color: 'inherit' }}>
        {decision}
      </p>
      <p className="text-sm mt-2" style={{ color: 'inherit', opacity: 0.9 }}>
        {getDecisionDescription(decision)}
      </p>
    </div>
  );
};
