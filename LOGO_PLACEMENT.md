# Logo Placement Instructions

To add your Junting Orbit logo to the extension header:

## Option 1: Add to public folder (Recommended)
1. Create a `public` folder in the root directory
2. Place your logo file as `public/logo.png` (or `.svg`, `.jpg`)
3. Update `src/components/ExtensionHeader.tsx`:
   ```tsx
   <img 
     src={chrome.runtime.getURL('logo.png')} 
     alt="Junting Orbit" 
     className="h-8 w-8" 
   />
   ```
4. Update `vite.config.ts` to copy the logo to dist folder
5. Update `manifest.json` to include the logo in `web_accessible_resources`

## Option 2: Add to src/assets
1. Place your logo in `src/assets/logo.png`
2. Import it in `ExtensionHeader.tsx`:
   ```tsx
   import logo from '@/assets/logo.png';
   // Then use: <img src={logo} alt="Junting Orbit" className="h-8 w-8" />
   ```

## Recommended Logo Specifications
- Size: 32x32 pixels (h-8 w-8 = 2rem = 32px)
- Format: PNG with transparency or SVG
- Style: Should work on the primary color background (#2c3a8a)

