# Junting Orbit

Junting Orbit is an AI co-pilot for your job hunt. The Chrome extension analyzes job listings in real time, highlights fit, tracks your applications, and drafts tailored cover letters — all without leaving the job board tab.

## Key Features

- **Instant fit analysis** – Send the active job description to our backend and get an ATS score, green/red flags, and a decision helper in seconds.
- **AI cover letters** – Generate personalized cover letters directly from the popup (cached for quick copy/paste).
- **Daily usage tracker** – Free-tier users get a friendly HUD showing today’s plan and remaining runs; premium tiers unlock unlimited analyses.
- **“Mark as Applied” button** – Injects a native-looking button on supported job boards (LinkedIn, Indeed, SEEK) so you never lose track of applications.
- **History tab** – Review every role you’ve analyzed, filter by fit, and jump back to the posting with one click.
- **Feedback loop** – Built-in dialog for reporting bugs or suggesting improvements, wired to the Junting Orbit backend.

## Architecture & Stack

- **Chrome Manifest v3** extension with a service worker background.
- **React 19 + TypeScript** for the popup UI, styled with Tailwind CSS and shadcn/ui components.
- **ES Modules + Vite** build pipeline that outputs a ZIP-ready `dist` directory.
- **Supabase-authenticated API** for analysis endpoints and feedback submission.
- **Least-privilege permissions** – content scripts only run on LinkedIn, Indeed, and SEEK domains; network traffic is limited to the Junting Orbit API.

## Getting Started

### Prerequisites

- Node.js 18+ (and npm)
- Existing icons in `icons/` (16/48/128 px) — the repository already contains production assets.

### Installation

```bash
git clone https://github.com/Pouryaak/junting-orbit.git
cd junting-orbit
npm install
```

### Development Workflow

```bash
npm run dev
```

This runs Vite in watch mode. After each rebuild:

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Reload** on the Junting Orbit card.
4. Refresh the target job board tab.

### Production Build

```bash
npm run build
```

The optimized assets land in `dist/`:

- `manifest.json`, `background.js`, `popup.html`, `popup.js`, `popup.css`
- `applicationTracker.js` (content script) and empty `content.css`
- Icons and `logo.png`

Load the folder via **Load unpacked** to smoke test the production bundle.

## Preparing the Chrome Web Store Package

1. Run `npm run build` and verify the extension in Chrome.
2. Zip the **contents** of `dist/` (not the folder itself).
3. Ensure `manifest.json` includes the production version number.
4. Provide the following during listing submission:
   - Title/short name: **Junting Orbit**
   - Short description (≤132 chars): “Analyze job listings, track applications, and generate AI cover letters without leaving the job board.”
   - Full description: reuse or adapt the “Key Features” section above.
   - Screenshots: capture the Summary, Cover Letter, History, and Feedback views at 1280×800.
   - Privacy policy URL: host `PRIVACY.md` (e.g., GitHub Pages, Notion, or company site) and paste the public link.

## Privacy & Compliance

- The extension only requests access to LinkedIn, Indeed, and SEEK domains.
- All network calls use HTTPS and respect Supabase session cookies (`credentials: "include"`).
- Local assessments and history live in `chrome.storage.local`; users can clear data from the popup settings.
- See [PRIVACY.md](./PRIVACY.md) for the full policy.

## Project Structure

```
src/
├── background.ts          # Service worker logic
├── content/               # Content scripts
│   ├── applicationTracker.ts
│   └── index.tsx
├── components/            # Popup UI
│   ├── summary/           # Summary tab widgets
│   ├── HistoryTab.tsx
│   └── ...
├── services/              # API clients and extraction logic
├── lib/                   # Storage, utilities
└── styles/                # Tailwind globals
```

## Support

- Report issues via the in-extension feedback dialog or open a GitHub issue.
- Contact: **juntingorbit@gmail.com**

## License

MIT
