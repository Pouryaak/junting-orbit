/**
 * URL Change Banner Component
 * Shows notification when user navigates to different job posting
 */

import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, History as HistoryIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import type { JobHistoryEntry } from '@/lib/jobHistory';

interface URLChangeBannerProps {
  existingJobEntry: JobHistoryEntry | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onViewHistory: () => void;
  isQuotaDepleted: boolean;
  dailyLimit: number | null;
}

export const URLChangeBanner: React.FC<URLChangeBannerProps> = ({
  existingJobEntry,
  isLoading,
  onAnalyze,
  onViewHistory,
  isQuotaDepleted,
  dailyLimit,
}) => {
  return (
    <div className={cn(
      "border rounded-lg p-4 flex items-start gap-3",
      existingJobEntry 
        ? "bg-blue-50/50 border-blue-200/50" 
        : "bg-accent/10 border-accent/20"
    )}>
      {existingJobEntry ? (
        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-1 text-foreground">
          {existingJobEntry 
            ? "Previously Analyzed Job" 
            : "New Job Posting Detected"}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {existingJobEntry 
            ? `You analyzed this position on ${new Date(existingJobEntry.analyzedAt).toLocaleDateString()}. View it in your history or re-analyze for updated insights.`
            : "You're viewing a different job posting. Analyze this new position to get updated insights."}
        </p>
        <div className="flex flex-wrap gap-2">
          {existingJobEntry && (
            <Button
              onClick={onViewHistory}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <HistoryIcon className="h-3 w-3 mr-1" />
              View in History
            </Button>
          )}
          {isQuotaDepleted ? (
            <div className="flex-1 min-w-[180px] rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary">
              Daily free analyses (limit {dailyLimit ?? 5}) are all used up for today. Fresh credits land tomorrow, and premium (coming soon) will unlock unlimited reruns. ✨
            </div>
          ) : (
            <Button
              onClick={onAnalyze}
              disabled={isLoading}
              size="sm"
              className={cn(
                "text-xs",
                existingJobEntry 
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-accent hover:bg-accent/90 text-accent-foreground"
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {existingJobEntry ? "Re-analyze Job" : "Analyze This Job"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
