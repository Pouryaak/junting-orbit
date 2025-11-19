/**
 * Job Description Validator
 * Validates job descriptions before sending to the backend
 *
 * Design principles:
 * - Modularity: Pure functions, easy to test
 * - Extensibility: Easy to add new validation rules
 * - User-friendly: Clear error messages for each validation failure
 */

export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  userMessage: string;
  suggestion: string;
}

export enum ValidationErrorType {
  EMPTY = "EMPTY",
  TOO_SHORT = "TOO_SHORT",
  INVALID_CONTENT = "INVALID_CONTENT",
  NO_JOB_KEYWORDS = "NO_JOB_KEYWORDS",
  INVALID_URL = "INVALID_URL",
}

// Configuration constants - easy to adjust
const VALIDATION_CONFIG = {
  MIN_LENGTH: 200, // Increased from 100 - Minimum characters for a valid job description
  MIN_WORD_COUNT: 30, // Increased from 20 - Minimum word count
  IDEAL_MIN_LENGTH: 300, // Increased from 200 - Recommended minimum for quality analysis
  MIN_KEYWORD_MATCHES: 5, // Increased from 3 - Minimum job keywords required
} as const;

/**
 * Job site URL patterns - only these URLs are considered valid job postings
 * Add more patterns as needed for different job sites
 */
const JOB_URL_PATTERNS = [
  // LinkedIn - /jobs/collections, /jobs/view, or /jobs/search
  {
    domain: "linkedin.com",
    pattern: /\/jobs\/collections\//i,
    name: "LinkedIn",
  },
  { domain: "linkedin.com", pattern: /\/jobs\/view\//i, name: "LinkedIn" },
  { domain: "linkedin.com", pattern: /\/jobs\/search\//i, name: "LinkedIn" },

  // Indeed - /jobs with query params or /viewjob
  { domain: "indeed.com", pattern: /\/jobs\?.*vjk=/i, name: "Indeed" },
  { domain: "indeed.com", pattern: /\/viewjob/i, name: "Indeed" },

  // Glassdoor
  { domain: "glassdoor.com", pattern: /\/job\//i, name: "Glassdoor" },
  { domain: "glassdoor.co.uk", pattern: /\/job\//i, name: "Glassdoor" },

  // Monster
  { domain: "monster.com", pattern: /\/job-openings\//i, name: "Monster" },

  // ZipRecruiter
  { domain: "ziprecruiter.com", pattern: /\/jobs\//i, name: "ZipRecruiter" },

  // Seek (Australia, New Zealand, etc.)
  { domain: "seek.com", pattern: /\/jobs\?.*jobid=/i, name: "Seek" },

  // AngelList/Wellfound
  { domain: "wellfound.com", pattern: /\/jobs\//i, name: "Wellfound" },
  { domain: "angel.co", pattern: /\/jobs\//i, name: "AngelList" },

  // Remote.co
  { domain: "remote.co", pattern: /\/job\//i, name: "Remote.co" },

  // We Work Remotely
  {
    domain: "weworkremotely.com",
    pattern: /\/remote-jobs\//i,
    name: "We Work Remotely",
  },

  // Dice
  { domain: "dice.com", pattern: /\/jobs\/detail\//i, name: "Dice" },

  // Stack Overflow Jobs
  {
    domain: "stackoverflow.com",
    pattern: /\/jobs\/\d+/i,
    name: "Stack Overflow",
  },

  // Hired
  { domain: "hired.com", pattern: /\/jobs\//i, name: "Hired" },

  // General pattern for company career pages
  {
    domain: null,
    pattern: /\/(careers?|jobs)\/[^/]+\/?$/i,
    name: "Company Career Page",
  },
] as const;

/**
 * Common job-related keywords to detect if content is actually a job description
 */
const JOB_KEYWORDS = [
  // Role identifiers
  "responsibilities",
  "requirements",
  "qualifications",
  "experience",
  "duties",
  "role",
  "position",
  "candidate",
  "skills",
  "job",
  // Common job terms
  "salary",
  "compensation",
  "benefits",
  "team",
  "work",
  "apply",
  "years",
  "bachelor",
  "master",
  "degree",
  "education",
  // Action verbs common in JDs
  "develop",
  "manage",
  "lead",
  "collaborate",
  "design",
  "implement",
  "create",
  "build",
  "maintain",
  "contribute",
] as const;

/**
 * Validate if URL is a known job posting page
 */
function validateJobUrl(url: string): ValidationResult {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;
    const fullPath = pathname + parsedUrl.search; // Include query string for matching

    // Check against known patterns
    for (const pattern of JOB_URL_PATTERNS) {
      // If domain is specified, check if it matches
      if (pattern.domain) {
        if (!hostname.includes(pattern.domain)) {
          continue;
        }
      }

      // Check if pathname + query string matches the pattern
      if (pattern.pattern.test(fullPath)) {
        return { isValid: true };
      }
    }

    // If no pattern matched, return error
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.INVALID_URL,
        message: `URL does not match known job posting patterns: ${url}`,
        userMessage: "This doesn't appear to be a job posting page",
        suggestion: `Please navigate to a job posting page on sites like LinkedIn (/jobs/view/...), Indeed, Glassdoor, or company career pages. Current page: ${hostname}${pathname}`,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.INVALID_URL,
        message: "Invalid URL format",
        userMessage: "Could not validate the page URL",
        suggestion: "Please ensure you're on a valid job posting page",
      },
    };
  }
}

/**
 * Validate if text is empty or whitespace only
 */
function validateNotEmpty(text: string): ValidationResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.EMPTY,
        message: "Job description is empty",
        userMessage: "No job description found on this page",
        suggestion: "Please navigate to a job posting page and try again",
      },
    };
  }

  return { isValid: true };
}

/**
 * Validate minimum length requirements
 */
function validateLength(text: string): ValidationResult {
  const trimmed = text.trim();
  const wordCount = trimmed
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Check absolute minimum length
  if (trimmed.length < VALIDATION_CONFIG.MIN_LENGTH) {
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.TOO_SHORT,
        message: `Job description too short (${trimmed.length} characters, minimum ${VALIDATION_CONFIG.MIN_LENGTH})`,
        userMessage:
          "The content on this page seems too short to be a job description",
        suggestion:
          "Make sure you're on a complete job posting page, not a job listing or search results",
      },
    };
  }

  // Check word count
  if (wordCount < VALIDATION_CONFIG.MIN_WORD_COUNT) {
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.TOO_SHORT,
        message: `Job description has too few words (${wordCount} words, minimum ${VALIDATION_CONFIG.MIN_WORD_COUNT})`,
        userMessage: "The content on this page is too brief",
        suggestion: "Navigate to the full job posting to get detailed analysis",
      },
    };
  }

  return { isValid: true };
}

/**
 * Validate that content looks like a job description
 * Checks for common job-related keywords
 */
function validateJobKeywords(text: string): ValidationResult {
  const lowerText = text.toLowerCase();

  // Count how many job keywords are present
  const matchedKeywords = JOB_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );

  // Require at least MIN_KEYWORD_MATCHES job-related keywords to consider it a valid JD
  if (matchedKeywords.length < VALIDATION_CONFIG.MIN_KEYWORD_MATCHES) {
    return {
      isValid: false,
      error: {
        type: ValidationErrorType.NO_JOB_KEYWORDS,
        message: `Insufficient job-related keywords found (${matchedKeywords.length}/${VALIDATION_CONFIG.MIN_KEYWORD_MATCHES})`,
        userMessage: "This doesn't appear to be a job description",
        suggestion:
          "Please navigate to a job posting with details about requirements, responsibilities, and qualifications",
      },
    };
  }

  return { isValid: true };
}

/**
 * Validate content quality - detect if it's likely navigation, footer, or irrelevant content
 */
function validateContentQuality(text: string): ValidationResult {
  // Red flags that indicate we're reading the wrong content
  const redFlags = [
    // Too many navigation/UI elements
    { pattern: /(sign in|log in|sign out|log out)/gi, threshold: 5 },
    { pattern: /(cookie|privacy policy|terms of service)/gi, threshold: 3 },
    { pattern: /(previous|next|page \d+)/gi, threshold: 5 },
    // LinkedIn-specific non-job content
    { pattern: /(messaging|messages|inbox|notifications)/gi, threshold: 3 },
    { pattern: /(connection request|connect|view profile)/gi, threshold: 5 },
  ];

  for (const { pattern, threshold } of redFlags) {
    const matches = text.match(pattern);
    if (matches && matches.length >= threshold) {
      return {
        isValid: false,
        error: {
          type: ValidationErrorType.INVALID_CONTENT,
          message: "Content appears to contain too many navigation/UI elements",
          userMessage:
            "We detected mostly navigation or page elements instead of job content",
          suggestion:
            "Please navigate to a job posting page, not a messaging, profile, or search results page",
        },
      };
    }
  }

  return { isValid: true };
}

/**
 * Main validation function - runs all validation checks
 *
 * @param jobDescription - The extracted job description text
 * @param url - The URL of the page (for URL validation)
 * @returns ValidationResult with isValid flag and optional error details
 *
 * @example
 * const result = validateJobDescription(extractedText, currentUrl);
 * if (!result.isValid) {
 *   showError(result.error.userMessage, result.error.suggestion);
 * }
 */
export function validateJobDescription(
  jobDescription: string,
  url?: string
): ValidationResult {
  // Run validations in order of priority
  const validations = [
    // First check URL if provided (fast check)
    ...(url ? [() => validateJobUrl(url)] : []),
    // Then check content
    validateNotEmpty,
    validateLength,
    validateJobKeywords,
    validateContentQuality,
  ];

  for (const validate of validations) {
    const result = validate(jobDescription);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

/**
 * Check if URL is a valid job posting URL (without validating content)
 * Useful for early detection before extraction
 */
export function isValidJobUrl(url: string): boolean {
  return validateJobUrl(url).isValid;
}

/**
 * Get a quality score for the job description (0-100)
 * Higher scores indicate better quality content for analysis
 *
 * @param jobDescription - The extracted job description text
 * @returns Quality score from 0 to 100
 */
export function getJobDescriptionQuality(jobDescription: string): number {
  let score = 0;
  const trimmed = jobDescription.trim();
  const lowerText = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;

  // Length score (0-30 points)
  if (trimmed.length >= VALIDATION_CONFIG.IDEAL_MIN_LENGTH) {
    score += 30;
  } else if (trimmed.length >= VALIDATION_CONFIG.MIN_LENGTH) {
    score += 15;
  }

  // Word count score (0-20 points)
  if (wordCount >= 100) {
    score += 20;
  } else if (wordCount >= 50) {
    score += 10;
  }

  // Keyword relevance score (0-50 points)
  const matchedKeywords = JOB_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
  score += Math.min(50, matchedKeywords.length * 5);

  return Math.min(100, score);
}
