/**
 * Summary Tab Component
 * Main container for job analysis display
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateJobDescription, type ValidationError } from '@/lib/jobDescriptionValidator';
import { getCurrentTabUrl, getStoredData, saveStoredData } from '@/lib/storage';
import { createHistoryEntry, addToHistory, getJobByUrl, type JobHistoryEntry } from '@/lib/jobHistory';
import {
  analyzeJob as analyzeJobAPI,
  type FitAssessment as APIFitAssessment,
  RateLimitError,
  type RateLimitInfo,
} from '@/services/apiService';
import { extractJobDescription } from '@/services/jobAnalysisService';
import { handleError, showErrorToUser } from '@/utils/errorHandler';
import { Alert } from './ui/alert';
import { SummaryToolbar } from './summary/SummaryToolbar';
import { EmptyState } from './summary/EmptyState';
import { URLChangeBanner } from './summary/URLChangeBanner';
import { DecisionHelperCard } from './summary/DecisionHelperCard';
import { ATSGauge } from './summary/ATSGauge';
import { FitAssessmentCard } from './summary/FitAssessmentCard';
import type { FitAssessment } from './summary/types';

// Convert API response to local format
function convertAPIAssessment(apiAssessment: APIFitAssessment): FitAssessment {
  return {
    label: apiAssessment.label === 'Strong' ? 'Strong Fit' : 
           apiAssessment.label === 'Medium' ? 'Medium Fit' : 'Weak Fit',
    matchScore: apiAssessment.match_score,
    greenFlags: apiAssessment.green_flags,
    redFlags: apiAssessment.red_flags,
    decisionHelper: apiAssessment.decision_helper,
  };
}

interface RateLimitState {
  plan: string | null;
  limit: number | null;
  remaining: number | null;
  updatedAt: number | null;
}

const DEFAULT_RATE_LIMIT_STATE: RateLimitState = {
  plan: null,
  limit: null,
  remaining: null,
  updatedAt: null,
};

function isSameDay(timestamp: number | null, reference: number): boolean {
  if (!timestamp) {
    return false;
  }

  const last = new Date(timestamp);
  const current = new Date(reference);

  return (
    last.getFullYear() === current.getFullYear() &&
    last.getMonth() === current.getMonth() &&
    last.getDate() === current.getDate()
  );
}

function deriveRateLimitState(
  info: RateLimitInfo | null,
  previous: RateLimitState
): RateLimitState | null {
  if (!info) {
    return null;
  }

  let planValue =
    info.plan !== null && info.plan !== undefined
      ? info.plan.toLowerCase()
      : previous.plan;

  if (!planValue && typeof info.limit === 'number') {
    planValue = 'free';
  }

  const now = Date.now();

  if (planValue === 'premium') {
    return {
      plan: 'premium',
      limit: null,
      remaining: null,
      updatedAt: now,
    };
  }

  const limit =
    typeof info.limit === 'number' && !Number.isNaN(info.limit)
      ? info.limit
      : previous.limit;

  const remaining =
    typeof info.remaining === 'number' && !Number.isNaN(info.remaining)
      ? Math.max(info.remaining, 0)
      : previous.remaining;

  return {
    plan: planValue,
    limit,
    remaining,
    updatedAt: now,
  };
}

function isRateLimited(rate: RateLimitState, reference: number): boolean {
  if (rate.plan === 'premium') {
    return false;
  }

  if (
    rate.limit !== null &&
    rate.remaining !== null &&
    rate.remaining <= 0 &&
    isSameDay(rate.updatedAt, reference)
  ) {
    return true;
  }

  return false;
}

export const SummaryTab: React.FC = () => {
  const [assessment, setAssessment] = useState<FitAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [storedUrl, setStoredUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistoryEntry[]>([]);
  const [existingJobEntry, setExistingJobEntry] = useState<JobHistoryEntry | null>(null);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(DEFAULT_RATE_LIMIT_STATE);

  const isQuotaDepleted = isRateLimited(rateLimitState, Date.now());
  const dailyLimit = rateLimitState.limit ?? null;

  // Load stored data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await getStoredData();
        const url = await getCurrentTabUrl();
        
        setCurrentUrl(url);
        setStoredUrl(stored.analyzedUrl);
        
        if (stored.assessment && stored.analyzedUrl) {
          setAssessment(stored.assessment);
        }
        
        // Load job history
        if (stored.jobHistory && Array.isArray(stored.jobHistory)) {
          setJobHistory(stored.jobHistory);
        }

        setRateLimitState({
          plan: stored.usagePlan ?? null,
          limit: stored.usageLimit ?? null,
          remaining: stored.usageRemaining ?? null,
          updatedAt: stored.usageUpdatedAt ?? null,
        });
      } catch (error) {
        const appError = handleError(error, 'LoadStoredData');
        console.error('Failed to load stored data:', appError);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Check URL when tab changes and check if job exists in history
  useEffect(() => {
    const checkUrl = async () => {
      const url = await getCurrentTabUrl();
      setCurrentUrl(url);
      
      // Check if this job is already in history
      if (url && jobHistory.length > 0) {
        const existingJob = await getJobByUrl(jobHistory, url);
        setExistingJobEntry(existingJob);
      } else {
        setExistingJobEntry(null);
      }
    };

    checkUrl();
    const interval = setInterval(checkUrl, 1000);
    return () => clearInterval(interval);
  }, [jobHistory]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setValidationError(null);
    
    try {
      const now = Date.now();

      if (isRateLimited(rateLimitState, now)) {
        toast.error("All free analyses used for today 🎉 Fresh credits land tomorrow. Premium (coming soon) unlocks unlimited runs.");
        setIsLoading(false);
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const jobDescription = await extractJobDescription(tab.id);
      const validationResult = validateJobDescription(jobDescription.text, jobDescription.url);
      
      if (!validationResult.isValid && validationResult.error) {
        setValidationError(validationResult.error);
        setIsLoading(false);
        return;
      }
      
      const { analysis, rateLimit } = await analyzeJobAPI(jobDescription.text);
      const localAssessment = convertAPIAssessment(analysis.fit_assessment);
      const rateUpdate = deriveRateLimitState(rateLimit, rateLimitState);

      if (rateUpdate) {
        setRateLimitState(rateUpdate);
      }

      setAssessment(localAssessment);

      const historyEntry = await createHistoryEntry({
        url: jobDescription.url,
        title: jobDescription.title,
        company: jobDescription.company,
        matchScore: localAssessment.matchScore,
        label: localAssessment.label,
        decisionHelper: localAssessment.decisionHelper,
        greenFlags: localAssessment.greenFlags,
        redFlags: localAssessment.redFlags,
      });

      const updatedHistory = addToHistory(jobHistory, historyEntry);
      setJobHistory(updatedHistory);

      const stored = await getStoredData();
      const nextStored = {
        ...stored,
        assessment: localAssessment,
        coverLetter: analysis.cover_letter_text,
        analyzedUrl: jobDescription.url,
        analyzedAt: Date.now(),
        jobHistory: updatedHistory,
      };

      if (rateUpdate) {
        nextStored.usagePlan = rateUpdate.plan;
        nextStored.usageLimit = rateUpdate.limit;
        nextStored.usageRemaining = rateUpdate.remaining;
        nextStored.usageUpdatedAt = rateUpdate.updatedAt;
      }

      await saveStoredData(nextStored);

      window.dispatchEvent(new Event('jobHistoryUpdated'));

      setStoredUrl(jobDescription.url);
      setCurrentUrl(jobDescription.url);

      window.dispatchEvent(
        new CustomEvent('coverLetterUpdated', {
          detail: { coverLetter: analysis.cover_letter_text },
        })
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        const fallbackRateState: RateLimitState = {
          plan: rateLimitState.plan,
          limit: rateLimitState.limit,
          remaining: 0,
          updatedAt: Date.now(),
        };

        const nextRateState =
          deriveRateLimitState(error.rateLimit, rateLimitState) || fallbackRateState;

        setRateLimitState(nextRateState);

        const stored = await getStoredData();
        await saveStoredData({
          ...stored,
          usagePlan: nextRateState.plan,
          usageLimit: nextRateState.limit,
          usageRemaining: nextRateState.remaining,
          usageUpdatedAt: nextRateState.updatedAt,
        });

        toast.error(error.message);
      } else {
        const appError = handleError(error, 'JobAnalysis');
        showErrorToUser(appError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const urlChanged = currentUrl && storedUrl && currentUrl !== storedUrl;

  // Show empty state if no assessment data
  if (!assessment) {
    return (
      <>
        <SummaryToolbar 
          usagePlan={rateLimitState.plan}
          usageLimit={rateLimitState.limit}
          usageRemaining={rateLimitState.remaining}
          isQuotaDepleted={isQuotaDepleted}
        />
        <EmptyState 
          onAnalyze={handleAnalyze} 
          isLoading={isLoading}
          validationError={validationError}
          onDismissError={() => setValidationError(null)}
          isQuotaDepleted={isQuotaDepleted}
          dailyLimit={dailyLimit}
        />
      </>
    );
  }

  // Show assessment results
  return (
    <>
      <SummaryToolbar 
        usagePlan={rateLimitState.plan}
        usageLimit={rateLimitState.limit}
        usageRemaining={rateLimitState.remaining}
        isQuotaDepleted={isQuotaDepleted}
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Main Analysis */}
        <div className="space-y-4">
          {validationError && (
            <Alert
              variant="warning"
              title={validationError.userMessage}
              description={validationError.message}
              suggestion={validationError.suggestion}
              onClose={() => setValidationError(null)}
            />
          )}
          
          {urlChanged && (
            <URLChangeBanner
              existingJobEntry={existingJobEntry}
              isLoading={isLoading}
              onAnalyze={handleAnalyze}
              isQuotaDepleted={isQuotaDepleted}
              dailyLimit={dailyLimit}
            />
          )}

          <DecisionHelperCard decision={assessment.decisionHelper} />

          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">ATS Score</h3>
            <ATSGauge score={assessment.matchScore} />
          </div>
        </div>

        {/* Right Column - Flags & Details */}
        <div className="space-y-4">
          <FitAssessmentCard assessment={assessment} />
        </div>
      </div>
    </>
  );
};