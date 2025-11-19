/**
 * Utility functions for Summary Tab components
 */

import type { FitLabel, DecisionHelper } from "./types";

export function getFitColor(label: FitLabel): string {
  switch (label) {
    case "Strong Fit":
      return "text-green-600";
    case "Medium Fit":
      return "text-yellow-600";
    case "Weak Fit":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

export function getDecisionColor(decision: DecisionHelper): string {
  switch (decision) {
    case "Apply Immediately":
      return "bg-green-50 text-green-900 border-green-200";
    case "Tailor & Apply":
      return "bg-yellow-50 text-yellow-900 border-yellow-200";
    case "Skip for Now":
      return "bg-red-50 text-red-900 border-red-200";
    default:
      return "bg-gray-50 text-gray-900 border-gray-200";
  }
}

export function getDecisionDescription(decision: DecisionHelper): string {
  switch (decision) {
    case "Apply Immediately":
      return "Your profile strongly matches this role. Submit your application with confidence!";
    case "Tailor & Apply":
      return "Good match overall, but consider tailoring your resume to highlight missing skills.";
    case "Skip for Now":
      return "This role may not be the best fit. Consider focusing on better-matched opportunities.";
    default:
      return "";
  }
}

export function getGaugeColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}
