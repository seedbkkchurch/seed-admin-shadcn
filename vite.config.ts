/// <reference types="vitest/config" />
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";
import { playwright } from "@vitest/browser-playwright";

// https://vite.dev/config/
export default defineConfig({
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
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Shadcn Admin",
        short_name: "Shadcn Admin",
        description: "Admin Dashboard UI built with Shadcn and Vite.",
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
