import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  build: {
    minify: true,
    sourcemap: true,
  },
  plugins: [
    Userscript({
      entry: "src/index.ts",
      header: {
        name: pkg.name,
        version: pkg.version,
        homepage: "https://example.com/",
        match: "https://example.com/",
      },
    }),
  ],
});
