/**
 * Summary Tab Component
 * Main container for job analysis display
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateJobDescription, type ValidationError } from '@/lib/jobDescriptionValidator';
import { getStoredData, saveStoredData } from '@/lib/storage';
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

  // If we have a valid remaining count from the backend, trust it.
  // The backend handles the reset logic.
  if (rate.remaining !== null && rate.remaining <= 0) {
     // Check if the data is stale (e.g. from yesterday)
     // If it's from yesterday, we might want to optimistically reset IF we couldn't fetch fresh data.
     // But since we fetch fresh data on mount, we can generally trust 'remaining'.
     // However, if fetch failed, we fall back to stored data.
     // If stored data is old, we should probably allow it (optimistic) or block it?
     // The user said: "it only fetches new information ... when the analyze button is hit"
     // Now we fetch on mount. So 'rate' should be fresh.
     // If 'rate.updatedAt' is from a previous day, and we failed to fetch, 
     // we might be blocking unnecessarily. 
     // Let's keep the isSameDay check as a fallback for when fetch fails?
     // Actually, if we successfully fetched, updatedAt will be NOW.
     // So isSameDay(rate.updatedAt, now) will be true.
     // If we failed to fetch, updatedAt will be old.
     // If updatedAt is old (different day), and remaining is 0, should we block?
     // Probably not, because it might have reset.
     // So: Block ONLY if remaining <= 0 AND it's the same day.
     return isSameDay(rate.updatedAt, reference);
  }

  return false;
}

import { type AppData, type RateLimitState } from '@/hooks/useAppData';

interface SummaryTabProps {
  appData: AppData;
  onUpdateData: (updates: Partial<AppData>) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ appData, onUpdateData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [existingJobEntry, setExistingJobEntry] = useState<JobHistoryEntry | null>(null);

  const {
    currentUrl,
    storedUrl,
    assessment,
    analyzedTitle,
    analyzedCompany,
    jobHistory,
    rateLimitState,
  } = appData;

  const isQuotaDepleted = isRateLimited(rateLimitState, Date.now());
  const dailyLimit = rateLimitState.limit ?? null;

  // Check if job exists in history when URL changes
  useEffect(() => {
    const checkHistory = async () => {
      if (currentUrl && jobHistory.length > 0) {
        const existingJob = await getJobByUrl(jobHistory, currentUrl);
        setExistingJobEntry(existingJob);
      } else {
        setExistingJobEntry(null);
      }
    };
    checkHistory();
  }, [currentUrl, jobHistory]);

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

      // Prepare updates
      const updates: Partial<AppData> = {};

      if (rateUpdate) {
        updates.rateLimitState = rateUpdate;
      }

      updates.assessment = localAssessment;
      updates.analyzedTitle = jobDescription.title || null;
      updates.analyzedCompany = jobDescription.company || null;
      updates.storedUrl = jobDescription.url;
      updates.currentUrl = jobDescription.url;

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
      updates.jobHistory = updatedHistory;

      // Update local state via prop
      onUpdateData(updates);

      // Persist to storage
      const stored = await getStoredData();
      const nextStored = {
        ...stored,
        assessment: localAssessment,
        coverLetter: analysis.cover_letter_text,
        analyzedUrl: jobDescription.url,
        analyzedTitle: jobDescription.title,
        analyzedCompany: jobDescription.company,
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

        onUpdateData({ rateLimitState: nextRateState });

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
          {analyzedTitle && analyzedCompany && (
        <div className="mb-6 bg-card rounded-lg border p-4 shadow-sm">
          <h3 className="font-semibold text-lg leading-tight text-center">{analyzedTitle}</h3>
          <p className="text-muted-foreground text-sm mt-1 text-center font-medium">{analyzedCompany}</p>
        </div>
      )}
          <FitAssessmentCard assessment={assessment} />
        </div>
      </div>
    </>
  );
};