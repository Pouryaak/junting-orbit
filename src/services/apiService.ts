/**
 * API Service for Junting Orbit
 * Handles all communication with the backend API
 * 
 * Security: Uses credentials: 'include' for cookie-based auth
 * Testability: Injectable base URL, error handling
 */

const API_BASE_URL = 'https://junting-orbit-server.vercel.app';

export interface UserProfile {
  full_name: string | null;
  resume_text: string | null;
  preferred_tone: 'neutral' | 'warm' | 'formal' | null;
  target_role: string | null;
  location: string | null;
}

export interface ProfileUpdate {
  full_name?: string;
  resume_text?: string;
  preferred_tone?: 'neutral' | 'warm' | 'formal';
  target_role?: string;
  location?: string;
}

export interface FitAssessment {
  label: 'Strong' | 'Medium' | 'Weak';
  match_score: number;
  ats_match_percentage: number;
  green_flags: string[];
  red_flags: string[];
  decision_helper: 'Apply Immediately' | 'Tailor & Apply' | 'Skip for Now';
}

export interface AnalysisResponse {
  fit_assessment: FitAssessment;
  cover_letter_text: string;
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
      method: 'GET',
      credentials: 'include',
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
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('Unauthorized - Please log in at https://junting-orbit-server.vercel.app/login');
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Failed to load profile' }));
    throw new Error(error.error || 'Failed to load profile');
  }

  return response.json();
}

/**
 * Update user profile
 * 
 * @param profile - Profile data to update (partial)
 * @throws {Error} If request fails or validation error
 */
export async function updateProfile(profile: ProfileUpdate): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(profile),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized - Please log in at https://junting-orbit-server.vercel.app/login');
  }

  if (response.status === 400) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Invalid request body' }));
    throw new Error(error.error || 'Invalid request body');
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Failed to save profile' }));
    throw new Error(error.error || 'Failed to save profile');
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
export async function analyzeJob(
  jobDescription: string,
  toneOverride?: 'neutral' | 'warm' | 'formal',
  targetRoleOverride?: string
): Promise<AnalysisResponse> {
  const payload: {
    jobDescription: string;
    toneOverride?: 'neutral' | 'warm' | 'formal';
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized - Please log in at https://junting-orbit-server.vercel.app/login');
  }

  if (response.status === 400) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Invalid request body' }));
    
    if (error.error?.includes('Missing resume') || error.error?.includes('resume')) {
      throw new Error('Missing resume in profile. Please save your resume in settings before analyzing jobs.');
    }
    
    throw new Error(error.error || 'Invalid request body');
  }

  if (response.status === 502) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Failed to generate analysis' }));
    throw new Error(error.error || 'Failed to generate analysis. Please try again.');
  }

  if (response.status === 500) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Internal server error' }));
    
    if (error.details && typeof error.details === 'string' && error.details.includes('quota')) {
      throw new Error('AI quota exhausted. Please try again later or check your plan.');
    }
    
    throw new Error(error.error || 'Unexpected error, please try again.');
  }

  if (!response.ok) {
    throw new Error('Failed to analyze job');
  }

  return response.json();
}

/**
 * Get login URL
 */
export function getLoginUrl(): string {
  return 'https://junting-orbit-server.vercel.app/login';
}

