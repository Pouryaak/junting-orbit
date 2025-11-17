import React from 'react';
import { Sparkles, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FitAssessment {
  label: 'Strong Fit' | 'Medium Fit' | 'Weak Fit';
  matchScore: number; // 0-100
  greenFlags: string[];
  redFlags: string[];
  decisionHelper: 'Apply Immediately' | 'Tailor & Apply' | 'Skip for Now';
}

// Mock data - will be replaced with real data later
const mockAssessment: FitAssessment = {
  label: 'Strong Fit',
  matchScore: 85,
  greenFlags: [
    'Your experience matches 90% of required skills',
    'Previous role aligns with job responsibilities'
  ],
  redFlags: [
    'Missing 2 years of required experience',
    'No experience with specific tool mentioned'
  ],
  decisionHelper: 'Apply Immediately'
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
  const assessment = mockAssessment;

  return (
    <div className="space-y-6">
      {/* AI Evaluation Badge */}
      <div className="flex items-center gap-2 justify-center p-3 bg-accent/10 rounded-lg border border-accent/20">
        <Sparkles className="h-5 w-5 text-accent" />
        <span className="text-sm font-medium text-foreground">
          Evaluated by our career expert AI
        </span>
      </div>

      {/* Decision Helper - Moved to top */}
      <div className={cn("rounded-lg border-2 p-6", getDecisionColor(assessment.decisionHelper))}>
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="h-6 w-6" style={{ color: 'inherit' }} />
          <h3 className="text-xl font-semibold" style={{ color: 'inherit' }}>Recommendation</h3>
        </div>
        <p className="text-lg font-bold mb-2" style={{ color: 'inherit' }}>{assessment.decisionHelper}</p>
        <p className="text-base mt-2" style={{ color: 'inherit', opacity: 0.9 }}>
          {assessment.decisionHelper === 'Apply Immediately' && 
            "Your profile strongly matches this role. Submit your application with confidence!"}
          {assessment.decisionHelper === 'Tailor & Apply' && 
            "Good match overall, but consider tailoring your resume to highlight missing skills."}
          {assessment.decisionHelper === 'Skip for Now' && 
            "This role may not be the best fit. Consider focusing on better-matched opportunities."}
        </p>
      </div>

      {/* ATS Score Gauge */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4 text-center">ATS Compatibility Score</h3>
        <ATSGauge score={assessment.matchScore} />
        <p className="text-center text-muted-foreground mt-4">
          Your resume matches {assessment.matchScore}% of the job requirements
        </p>
      </div>

      {/* Fit Assessment */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Fit Assessment</h3>
          <span className={cn("text-lg font-bold", getFitColor(assessment.label))}>
            {assessment.label}
          </span>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Match Score</span>
            <span className="font-semibold text-lg">{assessment.matchScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${assessment.matchScore}%` }}
            />
          </div>
        </div>

        {/* Green Flags */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-lg">Green Flags</h4>
          </div>
          <ul className="space-y-2 ml-7">
            {assessment.greenFlags.map((flag, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-foreground">{flag}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Red Flags */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-lg">Red Flags</h4>
          </div>
          <ul className="space-y-2 ml-7">
            {assessment.redFlags.map((flag, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-foreground">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

