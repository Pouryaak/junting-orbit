---
applyTo: "**"
---

## Project & Tech Stack

- This repository contains a **Chrome extension (Manifest V3)** plus supporting code (background/service worker, content scripts, popup UI, options pages, and shared libraries).
- Prefer **TypeScript** over JavaScript for all new code.
- Prefer a **modular, layered architecture**: small, focused modules over large files; separate domain logic from UI and from infrastructure (APIs, storage, browser APIs).
- Always favor **pure, testable functions** for business logic. Keep side effects (DOM access, Chrome APIs, network calls) well isolated.

---

## UI, Design Language & Components

- When generating UI, **use our existing components first**. Only suggest a new component if no suitable one exists. When you suggest creating a new component, keep it generic and reusable.
- We use **shadcn/ui** as our component baseline. Prefer shadcn components (Button, Input, Dialog, Sheet, Tooltip, etc.) over building raw HTML from scratch.
- Follow our **design language**:
  - Use our color tokens such as `primary`, `secondary`, and `accent` (or their Tailwind / CSS variable equivalents) instead of hardcoded hex values wherever possible.
  - Prefer semantic tokens/utilities (e.g. `bg-primary`, `text-secondary`, `border-accent`) over raw colors.
  - Respect our spacing, radius, and typography scales if they are present in the project.
- When creating new components:
  - Make them **presentational by default** with props for behavior; avoid tightly coupling them to specific business logic.
  - Keep props **typed and documented** (e.g. with TypeScript interfaces and clear names).
  - Ensure they are **accessible** (ARIA attributes, keyboard navigation, focus states).

---

## Chrome Extension Architecture (Manifest V3)

- Assume **Manifest V3**:
  - Use a `background.service_worker` instead of long-running background pages.
  - Do **not** use remotely hosted code or inline scripts; all JS must be bundled and shipped with the extension. :contentReference[oaicite:3]{index=3}
- Respect Chrome extension structure:
  - Use **content scripts** to interact with the DOM of web pages (e.g., job boards like LinkedIn).
  - Use the **background/service worker** for long-running logic, alarms, listeners, and central coordination.
  - Use **popup** and **options** pages for user-facing configuration and quick actions.
  - Use **message passing** (`chrome.runtime.sendMessage`, `chrome.tabs.sendMessage`, ports) for communication between content scripts, background, and UI.
- When suggesting or editing `manifest.json`:
  - Target `"manifest_version": 3`.
  - Request **only the minimal permissions** required for the feature (principle of least privilege). :contentReference[oaicite:4]{index=4}
  - Avoid `"host_permissions": ["<all_urls>"]` unless absolutely necessary; prefer specific domains and paths.
  - Explain in comments (or commit messages) why new permissions are needed.
- Optimize for performance:
  - Keep content scripts **lightweight** and avoid heavy work on page load.
  - Move heavier work to the background or to on-demand actions.
  - Avoid unnecessary polling; prefer event-driven patterns where possible.

---

## Security, Privacy & Handling User Data

- Treat all user data as **sensitive** (CVs, job descriptions, notes, ratings, profiles, etc.).
- When generating or modifying code, **always follow security best practices**:
  - **Never use `eval` or similar dynamic code execution** APIs. :contentReference[oaicite:5]{index=5}
  - Do **not** use inline scripts or inline event handlers (`onclick`, `onload` inline) in HTML; use external scripts and proper event listeners.
  - Validate and **sanitize all inputs** (including data from web pages, API responses, and user form inputs) to avoid XSS or injection attacks. :contentReference[oaicite:6]{index=6}
  - Only perform network requests over **HTTPS**; never suggest plain HTTP for production usage. :contentReference[oaicite:7]{index=7}
  - Follow Chrome’s **Content Security Policy (CSP)** requirements for extensions; avoid patterns that break CSP (like inline scripts or `new Function`). :contentReference[oaicite:8]{index=8}
- Data storage:
  - Prefer `chrome.storage` or a clearly defined storage abstraction over arbitrary global variables.
  - Store only what is necessary, and avoid long-term storage of highly sensitive data if not needed.
  - Do not log sensitive user data to the console in production builds.
- Backend communication:
  - Use a **single, well-typed API client layer** for talking to our backend (e.g., for job analysis, fit scoring, etc.).
  - Handle failures gracefully with retries/backoff only when appropriate, and meaningful user feedback (toasts, error messages).
  - Do not expose API keys or secrets in client-side code; expect them to be injected securely (environment variables, build-time config, or via backend).

---

## Code Quality & Structure

- Always aim for **modular, maintainable, and testable** code:
  - Small, focused functions and modules.
  - Clear separation of concerns between UI, domain logic, and infrastructure.
  - No “God objects” or files that mix unrelated responsibilities.
- TypeScript:
  - Prefer **explicit types** for function parameters, return values, and public interfaces.
  - Use discriminated unions and enums where they help express business rules.
- Error handling:
  - Handle errors explicitly; avoid silent failures.
  - Surface errors in a user-friendly way in the UI (toasts, inline messages) and/or structured logs for debugging.

---

## Working Style With This Repository

- When asked to implement a feature:
  - Follow the existing patterns and file structure whenever possible.
  - Reuse existing utilities and abstractions before introducing new ones.
  - If deviating from existing patterns, briefly justify the deviation in code comments or commit messages.
- Prefer **incremental refactors** over big-bang rewrites, especially in areas that are already in production.
- If something is unclear from context, ask clarifying questions in comments or in the PR description (but still try to propose a reasonable default approach).
