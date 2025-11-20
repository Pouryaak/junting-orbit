/**
 * Job History Utilities
 * Manages job analysis history with security and storage optimization
 *
 * Security: URL validation, XSS prevention, size limits
 * Storage: Max 10 entries, ~2KB each, ~20KB total
 * Privacy: All data stored locally on user's device
 */

import { sanitizeString, sanitizeUrl } from "./storage";

// Maximum number of history entries to store (keeps storage under 25KB)
export const MAX_HISTORY_ITEMS = 20;

// Maximum string lengths for security and storage optimization
const MAX_TITLE_LENGTH = 200;
const MAX_COMPANY_LENGTH = 100;
const MAX_FLAG_LENGTH = 150;
const MAX_FLAGS_PER_ENTRY = 3; // Store only top 3 flags

export interface JobHistoryEntry {
  id: string; // SHA-256 hash of URL for deduplication
  url: string; // Sanitized URL
  title: string; // Job title (sanitized, max 200 chars)
  company: string; // Company name (sanitized, max 100 chars)
  matchScore: number; // 0-100
  label: "Strong Fit" | "Medium Fit" | "Weak Fit";
  decisionHelper: "Apply Immediately" | "Tailor & Apply" | "Skip for Now";
  topGreenFlags: string[]; // Max 3 flags, 150 chars each
  topRedFlags: string[]; // Max 3 flags, 150 chars each
  analyzedAt: number; // Unix timestamp
  appliedAt?: number; // Unix timestamp when marked as applied (optional)
}

/**
 * Generate a unique ID for a job URL using SHA-256
 * This prevents duplicate entries and ensures consistent IDs
 */
export async function generateJobId(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, 16); // Use first 16 chars for shorter ID
}

/**
 * Validate a job history entry
 */
export function validateHistoryEntry(entry: unknown): entry is JobHistoryEntry {
  if (!entry || typeof entry !== "object") return false;

  const e = entry as Partial<JobHistoryEntry>;

  // Validate required string fields
  if (typeof e.id !== "string" || e.id.length !== 16) return false;
  if (typeof e.title !== "string" || e.title.length > MAX_TITLE_LENGTH)
    return false;
  if (typeof e.company !== "string" || e.company.length > MAX_COMPANY_LENGTH)
    return false;

  // Validate URL
  if (typeof e.url !== "string") return false;
  try {
    const parsed = new URL(e.url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
  } catch {
    return false;
  }

  // Validate numbers
  if (
    typeof e.matchScore !== "number" ||
    e.matchScore < 0 ||
    e.matchScore > 100
  )
    return false;
  if (typeof e.analyzedAt !== "number" || e.analyzedAt < 0) return false;

  // Validate enums
  if (!["Strong Fit", "Medium Fit", "Weak Fit"].includes(e.label as string))
    return false;
  if (
    !["Apply Immediately", "Tailor & Apply", "Skip for Now"].includes(
      e.decisionHelper as string
    )
  )
    return false;

  // Validate arrays
  if (
    !Array.isArray(e.topGreenFlags) ||
    e.topGreenFlags.length > MAX_FLAGS_PER_ENTRY
  )
    return false;
  if (
    !Array.isArray(e.topRedFlags) ||
    e.topRedFlags.length > MAX_FLAGS_PER_ENTRY
  )
    return false;

  // Validate array contents
  for (const flag of [...e.topGreenFlags, ...e.topRedFlags]) {
    if (typeof flag !== "string" || flag.length > MAX_FLAG_LENGTH) return false;
  }

  return true;
}

/**
 * Sanitize a flag string (green/red flag)
 */
function sanitizeFlag(flag: string): string {
  return sanitizeString(flag).slice(0, MAX_FLAG_LENGTH);
}

/**
 * Create a new job history entry from analysis data
 * Automatically sanitizes all inputs
 */
export async function createHistoryEntry(data: {
  url: string;
  title?: string;
  company?: string;
  matchScore: number;
  label: "Strong Fit" | "Medium Fit" | "Weak Fit";
  decisionHelper: "Apply Immediately" | "Tailor & Apply" | "Skip for Now";
  greenFlags: string[];
  redFlags: string[];
}): Promise<JobHistoryEntry> {
  // Sanitize URL
  const sanitizedUrl = sanitizeUrl(data.url);
  if (!sanitizedUrl) {
    throw new Error("Invalid URL");
  }

  // Generate unique ID
  const id = await generateJobId(sanitizedUrl);

  // Sanitize and truncate strings
  const title = sanitizeString(data.title || "Untitled Job").slice(
    0,
    MAX_TITLE_LENGTH
  );
  const company = sanitizeString(data.company || "Unknown Company").slice(
    0,
    MAX_COMPANY_LENGTH
  );

  // Take only top 3 flags and sanitize
  const topGreenFlags = data.greenFlags
    .slice(0, MAX_FLAGS_PER_ENTRY)
    .map(sanitizeFlag)
    .filter((f) => f.length > 0);

  const topRedFlags = data.redFlags
    .slice(0, MAX_FLAGS_PER_ENTRY)
    .map(sanitizeFlag)
    .filter((f) => f.length > 0);

  return {
    id,
    url: sanitizedUrl,
    title,
    company,
    matchScore: Math.max(0, Math.min(100, data.matchScore)), // Clamp to 0-100
    label: data.label,
    decisionHelper: data.decisionHelper,
    topGreenFlags,
    topRedFlags,
    analyzedAt: Date.now(),
  };
}

/**
 * Add a new entry to history, maintaining max size and deduplication
 * Returns the updated history array
 */
export function addToHistory(
  currentHistory: JobHistoryEntry[],
  newEntry: JobHistoryEntry
): JobHistoryEntry[] {
  // Validate all entries
  if (!Array.isArray(currentHistory)) {
    currentHistory = [];
  }

  // Filter out invalid entries and deduplicate by ID
  const validHistory = currentHistory.filter(
    (entry) => validateHistoryEntry(entry) && entry.id !== newEntry.id
  );

  // Add new entry at the beginning (most recent first)
  const updatedHistory = [newEntry, ...validHistory];

  // Keep only the most recent MAX_HISTORY_ITEMS
  return updatedHistory.slice(0, MAX_HISTORY_ITEMS);
}

/**
 * Filter history by label
 */
export function filterByLabel(
  history: JobHistoryEntry[],
  labels: Array<"Strong Fit" | "Medium Fit" | "Weak Fit">
): JobHistoryEntry[] {
  return history.filter((entry) => labels.includes(entry.label));
}

/**
 * Filter history by time range
 */
export function filterByTimeRange(
  history: JobHistoryEntry[],
  days: number
): JobHistoryEntry[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return history.filter((entry) => entry.analyzedAt >= cutoff);
}

/**
 * Sort history by match score (descending)
 */
export function sortByScore(history: JobHistoryEntry[]): JobHistoryEntry[] {
  return [...history].sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get statistics from history
 */
export function getHistoryStats(history: JobHistoryEntry[]): {
  total: number;
  strongFit: number;
  mediumFit: number;
  weakFit: number;
  averageScore: number;
} {
  const total = history.length;
  const strongFit = history.filter((e) => e.label === "Strong Fit").length;
  const mediumFit = history.filter((e) => e.label === "Medium Fit").length;
  const weakFit = history.filter((e) => e.label === "Weak Fit").length;
  const averageScore =
    total > 0
      ? Math.round(history.reduce((sum, e) => sum + e.matchScore, 0) / total)
      : 0;

  return { total, strongFit, mediumFit, weakFit, averageScore };
}

/**
 * Mark a job as applied by URL
 * Returns updated history array
 */
export async function markJobAsApplied(
  history: JobHistoryEntry[],
  url: string
): Promise<JobHistoryEntry[]> {
  const jobId = await generateJobId(url);

  return history.map((entry) => {
    if (entry.id === jobId) {
      return {
        ...entry,
        appliedAt: Date.now(),
      };
    }
    return entry;
  });
}

/**
 * Check if a job has been applied to by URL
 */
export async function isJobApplied(
  history: JobHistoryEntry[],
  url: string
): Promise<boolean> {
  const jobId = await generateJobId(url);
  const entry = history.find((e) => e.id === jobId);
  return !!entry?.appliedAt;
}

/**
 * Get job entry by URL
 */
export async function getJobByUrl(
  history: JobHistoryEntry[],
  url: string
): Promise<JobHistoryEntry | null> {
  const jobId = await generateJobId(url);
  return history.find((e) => e.id === jobId) || null;
}
