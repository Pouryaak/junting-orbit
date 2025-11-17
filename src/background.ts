/// <reference types="chrome" />

/**
 * Background service worker for Junting Orbit extension
 * Handles extension lifecycle and messaging
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Junting Orbit extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((
  message: { type: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    // This will be used later to read page content
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

