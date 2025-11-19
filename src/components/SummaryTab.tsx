/**
 * Summary Tab Component
 * Main container for job analysis display
 */

import React, { useEffect, useState } from 'react';
import { validateJobDescription, type ValidationError } from '@/lib/jobDescriptionValidator';
import { getCurrentTabUrl, getStoredData, saveStoredData } from '@/lib/storage';
import { createHistoryEntry, addToHistory, getJobByUrl, type JobHistoryEntry } from '@/lib/jobHistory';
import { analyzeJob as analyzeJobAPI, type FitAssessment as APIFitAssessment } from '@/services/apiService';
import { extractJobDescription } from '@/services/jobAnalysisService';
import { handleError, showErrorToUser } from '@/utils/errorHandler';
import { Alert } from './ui/alert';
import { JobHistoryModal } from './JobHistoryModal';
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

export const SummaryTab: React.FC = () => {
  const [assessment, setAssessment] = useState<FitAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [storedUrl, setStoredUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [existingJobEntry, setExistingJobEntry] = useState<JobHistoryEntry | null>(null);

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
      
      const analysisResult = await analyzeJobAPI(jobDescription.text);
      const localAssessment = convertAPIAssessment(analysisResult.fit_assessment);

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
      await saveStoredData({
        ...stored,
        assessment: localAssessment,
        coverLetter: analysisResult.cover_letter_text,
        analyzedUrl: jobDescription.url,
        analyzedAt: Date.now(),
        jobHistory: updatedHistory,
      });

      setStoredUrl(jobDescription.url);
      setCurrentUrl(jobDescription.url);

      window.dispatchEvent(
        new CustomEvent('coverLetterUpdated', {
          detail: { coverLetter: analysisResult.cover_letter_text },
        })
      );
    } catch (error) {
      const appError = handleError(error, 'JobAnalysis');
      showErrorToUser(appError);
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
          historyCount={jobHistory.length}
          onOpenHistory={() => setShowHistoryModal(true)}
        />
        <EmptyState 
          onAnalyze={handleAnalyze} 
          isLoading={isLoading}
          validationError={validationError}
          onDismissError={() => setValidationError(null)}
        />
        <JobHistoryModal
          open={showHistoryModal}
          onOpenChange={setShowHistoryModal}
          history={jobHistory}
        />
      </>
    );
  }

  // Show assessment results
  return (
    <>
      <SummaryToolbar 
        historyCount={jobHistory.length}
        onOpenHistory={() => setShowHistoryModal(true)}
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
              onViewHistory={() => setShowHistoryModal(true)}
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
      
      <JobHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        history={jobHistory}
      />
    </>
  );
};