import react from '@vitejs/plugin-react';
import { build as esbuild } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { defineConfig } from 'vite';

// Helper to copy directory recursively
function copyDir(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'build-background',
      async closeBundle() {
        // Copy manifest
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Copy icons if they exist
        if (existsSync('icons')) {
          copyDir('icons', 'dist/icons');
        }
        
        // Copy logo from assets
        if (existsSync('src/assets/logo.png')) {
          copyFileSync('src/assets/logo.png', 'dist/logo.png');
        }
        
        // Rename index.html to popup.html
        if (existsSync('dist/index.html')) {
          copyFileSync('dist/index.html', 'dist/popup.html');
        }
        
        // Build background script
        await esbuild({
          entryPoints: ['src/background.ts'],
          bundle: true,
          outfile: 'dist/background.js',
          format: 'esm',
          platform: 'browser',
          target: 'es2020',
          minify: false,
        }).catch((err) => {
          console.error('Error building background script:', err);
          process.exit(1);
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content/index.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Popup entry goes to popup.js, content stays as content.js
          return chunkInfo.name === 'popup' ? 'popup.js' : '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Output CSS files appropriately
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            if (assetInfo.name.includes('popup') || assetInfo.name.includes('index')) {
              return 'popup.css';
            }
            return 'content.css';
          }
          // Rename index.html to popup.html
          if (assetInfo.name === 'index.html') {
            return 'popup.html';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
