/**
 * Centralized error handling utility
 * Provides consistent error handling and user-friendly error messages
 * 
 * Security: Sanitizes error messages to prevent information leakage
 * Testability: Pure functions, easy to mock
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  userMessage: string;
}

/**
 * Create a user-friendly error message
 * Security: Doesn't expose internal error details
 */
function createUserMessage(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the analysis service. Please check your internet connection and try again.';
    case ErrorType.STORAGE:
      return 'Unable to save your data. Please try again.';
    case ErrorType.VALIDATION:
      return 'The job description could not be read. Please make sure you\'re on a job posting page.';
    case ErrorType.PERMISSION:
      return 'Permission denied. Please check extension permissions.';
    case ErrorType.UNKNOWN:
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Classify error type from error message or error object
 */
function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('api')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('storage') || message.includes('chrome.storage')) {
      return ErrorType.STORAGE;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('missing')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ErrorType.PERMISSION;
    }
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Handle and format errors consistently
 * 
 * @param error - Error to handle
 * @param context - Additional context for logging
 * @returns Formatted error object
 */
export function handleError(error: unknown, context?: string): AppError {
  const type = classifyError(error);
  const originalError = error instanceof Error ? error : undefined;
  const message = originalError?.message || 'Unknown error';
  
  // Log error with context (for debugging, but sanitized)
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error('Error:', error);
  }
  
  return {
    type,
    message,
    originalError,
    userMessage: createUserMessage(type),
  };
}

/**
 * Show error to user in a user-friendly way
 * 
 * @param error - Error to display
 * @param onDismiss - Optional callback when error is dismissed
 */
export function showErrorToUser(error: AppError, onDismiss?: () => void): void {
  // In a production app, you might want to use a toast notification system
  // For now, using alert but this should be replaced with a proper UI component
  alert(error.userMessage);
  
  if (onDismiss) {
    onDismiss();
  }
}

