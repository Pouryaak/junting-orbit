import react from "@vitejs/plugin-react";
import { build as esbuild } from "esbuild";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";
import { defineConfig } from "vite";

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
      name: "build-background",
      async closeBundle() {
        // Copy manifest
        copyFileSync("manifest.json", "dist/manifest.json");

        // Copy icons if they exist
        if (existsSync("icons")) {
          copyDir("icons", "dist/icons");
        }

        // Copy logo from assets
        if (existsSync("src/assets/logo.png")) {
          copyFileSync("src/assets/logo.png", "dist/logo.png");
        }

        // Handle CSS files: popup.css should contain styles, content.css should be empty
        // First, check if content.css has actual styles (it shouldn't, but Vite might put popup styles there)
        let popupCssContent = "";
        if (existsSync("dist/content.css")) {
          const contentCss = readFileSync("dist/content.css", "utf-8");
          // If content.css has substantial content (more than just comments), it's likely the popup styles
          if (contentCss.length > 100) {
            popupCssContent = contentCss;
            console.log(
              "Found popup styles in content.css, will move to popup.css"
            );
          }
          unlinkSync("dist/content.css");
        }

        // Check for other CSS files that might be the popup styles
        const allFiles = readdirSync("dist");
        const cssFiles = allFiles.filter((f) => f.endsWith(".css"));
        for (const cssFile of cssFiles) {
          if (cssFile !== "content.css" && cssFile !== "popup.css") {
            const filePath = `dist/${cssFile}`;
            const fileContent = readFileSync(filePath, "utf-8");
            if (fileContent.length > 100) {
              // This is likely the popup CSS
              popupCssContent = fileContent;
              unlinkSync(filePath);
              console.log(
                `Found popup styles in ${cssFile}, moving to popup.css`
              );
            }
          }
        }

        // Write popup.css with the actual styles
        if (popupCssContent) {
          writeFileSync("dist/popup.css", popupCssContent);
          console.log("Created popup.css with styles");
        } else {
          // If no styles found, create empty popup.css (shouldn't happen)
          writeFileSync(
            "dist/popup.css",
            "/* Popup styles should be here */\n"
          );
          console.warn("Warning: No popup styles found!");
        }

        // Create empty content.css file (for content script - should be empty)
        writeFileSync(
          "dist/content.css",
          "/* Empty - no styles injected into web pages */\n"
        );

        // Rename index.html to popup.html and fix CSS reference
        if (existsSync("dist/index.html")) {
          let htmlContent = readFileSync("dist/index.html", "utf-8");
          // Replace any CSS reference with popup.css
          htmlContent = htmlContent.replace(
            /href=["'][^"']*\.css["']/g,
            'href="/popup.css"'
          );
          writeFileSync("dist/popup.html", htmlContent);
          console.log("Created popup.html with correct CSS reference");
        }

        // Build background script
        await esbuild({
          entryPoints: ["src/background.ts"],
          bundle: true,
          outfile: "dist/background.js",
          format: "esm",
          platform: "browser",
          target: "es2020",
          minify: false,
        }).catch((err) => {
          console.error("Error building background script:", err);
          process.exit(1);
        });

        // Build application tracker content script
        await esbuild({
          entryPoints: ["src/content/applicationTracker.ts"],
          bundle: true,
          outfile: "dist/applicationTracker.js",
          format: "esm",
          platform: "browser",
          target: "es2020",
          minify: false,
        }).catch((err) => {
          console.error("Error building application tracker script:", err);
          process.exit(1);
        });

        // Copy logo.png to dist for content script usage
        if (existsSync("src/assets/logo.png")) {
          const { copyFileSync } = await import("fs");
          copyFileSync("src/assets/logo.png", "dist/logo.png");
          console.log("Copied logo.png to dist");
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content/index.tsx"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Popup entry goes to popup.js, content stays as content.js
          return chunkInfo.name === "popup" ? "popup.js" : "[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          // Output CSS files appropriately
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            // Only generate CSS for popup, not for content script
            if (
              assetInfo.name.includes("popup") ||
              assetInfo.name.includes("index")
            ) {
              return "popup.css";
            }
            // Don't generate CSS for content script - will be created as empty file in closeBundle
            return "content.css";
          }
          // Rename index.html to popup.html
          if (assetInfo.name === "index.html") {
            return "popup.html";
          }
          return "assets/[name].[ext]";
        },
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
