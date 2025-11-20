/**
 * History Tab Component
 * Displays job analysis history with filters inside dedicated tab section.
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Filter,
  BarChart3,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { getStoredData, STORAGE_KEY } from "@/lib/storage";
import type { JobHistoryEntry } from "@/lib/jobHistory";
import {
  filterByLabel,
  filterByTimeRange,
  sortByScore,
} from "@/lib/jobHistory";

type FitFilter = "all" | "strong" | "medium" | "weak";
type TimeFilter = "all" | "7days" | "30days";

const FIT_LABEL_MAP: Record<Exclude<FitFilter, "all">, JobHistoryEntry["label"]> = {
  strong: "Strong Fit",
  medium: "Medium Fit",
  weak: "Weak Fit",
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getFitColor(label: string): string {
  switch (label) {
    case "Strong Fit":
      return "text-green-600 bg-green-50 border-green-200";
    case "Medium Fit":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Weak Fit":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export const HistoryTab: React.FC = () => {
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sortByScoreEnabled, setSortByScoreEnabled] = useState(false);

  const loadHistory = useCallback(async () => {
    const stored = await getStoredData();
    if (stored.jobHistory && Array.isArray(stored.jobHistory)) {
      setHistory(stored.jobHistory);
    } else {
      setHistory([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleHistoryUpdated = () => {
      loadHistory();
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === "local" && STORAGE_KEY in changes) {
        loadHistory();
      }
    };

    window.addEventListener("jobHistoryUpdated", handleHistoryUpdated);
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      window.removeEventListener("jobHistoryUpdated", handleHistoryUpdated);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (fitFilter !== "all") {
      filtered = filterByLabel(filtered, [FIT_LABEL_MAP[fitFilter]]);
    }

    if (timeFilter === "7days") {
      filtered = filterByTimeRange(filtered, 7);
    } else if (timeFilter === "30days") {
      filtered = filterByTimeRange(filtered, 30);
    }

    if (sortByScoreEnabled) {
      filtered = sortByScore(filtered);
    }

    return filtered;
  }, [history, fitFilter, timeFilter, sortByScoreEnabled]);

  const handleOpenUrl = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job History</h2>
            <p className="text-xs text-muted-foreground">
              Review every role you've analyzed and jump back in anytime.
            </p>
          </div>
        </div>
        {history.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {history.length} saved {history.length === 1 ? "analysis" : "analyses"}
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">Your Top 20 Job Finds 🌟</p>
        <p>
          I'm keeping your latest 20 analyses safe right here on your device! Just a heads up: if you uninstall, they vanish like a ninja. 🥷💨 
          But get excited—I'm building a <strong>Premium</strong> cloud vault to keep your entire career journey safe forever! 🚀✨
        </p>
      </div>

      {history.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center border rounded-lg px-3 py-2 bg-card/50">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={fitFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFitFilter("all")}
              className="h-8 text-xs"
            >
              All
            </Button>
            <Button
              variant={fitFilter === "strong" ? "default" : "outline"}
              size="sm"
              onClick={() => setFitFilter("strong")}
              className="h-8 text-xs"
            >
              Strong Fit
            </Button>
            <Button
              variant={fitFilter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setFitFilter("medium")}
              className="h-8 text-xs"
            >
              Medium Fit
            </Button>
            <Button
              variant={fitFilter === "weak" ? "default" : "outline"}
              size="sm"
              onClick={() => setFitFilter("weak")}
              className="h-8 text-xs"
            >
              Weak Fit
            </Button>

            <div className="hidden sm:block w-px h-6 bg-border mx-1" />

            <Button
              variant={timeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("all")}
              className="h-8 text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              All Time
            </Button>
            <Button
              variant={timeFilter === "7days" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("7days")}
              className="h-8 text-xs"
            >
              Last 7 Days
            </Button>
            <Button
              variant={timeFilter === "30days" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("30days")}
              className="h-8 text-xs"
            >
              Last 30 Days
            </Button>

            <div className="hidden sm:block w-px h-6 bg-border mx-1" />

            <Button
              variant={sortByScoreEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByScoreEnabled(!sortByScoreEnabled)}
              className="h-8 text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              {sortByScoreEnabled ? "Sorted by Score" : "Sort by Date"}
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-[320px] rounded-lg border bg-card p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HistoryIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-1">
              {history.length === 0
                ? "No analysis history yet"
                : "No jobs match the selected filters"}
            </p>
            <p className="text-sm text-muted-foreground/70">
              {history.length === 0
                ? "Analyze job postings to build your history"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-4 bg-background hover:border-primary/40 hover:shadow-sm transition-all"
              >
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
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
                    className="h-8 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Job
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
          Tip: Analyze a job posting from LinkedIn, Indeed, or Seek to start your history. Each run adds a card here, so you can revisit high-potential roles fast. ✨
        </div>
      )}
    </div>
  );
};
