import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the built site works from any subpath —
  // required for GitHub Pages project sites (username.github.io/repo) and GitLab Pages.
  base: "./",
});
