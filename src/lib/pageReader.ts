/**
 * Utility functions for reading and analyzing page content
 * This module will be extended to read specific parts of the page
 */

export interface PageContent {
  title: string;
  url: string;
  text: string;
  headings: string[];
  links: string[];
}

/**
 * Extract readable content from the current page
 */
export function readPageContent(): PageContent {
  const title = document.title || '';
  const url = window.location.href;
  const text = document.body.innerText || '';
  
  // Extract headings
  const headings: string[] = [];
  const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headingElements.forEach((heading) => {
    const text = heading.textContent?.trim();
    if (text) {
      headings.push(text);
    }
  });

  // Extract links
  const links: string[] = [];
  const linkElements = document.querySelectorAll('a[href]');
  linkElements.forEach((link) => {
    const href = (link as HTMLAnchorElement).href;
    if (href && !links.includes(href)) {
      links.push(href);
    }
  });

  return {
    title,
    url,
    text,
    headings,
    links,
  };
}

/**
 * Get specific element content by selector
 */
export function getElementContent(selector: string): string | null {
  const element = document.querySelector(selector);
  return element?.textContent?.trim() || null;
}

/**
 * Get all elements matching a selector
 */
export function getElementsContent(selector: string): string[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => el.textContent?.trim() || '').filter(Boolean);
}

