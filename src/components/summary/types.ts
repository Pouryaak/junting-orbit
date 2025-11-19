/**
 * Shared types for Summary Tab components
 */

export interface FitAssessment {
  label: "Strong Fit" | "Medium Fit" | "Weak Fit";
  matchScore: number; // 0-100
  greenFlags: string[];
  redFlags: string[];
  decisionHelper: "Apply Immediately" | "Tailor & Apply" | "Skip for Now";
}

export type DecisionHelper = FitAssessment["decisionHelper"];
export type FitLabel = FitAssessment["label"];
