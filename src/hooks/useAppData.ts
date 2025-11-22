import { useState, useEffect, useCallback } from 'react';
import { getStoredData, saveStoredData, getCurrentTabUrl } from '@/lib/storage';
import { getUsage } from '@/services/apiService';
import { type JobHistoryEntry } from '@/lib/jobHistory';
import { type FitAssessment } from '@/components/summary/types';

export interface RateLimitState {
  plan: string | null;
  limit: number | null;
  remaining: number | null;
  updatedAt: number | null;
}

export const DEFAULT_RATE_LIMIT_STATE: RateLimitState = {
  plan: null,
  limit: null,
  remaining: null,
  updatedAt: null,
};

export interface AppData {
  isInitialized: boolean;
  currentUrl: string | null;
  storedUrl: string | null;
  assessment: FitAssessment | null;
  analyzedTitle: string | null;
  analyzedCompany: string | null;
  jobHistory: JobHistoryEntry[];
  rateLimitState: RateLimitState;
}

export const DEFAULT_APP_DATA: AppData = {
  isInitialized: false,
  currentUrl: null,
  storedUrl: null,
  assessment: null,
  analyzedTitle: null,
  analyzedCompany: null,
  jobHistory: [],
  rateLimitState: DEFAULT_RATE_LIMIT_STATE,
};

export function useAppData() {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);

  const loadData = useCallback(async () => {
    try {
      const stored = await getStoredData();
      const url = await getCurrentTabUrl();

      const initialRateLimit: RateLimitState = {
        plan: stored.usagePlan ?? null,
        limit: stored.usageLimit ?? null,
        remaining: stored.usageRemaining ?? null,
        updatedAt: stored.usageUpdatedAt ?? null,
      };

      // Initial state update
      setData(prev => ({
        ...prev,
        isInitialized: true,
        currentUrl: url,
        storedUrl: stored.analyzedUrl || null,
        assessment: stored.assessment || null,
        analyzedTitle: stored.analyzedTitle || null,
        analyzedCompany: stored.analyzedCompany || null,
        jobHistory: stored.jobHistory || [],
        rateLimitState: initialRateLimit,
      }));

      // Check usage cache (5 minutes)
      const USAGE_CACHE_DURATION = 5 * 60 * 1000;
      const lastUpdated = stored.usageUpdatedAt || 0;
      const isStale = Date.now() - lastUpdated > USAGE_CACHE_DURATION;

      if (isStale) {
        try {
          const usage = await getUsage();
          const newRateLimit: RateLimitState = {
            plan: usage.plan,
            limit: usage.limit,
            remaining: usage.remainingToday,
            updatedAt: Date.now(),
          };

          // Update state
          setData(prev => ({
            ...prev,
            rateLimitState: newRateLimit,
          }));

          // Update storage
          await saveStoredData({
            ...stored,
            usagePlan: newRateLimit.plan,
            usageLimit: newRateLimit.limit,
            usageRemaining: newRateLimit.remaining,
            usageUpdatedAt: newRateLimit.updatedAt,
          });
        } catch (err) {
          console.warn("Failed to fetch fresh usage:", err);
        }
      } else {
        console.log("Using cached usage data");
      }

    } catch (error) {
      console.error("Failed to load app data:", error);
      setData(prev => ({ ...prev, isInitialized: true }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateData = useCallback((updates: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  return { data, updateData, refreshData: loadData };
}
