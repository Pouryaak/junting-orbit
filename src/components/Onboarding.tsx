/**
 * Onboarding Component
 * Multi-step onboarding flow for first-time users
 * Shows features and premium features with animations
 */

import { cn } from '@/lib/utils';
import { getLoginUrl } from '@/services/apiService';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Target, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  isPremium?: boolean;
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Junting Orbit',
    description: 'Your AI-powered career companion that helps you land your dream job faster.',
    icon: <Sparkles className="h-12 w-12 text-accent" />,
    features: [
      'Instant job match analysis',
      'ATS compatibility scoring',
      'AI-generated cover letters',
      'Personalized recommendations'
    ],
  },
  {
    title: 'Increase Your Chances',
    description: 'Get instant insights on every job posting to make smarter application decisions.',
    icon: <Target className="h-12 w-12 text-primary" />,
    features: [
      'See your match score before applying',
      'Identify strengths and gaps',
      'Get tailored application advice',
      'Save time on applications'
    ],
  },
  {
    title: 'Coming Soon - Premium Features',
    description: 'Unlock powerful tools to supercharge your job search.',
    icon: <Zap className="h-12 w-12 text-accent" />,
    features: [
      'Job Board - Curated opportunities',
      'Auto CV Tailoring - One-click optimization',
      'Connection & Follow-up Messages - Automated networking',
      'Reminders - Never miss a deadline'
    ],
    isPremium: true,
  },
];

interface OnboardingProps {
  onComplete: () => Promise<void>;
  onSkip: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleGetStarted = async () => {
  try {
    // 1. First, mark onboarding as completed (this saves to chrome.storage)
    await onComplete()
  } finally {
    // 2. Then open the login page
    chrome.tabs.create({ url: getLoginUrl() })
    // (optional) close the popup window explicitly
    window.close()
  }
}

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div
          className={cn(
            'w-full max-w-md transition-all duration-300',
            isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          )}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              'p-4 rounded-full bg-gradient-to-br transition-all duration-500',
              step.isPremium 
                ? 'from-accent/20 to-primary/20' 
                : 'from-primary/20 to-accent/20'
            )}>
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-base text-muted-foreground text-center mb-8">
            {step.description}
          </p>

          {/* Features List */}
          <div className="space-y-3 mb-8">
            {step.features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300',
                  step.isPremium
                    ? 'bg-accent/5 border-accent/20'
                    : 'bg-card border-border',
                  isAnimating ? 'opacity-0' : 'opacity-100'
                )}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <CheckCircle2 className={cn(
                  'h-5 w-5 flex-shrink-0',
                  step.isPremium ? 'text-accent' : 'text-primary'
                )} />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 px-6 pb-4">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === currentStep
                ? 'w-8 bg-primary'
                : 'w-2 bg-muted'
            )}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center p-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
          className={cn(isFirstStep && 'invisible')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

