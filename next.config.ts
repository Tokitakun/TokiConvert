import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Exclude scrapr and its heavy optional dependencies (puppeteer, playwright, cheerio)
  // from Turbopack bundling so they are loaded natively at runtime instead.
  serverExternalPackages: [
    "@coflyn/scrapr",
    "puppeteer-core",
    "puppeteer-extra-plugin-stealth",
    "playwright",
    "playwright-extra",
    "cheerio",
    "axios",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
