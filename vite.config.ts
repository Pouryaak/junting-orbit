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
        content: resolve(__dirname, 'src/content/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Output CSS as content.css in root
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'content.css';
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
