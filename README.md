# Junting Orbit

A modern browser extension built with React, TypeScript, Tailwind CSS, and shadcn/ui. Features a floating button that opens a slider panel from the right side of the screen.

## Features

- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- ⚛️ Built with React 19 and TypeScript
- 🚀 Fast development with Vite
- 📦 Manifest V3 compliant
- 🎯 Floating button that appears on all pages
- 📱 Responsive slider panel from the right side
- 🔍 Ready for page content reading functionality

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Accessible primitives

## Project Structure

```
junting-orbit/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── FloatingButton.tsx
│   ├── content/            # Content script
│   │   └── index.tsx
│   ├── lib/                # Utilities
│   │   ├── utils.ts
│   │   └── pageReader.ts   # Page content reading utilities
│   ├── styles/             # Global styles
│   │   └── globals.css
│   └── background.ts       # Background service worker
├── manifest.json           # Extension manifest
├── vite.config.ts          # Vite configuration
└── package.json
```

## Development

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Setup

1. Install dependencies:
```bash
npm install
```

2. **Important**: Create extension icons before building:
   - Create `icons/icon16.png` (16x16 pixels)
   - Create `icons/icon48.png` (48x48 pixels)
   - Create `icons/icon128.png` (128x128 pixels)
   
   You can use any image editor or online icon generator. For now, you can use placeholder images or skip this step (the extension will work but may show warnings).

3. Build the extension:
```bash
npm run build
```

4. Load the extension in your browser:
   - **Chrome/Edge**: Open `chrome://extensions/`
   - **Firefox**: Open `about:debugging#/runtime/this-firefox`
   - Enable "Developer mode"
   - Click "Load unpacked" (Chrome) or "Load Temporary Add-on" (Firefox)
   - Select the `dist` folder

### Development Mode

For development with watch mode:

```bash
npm run dev
```

This will watch for changes and rebuild automatically. After each build:
1. Go to `chrome://extensions/`
2. Click the reload icon on your extension card
3. Refresh the web page you're testing on

## Building

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Usage

Once installed, the extension will:
1. Show a floating button (with orbit icon) in the bottom-right corner of web pages
2. When clicked, open a slider panel from the right side
3. The panel contains the extension's UI and content

## Future Features

The extension is structured to easily add:
- Page content reading and analysis
- Interactive features in the slider panel
- Data processing and visualization
- Customizable settings

## Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Modular architecture** for easy extension
- **Component-based** React structure
- **Utility functions** separated for testability

## Testing

The codebase is structured to be easily testable:
- Components are isolated and reusable
- Utilities are pure functions
- Clear separation of concerns

## License

MIT

