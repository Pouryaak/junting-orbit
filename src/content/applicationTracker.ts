/**
 * Application Tracker Content Script
 * Injects "Mark as Applied" button on job posting pages
 *
 * Supported sites: LinkedIn, Indeed, The Hub
 * Security: All user actions validated, XSS prevention
 */

import { getStoredData, saveStoredData } from "@/lib/storage";
import { markJobAsApplied } from "@/lib/jobHistory";

// Button ID to prevent duplicate injection
const BUTTON_ID = "junting-orbit-applied-btn";

// Track reference element for generic job boards
let fallbackReferenceElement: HTMLElement | null = null;

type JobSite = "linkedin" | "indeed" | "thehub" | "seek" | "unknown";

interface SiteConfig {
  hostnameIncludes: string[];
  isJobPage: (pathname: string, href: string) => boolean;
  getContainer: () => HTMLElement | null;
  getReference?: () => HTMLElement | null;
  styleButton?: (button: HTMLButtonElement) => void;
  placeButton?: (button: HTMLButtonElement, container: HTMLElement, reference: HTMLElement | null) => void;
}

const SITE_CONFIGS: Record<JobSite, SiteConfig> = {
  linkedin: {
    hostnameIncludes: ["linkedin.com"],
    isJobPage: (pathname, href) =>
      pathname.includes("/jobs/view/") ||
      pathname.includes("/jobs/collections/") ||
      pathname.includes("/jobs/search/") ||
      href.includes("linkedin.com/jobs/view/"),
    getContainer: () => {
      // Method 1: Look for the save button and get its parent container (the flex container)
      const saveButton = document.querySelector<HTMLElement>(".jobs-save-button");
      if (saveButton && saveButton.parentElement) {
        return saveButton.parentElement;
      }

      // Method 2: Look for apply button container
      const applyButton = document.querySelector<HTMLElement>(".jobs-apply-button");
      if (applyButton && applyButton.closest(".display-flex")) {
        return applyButton.closest<HTMLElement>(".display-flex");
      }

      // Method 3: Direct selector for the flex container
      const flexContainer = document.querySelector<HTMLElement>(".mt4 > .display-flex");
      if (flexContainer) {
        return flexContainer;
      }
      return null;
    }
  },
  indeed: {
    hostnameIncludes: ["indeed.com"],
    isJobPage: (pathname) =>
      pathname.includes("/viewjob") ||
      (pathname.includes("/jobs") && window.location.search.includes("vjk=")),
    getContainer: () => {
      // Look for the specific view job button container to insert after it
      const viewJobContainer = document.getElementById("viewJobButtonLinkContainer");
      if (viewJobContainer) {
        return viewJobContainer.parentElement;
      }

      // Fallback: Look for the main job actions container
      const mainContainer = document.getElementById("jobsearch-ViewJobButtons-container");
      if (mainContainer) {
        return mainContainer;
      }
      return null;
    },
    getReference: () => {
      const viewJobContainer = document.getElementById("viewJobButtonLinkContainer");
      const saveJobContainer = document.getElementById("saveJobButtonContainer");
      return viewJobContainer || saveJobContainer;
    }
  },
  thehub: {
    hostnameIncludes: ["thehub.io"],
    isJobPage: (pathname) => pathname.startsWith("/jobs/"),
    getContainer: () => {
      const jobBody = document.querySelector<HTMLElement>(".view-job-details__body");
      if (jobBody) {
        fallbackReferenceElement = jobBody;
        return jobBody.parentElement ?? jobBody;
      }
      return null;
    },
    getReference: () => document.querySelector<HTMLElement>(".view-job-details__body"),
    styleButton: (button) => {
      button.style.marginLeft = "0";
      button.style.marginBottom = "16px";
    },
    placeButton: (button, container, reference) => {
      if (reference && container.contains(reference)) {
        reference.insertAdjacentElement("beforebegin", button);
      } else {
        container.insertBefore(button, container.firstChild);
      }
    }
  },
  seek: {
    hostnameIncludes: ["seek.com", "seek.co"],
    isJobPage: (pathname) => pathname.startsWith("/job/") || pathname.startsWith("/jobs"),
    getContainer: () => null // Fallback to universal
  },
  unknown: {
    hostnameIncludes: [],
    isJobPage: () => false,
    getContainer: () => null
  }
};

/**
 * Detect current job site
 */
function detectJobSite(): JobSite {
  const hostname = window.location.hostname.toLowerCase();
  
  for (const [site, config] of Object.entries(SITE_CONFIGS)) {
    if (site === "unknown") continue;
    if (config.hostnameIncludes.some(h => hostname.includes(h))) {
      return site as JobSite;
    }
  }

  return "unknown";
}

/**
 * Check if current page is a job posting
 */
function isJobPostingPage(): boolean {
  const site = getJobSite();
  const pathname = window.location.pathname;
  const href = window.location.href;

  const config = SITE_CONFIGS[site];
  if (config && site !== "unknown") {
    if (config.isJobPage(pathname, href)) {
      return true;
    }
  }

  // Universal fallback
  const allButtons = Array.from(
    document.querySelectorAll("button, a[role='button'], a[href*='apply'], a")
  );
  return allButtons.some((btn) => {
    const text = btn.textContent?.toLowerCase() || "";
    const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
    const href = btn.getAttribute("href")?.toLowerCase() || "";
    return (
      text.includes("apply") ||
      ariaLabel.includes("apply") ||
      href.includes("apply")
    );
  });
}

/**
 * Find container element where button should be injected
 */
function findButtonContainer(): HTMLElement | null {
  fallbackReferenceElement = null;
  const site = getJobSite();
  const config = SITE_CONFIGS[site];

  if (config && site !== "unknown") {
    const container = config.getContainer();
    if (container) return container;
  }

  // Universal fallback
  const allButtons = Array.from(
    document.querySelectorAll<HTMLElement>(
      "button, a[role='button'], a[href*='apply'], a"
    )
  );
  const applyButton = allButtons.find((btn) => {
    const text = btn.textContent?.toLowerCase() || "";
    const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
    const href = btn.getAttribute("href")?.toLowerCase() || "";
    return (
      text.includes("apply") ||
      ariaLabel.includes("apply") ||
      href.includes("apply")
    );
  });

  if (applyButton) {
    fallbackReferenceElement = applyButton;
    return applyButton.parentElement ?? applyButton;
  }

  return null;
}

/**
 * Find the reference element used for site-specific placement
 */
function findReferenceElement(): HTMLElement | null {
  const site = getJobSite();
  const config = SITE_CONFIGS[site];

  if (config && config.getReference) {
    const ref = config.getReference();
    if (ref) return ref;
  }

  if (fallbackReferenceElement) {
    return fallbackReferenceElement;
  }

  return null;
}

/**
 * Create the "Mark as Applied" button with Junting Orbit branding
 */
function createAppliedButton(isApplied: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";

  // Brand colors: Primary #2c3a8a, Secondary #7c5dff
  const primaryColor = "#2c3a8a";
  const primaryHover = "#243170";

  // Styling with brand colors - 8px radius to match our theme
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    margin-left: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    background-color: ${primaryColor};
    color: white;
    min-height: 40px;
  `;

  // Add hover effect
  button.onmouseenter = () => {
    button.style.backgroundColor = primaryHover;
  };

  button.onmouseleave = () => {
    button.style.backgroundColor = primaryColor;
  };

  // Get logo from extension
  const logoUrl = chrome.runtime.getURL("logo.png");

  // Button content with logo - same logo for both states
  const text = isApplied ? "Applied" : "Mark as Applied";
  
  const img = document.createElement("img");
  img.src = logoUrl;
  img.alt = "JO";
  img.style.width = "16px";
  img.style.height = "16px";
  img.style.borderRadius = "2px";
  img.style.objectFit = "contain";
  
  const span = document.createElement("span");
  span.textContent = text;
  
  button.appendChild(img);
  button.appendChild(span);

  return button;
}

function applySiteSpecificButtonStyles(
  button: HTMLButtonElement,
  site: JobSite
) {
  const config = SITE_CONFIGS[site];
  if (config && config.styleButton) {
    config.styleButton(button);
  }
}

function placeButton(
  button: HTMLButtonElement,
  container: HTMLElement,
  site: JobSite
) {
  const config = SITE_CONFIGS[site];
  const referenceElement = findReferenceElement();

  if (config && config.placeButton) {
    config.placeButton(button, container, referenceElement);
    return;
  }

  if (referenceElement && container.contains(referenceElement)) {
    referenceElement.insertAdjacentElement("afterend", button);
    return;
  }

  container.appendChild(button);
}

/**
 * Handle button click - mark job as applied
 */
async function handleMarkAsApplied() {
  try {
    const url = window.location.href;

    // Get current history
    const stored = await getStoredData();
    const history = stored.jobHistory || [];

    // Mark as applied
    const updatedHistory = await markJobAsApplied(history, url);

    // Save to storage
    await saveStoredData({
      ...stored,
      jobHistory: updatedHistory,
    });

    // Update button UI
    updateButtonState(true);

    // Show success message
    showSuccessMessage();
  } catch (error) {
    console.error("Failed to mark job as applied:", error);
    showErrorMessage();
  }
}

/**
 * Update button state
 */
function updateButtonState(isApplied: boolean) {
  const existingButton = document.getElementById(BUTTON_ID);
  if (existingButton) {
    existingButton.remove();
  }

  const container = findButtonContainer();
  if (container) {
    const site = getJobSite();
    const newButton = createAppliedButton(isApplied);
    if (!isApplied) {
      newButton.onclick = handleMarkAsApplied;
    }

    applySiteSpecificButtonStyles(newButton, site);
    placeButton(newButton, container, site);
  }
}

/**
 * Show success message with brand colors
 */
function showSuccessMessage() {
  const message = document.createElement("div");
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #7c5dff;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(124, 93, 255, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Create SVG icon
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", "20 6 9 17 4 12");
  svg.appendChild(polyline);

  const span = document.createElement("span");
  span.textContent = "Marked as applied!";

  message.appendChild(svg);
  message.appendChild(span);

  document.body.appendChild(message);

  setTimeout(() => {
    message.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => message.remove(), 300);
  }, 2000);
}

/**
 * Show error message with brand colors
 */
function showErrorMessage() {
  const message = document.createElement("div");
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ef4444;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Create SVG icon
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "18");
  line1.setAttribute("y1", "6");
  line1.setAttribute("x2", "6");
  line1.setAttribute("y2", "18");
  
  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "6");
  line2.setAttribute("y1", "6");
  line2.setAttribute("x2", "18");
  line2.setAttribute("y2", "18");

  svg.appendChild(line1);
  svg.appendChild(line2);

  const span = document.createElement("span");
  span.textContent = "Failed to mark as applied";

  message.appendChild(svg);
  message.appendChild(span);

  document.body.appendChild(message);

  setTimeout(() => message.remove(), 2000);
}

// Track initialization state to prevent race conditions
/**
 * State Management
 */
let currentSite: JobSite | null = null;
let isInitializing = false;
let navigationTimeout: NodeJS.Timeout | null = null;
let observer: MutationObserver | null = null;

/**
 * Get the current job site, cached for performance
 */
function getJobSite(): JobSite {
  if (!currentSite) {
    currentSite = detectJobSite();
  }
  return currentSite;
}

/**
 * Initialize the button injection logic
 */
async function initializeButton() {
  // Prevent concurrent initializations
  if (isInitializing) {
    return;
  }

  // Check if button already exists (fast check)
  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  isInitializing = true;

  try {
    // Check if we're on a job posting page
    const isJobPage = isJobPostingPage();

    if (!isJobPage) {
      return;
    }

    // Fast polling for container
    // We check every 100ms to be responsive, up to 10 seconds
    let container: HTMLElement | null = null;
    let attempts = 0;
    const maxAttempts = 100; 

    while (!container && attempts < maxAttempts) {
      // Double-check if button was injected by another process
      if (document.getElementById(BUTTON_ID)) {
        return;
      }

      container = findButtonContainer();
      
      if (!container) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
    }

    // Final check before injection
    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    if (!container) {
      return;
    }

    await injectButton(container);
  } finally {
    isInitializing = false;
  }
}

/**
 * Inject the button into the container
 */
async function injectButton(container: HTMLElement) {
  try {
    const url = window.location.href;
    const stored = await getStoredData();
    const history = stored.jobHistory || [];
    
    // Check if already applied
    const isApplied = history.some((job) => job.url === url);

    // Create and place button
    const site = getJobSite();
    const button = createAppliedButton(isApplied);
    
    if (!isApplied) {
      button.onclick = handleMarkAsApplied;
    }

    applySiteSpecificButtonStyles(button, site);
    placeButton(button, container, site);

  } catch (error) {
    console.error("Error injecting button:", error);
  }
}

/**
 * Observe page changes (SPA navigation)
 * Optimized to be less aggressive
 */
function observePageChanges() {
  let lastUrl = window.location.href;

  // Disconnect existing observer if any
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    // Cheap check: has URL changed?
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      // Remove old button immediately to prevent stale state
      const oldButton = document.getElementById(BUTTON_ID);
      if (oldButton) {
        oldButton.remove();
      }

      // Clear any pending initialization
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }

      // Reinitialize after navigation with short debounce
      // 200ms is enough to let the framework start rendering but fast enough to feel instant
      navigationTimeout = setTimeout(() => {
        // Reset cached site on navigation as we might have moved sections
        // (though unlikely to change domain, but good for safety)
        currentSite = null; 
        initializeButton();
      }, 200);
    }
  });

  // Observe body for changes
  // We need subtree: true for SPAs, but we rely on the fast URL check in the callback
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize
// Run immediately
initializeButton();
// Start observing
observePageChanges();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // Initial load can be immediate or slightly delayed
    setTimeout(initializeButton, 100);
  });
} else {
  // If already loaded, start immediately
  initializeButton();
  observePageChanges();
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
