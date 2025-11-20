---
trigger: always_on
---

CONTEXT
- This project is a browser extension built with React and Vite.
- The codebase uses TypeScript, functional React components, and hooks.
- The extension should be performant, secure, easy to read, easy to maintain, and easy to extend.
- Always follow industry best practices for browser extensions, frontend architecture, performance, and security.

GENERAL RULES
1. Always use React functional components and hooks.
2. Always write TypeScript with explicit, accurate types for props, state, return values, and external data.
3. Prefer small, focused components and functions over large, monolithic ones.
4. Use clear, descriptive names for variables, functions, and components so the code is self-explanatory.
5. Add comments only when necessary to explain why something is done, not what it does.

PROJECT STRUCTURE
6. Organize code by feature or domain, not only by file type.
7. Extract shared logic into reusable hooks (e.g. `hooks/`) and utilities (e.g. `utils/`).
8. Keep extension-specific pieces clearly separated:
   - popup UI
   - options/settings pages
   - background/service worker
   - content scripts
9. Do not mix DOM manipulation logic from content scripts directly into React components. Use clear boundaries.
10. re-use the components we have and if not, use shadcn components, only create your own components when its not already provided there.
11. always run `npm run build` after you make changes, so the extension gets built again.
12. Use structured message passing between background, content scripts, and UI (popup/options) instead of tightly coupling modules.
13. Keep content scripts small and defensive, resilient to DOM changes, and avoid breaking the host page.

SECURITY RULES
14. Never use `eval`, `new Function`, or any dynamic code execution.
15. Avoid using `innerHTML` and other APIs that inject raw HTML. If you must, sanitize input and document why it is safe.
16. Treat all external data (API responses, page DOM, user input, storage, messages) as untrusted. Validate and narrow types.
17. Do not store secrets (API keys, tokens, credentials) in the frontend code or repository.
18. Use patterns that are compatible with strict Content Security Policy (no inline scripts or inline event handlers).
19. Avoid exposing sensitive information in logs, error messages, or browser storage.

PERFORMANCE RULES
20. Avoid unnecessary re-renders. Split components by responsibility and avoid passing large objects deeply when not needed.
21. Use `useMemo`, `useCallback`, and `React.memo` only when they clearly help performance.
22. Keep heavy or long-running work off the main thread when possible (e.g. background scripts or web workers).
23. Debounce or throttle expensive event handlers (scroll, resize, key events) when needed.
24. Use lazy loading or code-splitting for non-critical UI such as advanced settings pages.

MAINTAINABILITY AND EXTENSIBILITY
25. Write code that is easy to read first, then optimize only when necessary.
26. Avoid tight coupling between modules. Use clear interfaces and simple data contracts.
27. Prefer pure functions and side-effect-free utilities where possible.
28. When adding a feature, look for existing hooks, utilities, or components to reuse before creating new ones.
29. Make components configurable via props instead of hardcoding behavior or values.

STATE MANAGEMENT AND DATA FLOW
30. Use local component state for UI-only concerns.
31. Use React context or other shared state solutions only when multiple parts of the app truly need the same data.
32. Keep state structures simple and explicit. Avoid deeply nested state when possible.
33. When using browser APIs (storage, runtime messaging, tabs, etc.), wrap them in small, typed utility modules instead of calling them directly everywhere.

STORAGE AND SYNC
34. Access `chrome.storage` / `browser.storage` through a dedicated abstraction layer.
35. Validate data loaded from storage and handle missing or corrupted data gracefully.
36. Design stored data to be versioned and migratable (for example, store a version and implement simple migrations when you change the schema).

ERROR HANDLING AND UX
37. Always handle errors for async operations (APIs, storage, messaging, DOM queries).
38. Fail gracefully: display appropriate error or fallback UI instead of crashing or leaving blank states.
39. Never allow a single failing feature to break the entire extension.
40. Use logging that helps debugging in development but does not leak sensitive data.
43. Follow the existing linting and formatting rules (ESLint, Prettier, etc.). Do not disable rules without a short, clear reason.

DEPENDENCIES
44. Keep dependencies minimal. Before adding a new package, check if you can solve the problem with built-in APIs or existing dependencies.
45. Avoid large libraries when a small, focused solution is enough.
46. Do not introduce packages that are unmaintained or have known security issues.

PRINCIPLE
49. Always prefer clarity over cleverness.
50. Code must be:
   - easy to read
   - easy to maintain
   - easy to extend
   - performant
   - secure
   - aligned with best practices for React, Vite, and browser extensions.
