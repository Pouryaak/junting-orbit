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
}

export const SummaryToolbar: React.FC<SummaryToolbarProps> = ({ 
  historyCount, 
  onOpenHistory 
}) => {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-foreground">
          Evaluated by our career expert AI
        </span>
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
