import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [
    react(),
    Userscript({
      entry: "src/index.tsx",
      header: {
        name: pkg.name,
        version: pkg.version,
        match: "https://example.com/",
      },
    }),
  ],
});
