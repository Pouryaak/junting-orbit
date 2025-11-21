/**
 * Job Analysis Service
 * Handles communication with backend API and job description extraction
 *
 * Security: Input validation, output sanitization, error handling
 * Testability: Injectable dependencies, pure functions where possible
 * Extensibility: Easy to add new job sites and analysis types
 */

import type { StoredData } from "@/lib/storage";

export interface JobDescription {
  text: string;
  url: string;
  title?: string;
  company?: string;
}

export interface AnalysisRequest {
  jobDescription: string;
  url: string;
}

export interface AnalysisResponse {
  assessment: StoredData["assessment"];
  coverLetter: string;
}

/**
 * Extract job description from page
 * Modular design allows easy extension for different job sites
 */
export async function extractJobDescription(
  tabId: number
): Promise<JobDescription> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Base extraction - can be extended for specific sites
        const url = window.location.href;
        const hostname = window.location.hostname.toLowerCase();
        
        // Site-specific title and company extraction
        let title = "";
        let company = "";

        if (hostname.includes("linkedin.com")) {
          title = document.querySelector(".job-details-jobs-unified-top-card__job-title, h1")?.textContent?.trim() || "";
          company = document.querySelector(".job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name")?.textContent?.trim() || "";
        } else if (hostname.includes("indeed.com")) {
          title = document.querySelector('h2[data-testid="jobsearch-JobInfoHeader-title"] span')?.textContent?.trim() || 
                  document.querySelector('h2[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() || "";
          company = document.querySelector("[data-company-name='true'], .jobsearch-CompanyInfoContainer a")?.textContent?.trim() || "";
        } else if (hostname.includes("seek.com")) {
          title = document.querySelector('[data-automation="job-detail-title"] a')?.textContent?.trim() || 
                  document.querySelector('[data-automation="job-detail-title"]')?.textContent?.trim() || "";
          company = document.querySelector('[data-automation="advertiser-name"]')?.textContent?.trim() || "";
        } else if (hostname.includes("thehub.io")) {
          title = document.querySelector("h2.view-job-details__title")?.textContent?.trim() || "";
          company = document.querySelector(".view-job-details__company-name")?.textContent?.trim() || "";
        } else {
          // Universal fallback
          title = document.querySelector("h1")?.textContent?.trim() || "";
          company = document.querySelector('[data-testid="company-name"], .company-name, h2')?.textContent?.trim() || "";
        }
        let jobDescription = "";
        const collectDeepText = (root: Element): string => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const parts: string[] = [];

          while (walker.nextNode()) {
            const value = walker.currentNode.textContent?.trim();
            if (value) {
              parts.push(value);
            }
          }

          return parts.join("\n");
        };

        // Indeed-specific: grab full nested content from jobDescriptionText container
        if (hostname.includes("indeed.com")) {
          const indeedDescription =
            document.getElementById("jobDescriptionText");
          if (indeedDescription) {
            jobDescription = collectDeepText(indeedDescription);
          }
        }

        // Seek-specific: capture nested content from jobAdDetails container
        if (!jobDescription && hostname.includes("seek.com")) {
          const seekDescription = document.querySelector(
            '[data-automation="jobAdDetails"]'
          );
          if (seekDescription) {
            jobDescription = collectDeepText(seekDescription);
          }
        }

        if (!jobDescription && hostname.includes("thehub.io")) {
          const hubDescription = document.querySelector(
            ".view-job-details__body"
          );
          if (hubDescription) {
            jobDescription = collectDeepText(hubDescription);
          }
        }

        // Try to find job description container (common selectors)
        const descriptionSelectors = [
          "#jobDescriptionText",
          '[data-automation="jobAdDetails"]',
          '[data-testid="job-description"]',
          ".jobs-description__container",
          ".job-description",
          "#job-description",
          '[class*="description"]',
          "main",
          "article",
        ];

        for (const selector of descriptionSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            jobDescription = collectDeepText(element);
            if (jobDescription.length > 100) break; // Found substantial content
          }
        }

        // Fallback to body if no specific container found
        if (!jobDescription || jobDescription.length < 100) {
          jobDescription = document.body.innerText || "";
        }

        return {
          text: jobDescription.trim(),
          url,
          title: title || undefined,
          company: company || undefined,
        };
      },
    });

    const pageData = results[0]?.result;

    if (!pageData || !pageData.text || pageData.text.length < 50) {
      throw new Error("Could not extract sufficient job description from page");
    }

    // Validate and sanitize
    if (pageData.text.length > 50000) {
      throw new Error("Job description too large");
    }

    return {
      text: pageData.text.slice(0, 50000), // Limit size
      url: pageData.url,
      title: pageData.title,
      company: pageData.company,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract job description: ${error.message}`);
    }
    throw new Error("Failed to extract job description: Unknown error");
  }
}

/**
 * Analyze job description via backend API
 *
 * @param request - Analysis request with job description and URL
 * @returns Analysis response with assessment and cover letter
 * @throws {Error} If API call fails
 */
export async function analyzeJob(
  request: AnalysisRequest,
  _apiUrl?: string // Reserved for future API URL configuration
): Promise<AnalysisResponse> {
  // Validate input
  if (!request.jobDescription || request.jobDescription.length < 50) {
    throw new Error("Job description is too short or missing");
  }

  if (!request.url) {
    throw new Error("URL is required");
  }

  // TODO: Replace with actual API endpoint
  // const API_URL = apiUrl || process.env.VITE_API_URL || 'YOUR_BACKEND_URL/api/analyze';

  try {
    // For now, simulate API call
    // In production, replace with:
    /*
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify({
        jobDescription: request.jobDescription,
        url: request.url,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.assessment || !data.coverLetter) {
      throw new Error('Invalid API response structure');
    }
    
    return data;
    */

    // Mock response for development
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      assessment: {
        label: "Strong Fit",
        matchScore: 85,
        greenFlags: [
          "Your experience matches 90% of required skills",
          "Previous role aligns with job responsibilities",
        ],
        redFlags: [
          "Missing 2 years of required experience",
          "No experience with specific tool mentioned",
        ],
        decisionHelper: "Apply Immediately",
      },
      coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the position. Based on my experience and the job requirements, I believe I would be an excellent fit for this role.

[AI-generated personalized content based on job description and resume]

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience align with your needs.

Best regards,
[Your Name]`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error("Analysis failed: Unknown error");
  }
}

/**
 * Validate analysis response structure
 */
export function validateAnalysisResponse(
  data: unknown
): data is AnalysisResponse {
  if (!data || typeof data !== "object") return false;

  const d = data as Partial<AnalysisResponse>;

  if (!d.assessment || typeof d.assessment !== "object") return false;
  if (!d.coverLetter || typeof d.coverLetter !== "string") return false;

  const a = d.assessment;
  if (!["Strong Fit", "Medium Fit", "Weak Fit"].includes(a.label)) return false;
  if (
    typeof a.matchScore !== "number" ||
    a.matchScore < 0 ||
    a.matchScore > 100
  )
    return false;
  if (!Array.isArray(a.greenFlags) || !Array.isArray(a.redFlags)) return false;
  if (
    !["Apply Immediately", "Tailor & Apply", "Skip for Now"].includes(
      a.decisionHelper
    )
  )
    return false;

  return true;
}
