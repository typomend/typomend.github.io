import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// typomend.github.io is an organization site, so it is served from the root.
export default defineConfig({
  base: "/",
  plugins: [react()],
});
