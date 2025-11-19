/**
 * Fit Assessment Card Component
 * Shows match score, green flags, and red flags
 */

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFitColor } from './utils';
import type { FitAssessment } from './types';

interface FitAssessmentCardProps {
  assessment: FitAssessment;
}

export const FitAssessmentCard: React.FC<FitAssessmentCardProps> = ({ assessment }) => {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Fit Assessment</h3>
        <span className={cn("text-base font-bold", getFitColor(assessment.label))}>
          {assessment.label}
        </span>
      </div>
      
      {/* Match Score Progress Bar */}
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
  );
};
