import { validateJobDescription, type ValidationError } from '@/lib/jobDescriptionValidator';
import { getCurrentTabUrl, getStoredData, saveStoredData } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { createHistoryEntry, addToHistory, type JobHistoryEntry } from '@/lib/jobHistory';
import { analyzeJob as analyzeJobAPI, type FitAssessment as APIFitAssessment } from '@/services/apiService';
import { extractJobDescription } from '@/services/jobAnalysisService';
import { handleError, showErrorToUser } from '@/utils/errorHandler';
import { AlertCircle, BarChart3, CheckCircle2, FileText, RefreshCw, Sparkles, Target, TrendingUp, XCircle, Zap, History as HistoryIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { JobHistoryModal } from './JobHistoryModal';

interface FitAssessment {
  label: 'Strong Fit' | 'Medium Fit' | 'Weak Fit';
  matchScore: number; // 0-100
  greenFlags: string[];
  redFlags: string[];
  decisionHelper: 'Apply Immediately' | 'Tailor & Apply' | 'Skip for Now';
}

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


// Empty State Component
const EmptyState: React.FC<{ 
  onAnalyze: () => void; 
  isLoading: boolean; 
  validationError: ValidationError | null;
  onDismissError: () => void;
}> = ({ onAnalyze, isLoading, validationError, onDismissError }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-6 text-center">
      {/* Show validation error if present */}
      {validationError && (
        <div className="w-full mb-6">
          <Alert
            variant="warning"
            title={validationError.userMessage}
            description={validationError.message}
            suggestion={validationError.suggestion}
            onClose={onDismissError}
          />
        </div>
      )}
      
      {/* Icon/Illustration */}
      <div className="mb-6 relative">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Get Instant Job Match Analysis
      </h2>

      {/* Description */}
      <p className="text-base text-muted-foreground mb-8 max-w-md">
        Let our AI career expert analyze this job posting against your profile. 
      </p>

      {/* Features List */}
      <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
        <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
          <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold text-sm mb-1">ATS Score</div>
            <div className="text-xs text-muted-foreground">Compatibility rating</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
          <Target className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold text-sm mb-1">Fit Assessment</div>
            <div className="text-xs text-muted-foreground">Match analysis</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
          <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold text-sm mb-1">Cover Letter</div>
            <div className="text-xs text-muted-foreground">AI-generated</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
          <TrendingUp className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold text-sm mb-1">Recommendations</div>
            <div className="text-xs text-muted-foreground">Actionable insights</div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onAnalyze}
        disabled={isLoading}
        size="lg"
        className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
            Analyzing Job Description...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 mr-2" />
            Analyze This Job Posting
          </>
        )}
      </Button>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground mt-4">
        Make sure you're on a job posting page
      </p>
    </div>
  );
};

const getFitColor = (label: string) => {
  switch (label) {
    case 'Strong Fit':
      return 'text-green-600';
    case 'Medium Fit':
      return 'text-yellow-600';
    case 'Weak Fit':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'Apply Immediately':
      return 'bg-green-50 text-green-900 border-green-200';
    case 'Tailor & Apply':
      return 'bg-yellow-50 text-yellow-900 border-yellow-200';
    case 'Skip for Now':
      return 'bg-red-50 text-red-900 border-red-200';
    default:
      return 'bg-gray-50 text-gray-900 border-gray-200';
  }
};

// Circular gauge component
const ATSGauge: React.FC<{ score: number }> = ({ score }) => {
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color }}>
              {score}
            </div>
            <div className="text-base text-muted-foreground mt-1">ATS Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SummaryTab: React.FC = () => {
  const [assessment, setAssessment] = useState<FitAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [storedUrl, setStoredUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
        // Don't show error to user on initial load, just log it
        console.error('Failed to load stored data:', appError);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Check URL when tab changes
  useEffect(() => {
    const checkUrl = async () => {
      const url = await getCurrentTabUrl();
      setCurrentUrl(url);
    };

    // Check immediately
    checkUrl();

    // Set up interval to check URL changes (popup stays open)
    const interval = setInterval(checkUrl, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setValidationError(null); // Clear previous validation errors
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Extract job description using service
      const jobDescription = await extractJobDescription(tab.id);
      
      // Validate job description before sending to backend
      const validationResult = validateJobDescription(
        jobDescription.text,
        jobDescription.url // Pass URL for validation
      );
      
      if (!validationResult.isValid && validationResult.error) {
        // Show validation error to user
        setValidationError(validationResult.error);
        setIsLoading(false);
        return; // Stop here, don't send request to backend
      }
      
      // Analyze job using API (only if validation passed)
      const analysisResult = await analyzeJobAPI(
        jobDescription.text
        // Optional: add toneOverride and targetRoleOverride from profile if needed
      );
      
      // Convert API response to local format
      const localAssessment = convertAPIAssessment(analysisResult.fit_assessment);
      
      // Set the assessment data
      setAssessment(localAssessment);
      
      // Create history entry
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
      
      // Add to history (max 10 entries, deduplicated)
      const updatedHistory = addToHistory(jobHistory, historyEntry);
      setJobHistory(updatedHistory);
      
      // Save to storage
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
      
      // Notify CoverLetterTab to update (via custom event)
      window.dispatchEvent(new CustomEvent('coverLetterUpdated', { 
        detail: { coverLetter: analysisResult.cover_letter_text } 
      }));
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

  // Check if URL has changed (new job posting)
  const urlChanged = currentUrl && storedUrl && currentUrl !== storedUrl;

  // Show empty state if no assessment data
  if (!assessment) {
    return (
      <>
        {/* Toolbar */}
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
            onClick={() => setShowHistoryModal(true)}
            className="h-9"
          >
            <HistoryIcon className="h-4 w-4" />
            {jobHistory.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {jobHistory.length}
              </span>
            )}
          </Button>
        </div>

        <EmptyState 
          onAnalyze={handleAnalyze} 
          isLoading={isLoading}
          validationError={validationError}
          onDismissError={() => setValidationError(null)}
        />
        
        {/* History Modal */}
        <JobHistoryModal
          open={showHistoryModal}
          onOpenChange={setShowHistoryModal}
          history={jobHistory}
        />
      </>
    );
  }

  // Show assessment results with URL change banner if needed
  return (
    <>
      {/* Toolbar */}
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
          onClick={() => setShowHistoryModal(true)}
          className="h-9"
        >
          <HistoryIcon className="h-4 w-4" />
          {jobHistory.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
              {jobHistory.length}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Main Analysis */}
        <div className="space-y-4">
          {/* Validation Error Alert */}
          {validationError && (
            <Alert
              variant="warning"
              title={validationError.userMessage}
              description={validationError.message}
              suggestion={validationError.suggestion}
              onClose={() => setValidationError(null)}
            />
          )}
          
          {/* URL Change Banner - Show when user navigated to a new job */}
          {urlChanged && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1 text-foreground">
                  New Job Posting Detected
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  You're viewing a different job posting. Analyze this new position to get updated insights.
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Analyze This Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Decision Helper */}
          <div className={cn("rounded-lg border-2 p-4", getDecisionColor(assessment.decisionHelper))}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5" style={{ color: 'inherit' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'inherit' }}>Recommendation</h3>
            </div>
            <p className="text-base font-bold mb-2" style={{ color: 'inherit' }}>{assessment.decisionHelper}</p>
            <p className="text-sm mt-2" style={{ color: 'inherit', opacity: 0.9 }}>
              {assessment.decisionHelper === 'Apply Immediately' && 
                "Your profile strongly matches this role. Submit your application with confidence!"}
              {assessment.decisionHelper === 'Tailor & Apply' && 
                "Good match overall, but consider tailoring your resume to highlight missing skills."}
              {assessment.decisionHelper === 'Skip for Now' && 
                "This role may not be the best fit. Consider focusing on better-matched opportunities."}
            </p>
          </div>

          {/* ATS Score Gauge - Compact */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">ATS Score</h3>
            <ATSGauge score={assessment.matchScore} />
          </div>
        </div>

        {/* Right Column - Flags & Details */}
        <div className="space-y-4">
          {/* Fit Assessment Header */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Fit Assessment</h3>
              <span className={cn("text-base font-bold", getFitColor(assessment.label))}>
                {assessment.label}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Match Score</span>
                <span className="font-semibold text-base">{assessment.matchScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${assessment.matchScore}%` }}
                />
              </div>
            </div>

            {/* Green Flags */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-sm">Green Flags</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {assessment.greenFlags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 text-xs mt-0.5">✓</span>
                    <span className="text-sm text-foreground">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <h4 className="font-semibold text-sm">Red Flags</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {assessment.redFlags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 text-xs mt-0.5">✗</span>
                    <span className="text-sm text-foreground">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* History Modal */}
      <JobHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        history={jobHistory}
      />
    </>
  );
};

