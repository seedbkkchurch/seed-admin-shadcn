/// <reference types="vitest/config" />
import path from "path";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";
import { playwright } from "@vitest/browser-playwright";

// Expose package.json's version to the client bundle (grill-me follow-up,
// 2026-08-23) — read at build time via fs rather than a JSON import so no
// tsconfig "resolveJsonModule" change is needed. Shown on the sign-in page
// and in the sidebar footer so support can tell which build a user is on.
const appVersion = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
).version as string;

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    // Installable-app support (grill-me follow-up, 2026-08-11). Goal is
    // "add to home screen" only — not full offline data support, since this
    // is an admin app backed live by Supabase. generateSW's default
    // precache still caches the built JS/CSS/icons (faster repeat loads as
    // a side effect), but no runtimeCaching is configured for Supabase API
    // calls, so those always hit the network as before.
    //
    // push/notificationclick handlers for the เฝ้าเดี่ยว reminder feature
    // (grill-me follow-up, 2026-08-12) are loaded via Workbox's
    // `importScripts` below (public/push-sw.js), NOT the injectManifest
    // strategy — vite-plugin-pwa@1.3.0's injectManifest runs its own nested
    // Vite/Rolldown build to bundle a custom sw.ts, and that inner build
    // currently throws ("rolldown/experimental does not provide an export
    // named viteWasmFallbackPlugin") against this project's Vite 8 install.
    // importScripts sidesteps that broken code path entirely — it just
    // concatenates a plain JS file into the generated service worker.
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        importScripts: ["/push-sw.js"],
        // Safety net: manualChunks below keeps every JS chunk well under
        // the 2 MiB default, but bump the limit a bit so a future
        // dependency bump that pushes one chunk just over doesn't fail the
        // whole build outright (2026-08-29, chunking fix).
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: "Seed Admin",
        short_name: "Seed Admin",
        description:
          "ระบบบริหารจัดการสมาชิกคริสตจักร Seed Church — ติดตามการเติบโตฝ่ายวิญญาณของสมาชิก (Lamb), การเข้าร่วมกลุ่มแคร์และการเฝ้าเดี่ยว, สถิติการเข้าร่วมนมัสการ, พระคัมภีร์ออนไลน์หลายฉบับ และข่าวสารคริสตจักร ครบในที่เดียว",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise the warning threshold a bit (default 500kB) now that vendor code
    // is actually split into separate chunks below, so the remaining
    // largest chunks aren't flagged for being merely "big" rather than
    // genuinely unsplit.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Manual vendor chunking to keep any single chunk under the
        // warning threshold and improve browser caching (vendor code
        // changes far less often than app code, so splitting it out means
        // users re-download less on each deploy).
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("exceljs")) return "vendor-exceljs";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-tiptap";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-recharts";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tanstack")) return "vendor-tanstack";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("/react-router"))
            return "vendor-react";
          if (id.includes("date-fns") || id.includes("react-day-picker"))
            return "vendor-date";
          if (id.includes("lucide-react")) return "vendor-icons";
          return "vendor";
        },
      },
    },
  },
  test: {
    silent: "passed-only",
    unstubEnvs: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      // include: ['src/**/*.{js,jsx,ts,tsx}'], // Uncomment to expand the report to all src/**/* so untested modules appear as 0% coverage.
      exclude: [
        "src/components/ui/**",
        "src/assets/**",
        "src/tanstack-table.d.ts",
        "src/routeTree.gen.ts",
        "src/test-utils/**",
        "src/routes/**",
      ],
    },
  },
});
