/**
 * Empty State Component
 * Shown when no job analysis is available
 */

import React from 'react';
import { BarChart3, FileText, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import type { ValidationError } from '@/lib/jobDescriptionValidator';

interface EmptyStateProps {
  onAnalyze: () => void;
  isLoading: boolean;
  validationError: ValidationError | null;
  onDismissError: () => void;
  isQuotaDepleted: boolean;
  dailyLimit: number | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAnalyze,
  isLoading,
  validationError,
  onDismissError,
  isQuotaDepleted,
  dailyLimit,
}) => {
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

      {isQuotaDepleted && (
        <div className="w-full mb-6">
          <Alert
            variant="info"
            title="All free boosts used for today 🎉"
            description={`Thanks for putting the analyzer to work! You're on the free plan with ${(dailyLimit ?? 5)} daily runs. Fresh credits drop tomorrow at midnight.`}
            suggestion="Premium (launching soon) unlocks unlimited deep dives—can't wait to share it with you!"
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
        <FeatureCard
          icon={<BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />}
          title="ATS Score"
          description="Compatibility rating"
        />
        <FeatureCard
          icon={<Target className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />}
          title="Fit Assessment"
          description="Match analysis"
        />
        <FeatureCard
          icon={<FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />}
          title="Cover Letter"
          description="AI-generated"
        />
        <FeatureCard
          icon={<TrendingUp className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />}
          title="Recommendations"
          description="Actionable insights"
        />
      </div>

      {/* CTA Button */}
      {isQuotaDepleted ? (
        <div className="w-full max-w-md rounded-lg border border-dashed border-primary/40 bg-primary/5 px-5 py-4 text-primary">
          <p className="font-semibold text-sm mb-1">Take a breather 😌</p>
          <p className="text-sm leading-relaxed opacity-90">
            Daily free analyses reset tomorrow. Premium (coming soon) will unlock unlimited runs—stay tuned!
          </p>
        </div>
      ) : (
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
      )}

      {/* Helper Text */}
      {!isQuotaDepleted && (
        <p className="text-xs text-muted-foreground mt-4">
          Make sure you're on a job posting page
        </p>
      )}
    </div>
  );
};

// Feature Card Sub-component
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
      {icon}
      <div className="text-left">
        <div className="font-semibold text-sm mb-1">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
};
