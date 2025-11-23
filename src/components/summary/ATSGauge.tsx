/**
 * ATS Gauge Component
 * Circular gauge displaying ATS compatibility score
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { getGaugeColor } from './utils';

interface ATSGaugeProps {
  score: number;
}

interface ScoreInsight {
  range: string;
  description: string;
}

function getScoreInsight(score: number): ScoreInsight {
  if (score >= 90) {
    return {
      range: '90–100',
      description:
        'Very strong keyword overlap and clear structure. Your resume already looks highly ATS-optimized.',
    };
  }

  if (score >= 70) {
    return {
      range: '70–89',
      description:
        'Good match overall. Add a few missing keywords and tighten formatting to push it into the top tier.',
    };
  }

  if (score >= 40) {
    return {
      range: '40–69',
      description:
        'Some overlap is there, but the structure and keywords need love. ATS will likely treat it as a middling match.',
    };
  }

  return {
    range: '0–39',
    description:
      'Minimal keyword alignment and/or weak structure. ATS systems will probably rank it low—time for a glow-up.',
  };
}

export const ATSGauge: React.FC<ATSGaugeProps> = ({ score }) => {
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getGaugeColor(score);
  const insight = getScoreInsight(score);

  return (
    <div className="flex flex-col items-center justify-center p-0 space-y-6">
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
            <div className="text-sm text-muted-foreground mt-1">ATS Score</div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 text-left">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">ATS insight</h4>
          <p className="text-md leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground"></span> {insight.description}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Suggested updates to your resume</h4>
          <div className="relative overflow-hidden rounded-lg border border-dashed border-primary/40 bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Premium unlocks tailored keyword boosts, formatting tweaks, and ATS-ready recommendations for this role. Hang tight—Junting Orbit Premium is rolling out soon.
              </p>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                <Lock className="h-3 w-3" />
                Premium feature coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
