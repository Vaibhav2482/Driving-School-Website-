import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Adds the social-preview URL tags (og:url, og:image) to index.html when VITE_SITE_URL is set. They must be in
 * the static HTML because link-preview crawlers (WhatsApp, Facebook, LinkedIn) do not run JavaScript, and they
 * need absolute URLs, so they can only be written once the real domain is known.
 */
function socialPreviewTags(siteUrl: string | undefined): Plugin {
  return {
    name: "social-preview-tags",
    transformIndexHtml() {
      if (!siteUrl) return;
      const origin = siteUrl.replace(/\/+$/, "");
      return [
        { tag: "meta", attrs: { property: "og:url", content: origin } },
        { tag: "meta", attrs: { property: "og:image", content: `${origin}/og-image.jpg` } },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
        { tag: "meta", attrs: { name: "twitter:image", content: `${origin}/og-image.jpg` } },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), tailwindcss(), socialPreviewTags(env.VITE_SITE_URL || undefined)],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      // A dedicated port for this project (other projects on the same machine use 5173+). strictPort makes
      // Vite fail loudly instead of silently moving to a port that belongs to someone else.
      port: Number(process.env.VITE_DEV_PORT ?? 5273),
      strictPort: true,
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      css: false,
      // Headroom for slow or busy machines (for example while a dev server is reloading).
      testTimeout: 20_000,
    },
  };
});
