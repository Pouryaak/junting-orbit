/**
 * Application Tracker Content Script
 * Injects "Mark as Applied" button on job posting pages
 *
 * Supported sites: LinkedIn, Indeed
 * Security: All user actions validated, XSS prevention
 */

import { getStoredData, saveStoredData } from "@/lib/storage";
import { markJobAsApplied, isJobApplied } from "@/lib/jobHistory";

// Button ID to prevent duplicate injection
const BUTTON_ID = "junting-orbit-applied-btn";

// Track reference element for generic job boards
let fallbackReferenceElement: HTMLElement | null = null;

/**
 * Detect current job site
 */
function detectJobSite(): "linkedin" | "indeed" | "unknown" {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes("linkedin.com")) return "linkedin";
  if (hostname.includes("indeed.com")) return "indeed";

  return "unknown";
}

/**
 * Check if current page is a job posting
 */
function isJobPostingPage(): boolean {
  const site = detectJobSite();
  const pathname = window.location.pathname;
  const href = window.location.href;

  if (site === "linkedin") {
    // Check for various LinkedIn job page patterns
    return (
      pathname.includes("/jobs/view/") ||
      pathname.includes("/jobs/collections/") ||
      pathname.includes("/jobs/search/") ||
      href.includes("linkedin.com/jobs/view/")
    );
  }

  if (site === "indeed") {
    return (
      pathname.includes("/viewjob") ||
      (pathname.includes("/jobs") && window.location.search.includes("vjk="))
    );
  }

  // Universal fallback: Check if there's an "Apply" button on the page
  // This helps catch job pages on any site
  const allButtons = Array.from(
    document.querySelectorAll("button, a[role='button'], a[href*='apply'], a")
  );
  const hasApplyButton = allButtons.some((btn) => {
    const text = btn.textContent?.toLowerCase() || "";
    const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
    const href = btn.getAttribute("href")?.toLowerCase() || "";
    return (
      text.includes("apply") ||
      ariaLabel.includes("apply") ||
      href.includes("apply")
    );
  });

  return hasApplyButton;
}

/**
 * Find container element where button should be injected
 */
function findButtonContainer(): HTMLElement | null {
  fallbackReferenceElement = null;
  const site = detectJobSite();

  if (site === "linkedin") {
    // Method 1: Look for the save button and get its parent container (the flex container)
    const saveButton = document.querySelector<HTMLElement>(".jobs-save-button");
    if (saveButton && saveButton.parentElement) {
      // The parent should be the display-flex div that contains both Apply and Save buttons
      return saveButton.parentElement;
    }

    // Method 2: Look for apply button container
    const applyButton =
      document.querySelector<HTMLElement>(".jobs-apply-button");
    if (applyButton && applyButton.closest(".display-flex")) {
      return applyButton.closest<HTMLElement>(".display-flex");
    }

    // Method 3: Direct selector for the flex container
    const flexContainer = document.querySelector<HTMLElement>(
      ".mt4 > .display-flex"
    );
    if (flexContainer) {
      return flexContainer;
    }
  }

  if (site === "indeed") {
    // Look for the specific view job button container to insert after it
    const viewJobContainer = document.getElementById(
      "viewJobButtonLinkContainer"
    );
    if (viewJobContainer) {
      return viewJobContainer.parentElement;
    }

    // Fallback: Look for the main job actions container
    const mainContainer = document.getElementById(
      "jobsearch-ViewJobButtons-container"
    );
    if (mainContainer) {
      return mainContainer;
    }
  }

  // Universal fallback: Find any button with "apply" text (case-insensitive)
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
    // Return the parent container if it exists
    return applyButton.parentElement ?? applyButton;
  }

  return null;
}

/**
 * Find the reference element to insert button after (Indeed only)
 */
function findReferenceElement(): HTMLElement | null {
  const site = detectJobSite();

  if (site === "indeed") {
    // Try to find viewJobButtonLinkContainer first, then saveJobButtonContainer as fallback
    const viewJobContainer = document.getElementById(
      "viewJobButtonLinkContainer"
    );
    const saveJobContainer = document.getElementById("saveJobButtonContainer");

    console.log("[Junting Orbit] Indeed reference elements:", {
      viewJobContainer: !!viewJobContainer,
      saveJobContainer: !!saveJobContainer,
    });

    return viewJobContainer || saveJobContainer;
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
  button.innerHTML = `<img src="${logoUrl}" alt="JO" style="width: 16px; height: 16px; border-radius: 2px; object-fit: contain;"> <span>${text}</span>`;

  return button;
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
    const newButton = createAppliedButton(isApplied);
    if (!isApplied) {
      newButton.onclick = handleMarkAsApplied;
    }

    // For Indeed, insert after the reference element
    const referenceElement = findReferenceElement();
    if (referenceElement && container.contains(referenceElement)) {
      referenceElement.after(newButton);
    } else {
      container.appendChild(newButton);
    }
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
  `;

  // Add checkmark SVG icon
  message.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Marked as applied!</span>
    </div>
  `;

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
  `;

  // Add X icon
  message.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span>Failed to mark as applied</span>
    </div>
  `;

  document.body.appendChild(message);

  setTimeout(() => message.remove(), 2000);
}

/**
 * Initialize button injection
 */
async function initializeButton() {
  console.log("[Junting Orbit] initializeButton called");

  // Check if we're on a job posting page
  const isJobPage = isJobPostingPage();
  console.log("[Junting Orbit] Is job page:", isJobPage);

  if (!isJobPage) {
    return;
  }

  // Check if button already exists
  if (document.getElementById(BUTTON_ID)) {
    console.log("[Junting Orbit] Button already exists");
    return;
  }

  // Wait a bit for the page to fully load
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Find container with multiple retries
  let container = findButtonContainer();
  let retries = 0;

  while (!container && retries < 3) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    container = findButtonContainer();
    retries++;
  }

  if (!container) {
    return;
  }

  return await injectButton(container);
}

/**
 * Helper to inject button into container
 */
async function injectButton(container: HTMLElement) {
  try {
    // Check if job has been applied to
    const url = window.location.href;
    const stored = await getStoredData();
    const history = stored.jobHistory || [];
    const isApplied = await isJobApplied(history, url);

    // Create and inject button
    const button = createAppliedButton(isApplied);
    if (!isApplied) {
      button.onclick = handleMarkAsApplied;
    }

    const referenceElement = findReferenceElement();
    if (referenceElement && container.contains(referenceElement)) {
      referenceElement.insertAdjacentElement("afterend", button);
    } else {
      container.appendChild(button);
    }
  } catch (error) {
    console.error("Failed to initialize application tracker:", error);
  }
}

/**
 * Watch for page changes (SPA navigation)
 */
function observePageChanges() {
  let lastUrl = window.location.href;

  // Watch for URL changes
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      // Remove old button
      const oldButton = document.getElementById(BUTTON_ID);
      if (oldButton) {
        oldButton.remove();
      }

      // Reinitialize after navigation
      setTimeout(initializeButton, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize when DOM is ready
console.log("[Junting Orbit] Content script loaded on:", window.location.href);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[Junting Orbit] DOM loaded, checking for job page");
    setTimeout(initializeButton, 1000);
    observePageChanges();
  });
} else {
  console.log("[Junting Orbit] DOM already loaded, checking for job page");
  setTimeout(initializeButton, 1000);
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
