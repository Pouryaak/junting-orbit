/**
 * API Service for Junting Orbit
 * Handles all communication with the backend API
 *
 * Security: Uses credentials: 'include' for cookie-based auth
 * Testability: Injectable base URL, error handling
 */

const API_BASE_URL = "https://junting-orbit-server.vercel.app";

export interface UserProfile {
  full_name: string | null;
  resume_text: string | null;
  preferred_tone: "neutral" | "warm" | "formal" | null;
  target_role: string | null;
  location: string | null;
}

export interface ProfileUpdate {
  full_name?: string;
  resume_text?: string;
  preferred_tone?: "neutral" | "warm" | "formal";
  target_role?: string;
  location?: string;
}

export interface FitAssessment {
  label: "Strong" | "Medium" | "Weak";
  match_score: number;
  ats_match_percentage: number;
  green_flags: string[];
  red_flags: string[];
  decision_helper: "Apply Immediately" | "Tailor & Apply" | "Skip for Now";
}

export interface AnalysisResponse {
  fit_assessment: FitAssessment;
  cover_letter_text: string;
}

export type FeedbackCategory = "bug" | "feature";

export interface SubmitFeedbackRequest {
  type: FeedbackCategory;
  title: string;
  message: string;
  pageUrl?: string;
}

export interface RateLimitInfo {
  plan: string | null;
  limit?: number | null;
  remaining?: number | null;
}

export interface AnalyzeJobResult {
  analysis: AnalysisResponse;
  rateLimit: RateLimitInfo | null;
}

export class RateLimitError extends Error {
  public readonly rateLimit: RateLimitInfo;
  public readonly status: number;

  constructor(message: string, rateLimit: RateLimitInfo, status = 429) {
    super(message);
    this.name = "RateLimitError";
    this.rateLimit = rateLimit;
    this.status = status;
  }
}

export interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "GET",
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get user profile
 *
 * @throws {Error} If request fails or user is not authenticated
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error(
      "Unauthorized - Please log in at https://junting-orbit-server.vercel.app/login"
    );
  }

  if (!response.ok) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Failed to load profile" }));
    throw new Error(error.error || "Failed to load profile");
  }

  return response.json();
}

/**
 * Update user profile
 *
 * @param profile - Profile data to update (partial)
 * @throws {Error} If request fails or validation error
 */
export async function updateProfile(
  profile: ProfileUpdate
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(profile),
  });

  if (response.status === 401) {
    throw new Error(
      "Unauthorized - Please log in at https://junting-orbit-server.vercel.app/login"
    );
  }

  if (response.status === 400) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Invalid request body" }));
    throw new Error(error.error || "Invalid request body");
  }

  if (!response.ok) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Failed to save profile" }));
    throw new Error(error.error || "Failed to save profile");
  }

  return response.json();
}

/**
 * Analyze a job description
 *
 * @param jobDescription - Job description text
 * @param toneOverride - Optional tone override
 * @param targetRoleOverride - Optional target role override
 * @throws {Error} If request fails, missing resume, or other errors
 */
function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const planHeader = headers.get("X-Usage-Plan");
  const limitHeader = headers.get("X-RateLimit-Limit");
  const remainingHeader = headers.get("X-RateLimit-Remaining");

  if (!planHeader && !limitHeader && !remainingHeader) {
    return null;
  }

  const plan = planHeader ? planHeader.toLowerCase() : null;
  const limit = limitHeader ? Number.parseInt(limitHeader, 10) : null;
  const remaining = remainingHeader
    ? Number.parseInt(remainingHeader, 10)
    : null;

  return {
    plan,
    limit: Number.isNaN(limit) ? null : limit,
    remaining: Number.isNaN(remaining) ? null : remaining,
  };
}

export async function analyzeJob(
  jobDescription: string,
  toneOverride?: "neutral" | "warm" | "formal",
  targetRoleOverride?: string
): Promise<AnalyzeJobResult> {
  const payload: {
    jobDescription: string;
    toneOverride?: "neutral" | "warm" | "formal";
    targetRoleOverride?: string;
  } = {
    jobDescription,
  };

  if (toneOverride) {
    payload.toneOverride = toneOverride;
  }

  if (targetRoleOverride) {
    payload.targetRoleOverride = targetRoleOverride;
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze-job`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const rateLimit = parseRateLimitHeaders(response.headers);

  if (response.status === 401) {
    throw new Error(
      "Unauthorized - Please log in at https://junting-orbit-server.vercel.app/login"
    );
  }

  if (response.status === 400) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Invalid request body" }));

    if (
      error.error?.includes("Missing resume") ||
      error.error?.includes("resume")
    ) {
      throw new Error(
        "Missing resume in profile. Please save your resume in settings before analyzing jobs."
      );
    }

    throw new Error(error.error || "Invalid request body");
  }

  if (response.status === 429) {
    const info: RateLimitInfo = rateLimit || {
      plan: null,
      limit: null,
      remaining: 0,
    };

    throw new RateLimitError(
      "All free analyses used for today 🎉 Fresh credits land tomorrow. Premium (coming soon) unlocks unlimited runs.",
      {
        plan: info.plan,
        limit: typeof info.limit === "number" ? info.limit : null,
        remaining:
          typeof info.remaining === "number" && info.remaining >= 0
            ? info.remaining
            : 0,
      }
    );
  }

  if (response.status === 502) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Failed to generate analysis" }));
    throw new Error(
      error.error || "Failed to generate analysis. Please try again."
    );
  }

  if (response.status === 500) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Internal server error" }));

    if (
      error.details &&
      typeof error.details === "string" &&
      error.details.includes("quota")
    ) {
      throw new Error(
        "AI quota exhausted. Please try again later or check your plan."
      );
    }

    throw new Error(error.error || "Unexpected error, please try again.");
  }

  if (!response.ok) {
    throw new Error("Failed to analyze job");
  }

  const analysis: AnalysisResponse = await response.json();

  return {
    analysis,
    rateLimit,
  };
}

export async function submitFeedback(
  payload: SubmitFeedbackRequest
): Promise<void> {
  if (!payload.message || payload.message.trim().length < 10) {
    throw new Error("Feedback message is too short");
  }

  if (!payload.title || payload.title.trim().length < 3) {
    throw new Error("Please provide a short title for your feedback");
  }

  let sanitizedPageUrl: string | undefined;
  if (payload.pageUrl) {
    try {
      const parsed = new URL(payload.pageUrl.trim());
      if (["http:", "https:"].includes(parsed.protocol)) {
        sanitizedPageUrl = parsed.toString();
      }
    } catch {
      // Ignore invalid URLs, backend will receive undefined
      sanitizedPageUrl = undefined;
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      type: payload.type,
      title: payload.title.trim(),
      description: payload.message.trim(),
      pageUrl: sanitizedPageUrl,
    }),
  });

  if (response.status === 401) {
    throw new Error(
      "You must be signed in to send feedback. Please log in and try again."
    );
  }

  if (response.status === 400) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ error: "Invalid feedback payload" }));
    throw new Error(error.error || "Invalid feedback payload");
  }

  if (response.status === 415) {
    throw new Error("Feedback must be sent as JSON");
  }

  if (!response.ok) {
    throw new Error("Failed to submit feedback. Please try again later.");
  }
}

/**
 * Get login URL
 */
export function getLoginUrl(): string {
  return "https://junting-orbit-server.vercel.app/login";
}
