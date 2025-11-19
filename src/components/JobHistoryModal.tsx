/**
 * Job History Modal Component
 * Displays analysis history with filters and comparison view
 * 
 * Security: All data is validated before rendering, XSS prevention
 * Design: Clean, consistent with app design, highly usable
 */

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Filter,
  BarChart3,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobHistoryEntry } from '@/lib/jobHistory';
import { filterByLabel, filterByTimeRange, sortByScore } from '@/lib/jobHistory';

interface JobHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: JobHistoryEntry[];
}

export const JobHistoryModal: React.FC<JobHistoryModalProps> = ({
  open,
  onOpenChange,
  history,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'strong' | 'medium' | 'weak'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days'>('all');
  const [sortByScoreEnabled, setSortByScoreEnabled] = useState(false);

  // Apply filters
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Filter by label
    if (selectedFilter !== 'all') {
      const labelMap = {
        strong: 'Strong Fit' as const,
        medium: 'Medium Fit' as const,
        weak: 'Weak Fit' as const,
      };
      filtered = filterByLabel(filtered, [labelMap[selectedFilter]]);
    }

    // Filter by time
    if (timeFilter === '7days') {
      filtered = filterByTimeRange(filtered, 7);
    } else if (timeFilter === '30days') {
      filtered = filterByTimeRange(filtered, 30);
    }

    // Sort by score if enabled
    if (sortByScoreEnabled) {
      filtered = sortByScore(filtered);
    }

    return filtered;
  }, [history, selectedFilter, timeFilter, sortByScoreEnabled]);

  const getFitColor = (label: string) => {
    switch (label) {
      case 'Strong Fit':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium Fit':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Weak Fit':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleOpenUrl = (url: string) => {
    // Security: URL is already validated in jobHistory.ts
    chrome.tabs.create({ url });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <History className="h-6 w-6 text-primary" />
            Job Analysis History
          </DialogTitle>
          <DialogDescription>
            View and compare your analyzed job postings
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        {history.length > 0 && (
          <div className="flex items-center gap-3 pb-2 border-b">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2 flex-1">
              {/* Fit Level Filter */}
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
                className="h-8 text-xs"
              >
                All
              </Button>
              <Button
                variant={selectedFilter === 'strong' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('strong')}
                className="h-8 text-xs"
              >
                Strong Fit
              </Button>
              <Button
                variant={selectedFilter === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('medium')}
                className="h-8 text-xs"
              >
                Medium Fit
              </Button>
              <Button
                variant={selectedFilter === 'weak' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('weak')}
                className="h-8 text-xs"
              >
                Weak Fit
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Time Filter */}
              <Button
                variant={timeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('all')}
                className="h-8 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                All Time
              </Button>
              <Button
                variant={timeFilter === '7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('7days')}
                className="h-8 text-xs"
              >
                Last 7 Days
              </Button>
              <Button
                variant={timeFilter === '30days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('30days')}
                className="h-8 text-xs"
              >
                Last 30 Days
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              {/* Sort Toggle */}
              <Button
                variant={sortByScoreEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortByScoreEnabled(!sortByScoreEnabled)}
                className="h-8 text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                {sortByScoreEnabled ? 'Sorted by Score' : 'Sort by Date'}
              </Button>
            </div>
          </div>
        )}

        {/* Job List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-1">
                {history.length === 0 ? 'No analysis history yet' : 'No jobs match the selected filters'}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {history.length === 0 
                  ? 'Analyze job postings to build your history' 
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="group border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all bg-card"
              >
                {/* Header: Title, Company, Score */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 truncate" title={entry.title}>
                      {entry.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate" title={entry.company}>
                      {entry.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{entry.matchScore}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                </div>

                {/* Fit Label & Decision */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full border",
                    getFitColor(entry.label)
                  )}>
                    {entry.label}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-foreground">
                    {entry.decisionHelper}
                  </span>
                  {entry.appliedAt && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary/10 text-secondary border border-secondary/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Applied
                      </span>
                    </>
                  )}
                </div>

                {/* Flags Preview */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  {/* Green Flags */}
                  {entry.topGreenFlags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-semibold">Strengths</span>
                      </div>
                      <ul className="space-y-0.5 text-muted-foreground">
                        {entry.topGreenFlags.map((flag, i) => (
                          <li key={i} className="truncate" title={flag}>
                            • {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Red Flags */}
                  {entry.topRedFlags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-1 text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        <span className="font-semibold">Gaps</span>
                      </div>
                      <ul className="space-y-0.5 text-muted-foreground">
                        {entry.topRedFlags.map((flag, i) => (
                          <li key={i} className="truncate" title={flag}>
                            • {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer: Date & Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.analyzedAt)}
                    </span>
                    {entry.appliedAt && (
                      <span className="text-xs text-secondary font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Applied: {formatDate(entry.appliedAt)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenUrl(entry.url)}
                    className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Job
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
