import React from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingButton } from '../components/FloatingButton';
import '../styles/globals.css';
import './content.css';

/**
 * Content script entry point
 * This script runs in the context of web pages
 */
function initExtension() {
  // Check if the extension is already injected
  if (document.getElementById('junting-orbit-root')) {
    return;
  }

  // Create a container for our React app
  const container = document.createElement('div');
  container.id = 'junting-orbit-root';

  // Append to body
  document.body.appendChild(container);

  // Create React root and render
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <FloatingButton />
    </React.StrictMode>
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}

// Re-initialize on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Small delay to ensure DOM is ready
    setTimeout(initExtension, 100);
  }
}).observe(document, { subtree: true, childList: true });

