/**
 * Storage utility for persisting extension data
 * Uses chrome.storage.local to persist assessment and cover letter data
 * 
 * Security: All data is validated before storage to prevent injection attacks
 * Testability: Pure functions with dependency injection support
 */

export interface StoredData {
  assessment: {
    label: 'Strong Fit' | 'Medium Fit' | 'Weak Fit';
    matchScore: number;
    greenFlags: string[];
    redFlags: string[];
    decisionHelper: 'Apply Immediately' | 'Tailor & Apply' | 'Skip for Now';
  } | null;
  coverLetter: string | null;
  analyzedUrl: string | null;
  analyzedAt: number | null;
  hasCompletedOnboarding?: boolean;
}

const STORAGE_KEY = 'junting-orbit-data';
const MAX_STORAGE_SIZE = 1024 * 1024; // 1MB limit for safety

/**
 * Validate stored data structure to prevent corrupted data
 */
function validateStoredData(data: unknown): data is StoredData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Partial<StoredData>;
  
  // Validate assessment if present
  if (d.assessment !== null && d.assessment !== undefined) {
    if (typeof d.assessment !== 'object') return false;
    const a = d.assessment;
    if (!['Strong Fit', 'Medium Fit', 'Weak Fit'].includes(a.label)) return false;
    if (typeof a.matchScore !== 'number' || a.matchScore < 0 || a.matchScore > 100) return false;
    if (!Array.isArray(a.greenFlags) || !Array.isArray(a.redFlags)) return false;
    if (!['Apply Immediately', 'Tailor & Apply', 'Skip for Now'].includes(a.decisionHelper)) return false;
    if (
    'hasCompletedOnboarding' in data &&
    typeof data.hasCompletedOnboarding !== 'boolean'
  ) {
    return false;
  }
  }
  
  // Validate cover letter
  if (d.coverLetter !== null && d.coverLetter !== undefined) {
    if (typeof d.coverLetter !== 'string') return false;
    if (d.coverLetter.length > 10000) return false; // Reasonable limit
  }
  
  // Validate URL
  if (d.analyzedUrl !== null && d.analyzedUrl !== undefined) {
    if (typeof d.analyzedUrl !== 'string') return false;
    try {
      new URL(d.analyzedUrl); // Validate URL format
    } catch {
      return false;
    }
  }
  
  // Validate timestamp
  if (d.analyzedAt !== null && d.analyzedAt !== undefined) {
    if (typeof d.analyzedAt !== 'number' || d.analyzedAt < 0) return false;
  }
  
  return true;
}

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Sanitize URL to prevent malicious URLs
 */
function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Get stored data from chrome.storage with validation
 * 
 * @throws {Error} If storage operation fails
 */
export async function getStoredData(): Promise<StoredData> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage read failed: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        const data = result[STORAGE_KEY];
        
        // If no data, return default
        if (!data) {
          resolve({
            assessment: null,
            coverLetter: null,
            analyzedUrl: null,
            analyzedAt: null,
            hasCompletedOnboarding: false,
          });
          return;
        }
        
        // Validate data structure
        if (!validateStoredData(data)) {
          console.warn('Invalid stored data detected, resetting to defaults');
          // Clear corrupted data
          chrome.storage.local.remove([STORAGE_KEY]);
          resolve({
            assessment: null,
            coverLetter: null,
            analyzedUrl: null,
            analyzedAt: null,
            hasCompletedOnboarding: false,
          });
          return;
        }
        
        resolve(data);
      });
    } catch (error) {
      reject(new Error(`Storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Save data to chrome.storage with validation and sanitization
 * 
 * @param data - Data to store (will be sanitized)
 * @throws {Error} If storage operation fails or data is invalid
 */
export async function saveStoredData(data: StoredData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Validate data before saving
      if (!validateStoredData(data)) {
        reject(new Error('Invalid data structure'));
        return;
      }
      
      // Sanitize data
      const sanitized: StoredData = {
        assessment: data.assessment,
        coverLetter: data.coverLetter ? sanitizeString(data.coverLetter) : null,
        analyzedUrl: data.analyzedUrl ? sanitizeUrl(data.analyzedUrl) : null,
        analyzedAt: data.analyzedAt,
        hasCompletedOnboarding:
    typeof data.hasCompletedOnboarding === 'boolean'
      ? data.hasCompletedOnboarding
      : false,
      };
      
      // Check storage size (approximate)
      const dataSize = JSON.stringify(sanitized).length;
      if (dataSize > MAX_STORAGE_SIZE) {
        reject(new Error('Data too large to store'));
        return;
      }
      
      chrome.storage.local.set({ [STORAGE_KEY]: sanitized }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage write failed: ${chrome.runtime.lastError.message}`));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(new Error(`Storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Clear stored data
 * 
 * @throws {Error} If storage operation fails
 */
export async function clearStoredData(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage clear failed: ${chrome.runtime.lastError.message}`));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(new Error(`Storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Get current tab URL with validation
 * 
 * @returns Current tab URL or null if unavailable
 * @throws {Error} If operation fails
 */
export async function getCurrentTabUrl(): Promise<string | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url) {
      return null;
    }
    
    // Validate and sanitize URL
    return sanitizeUrl(tab.url);
  } catch (error) {
    console.error('Error getting current tab URL:', error);
    return null;
  }
}
