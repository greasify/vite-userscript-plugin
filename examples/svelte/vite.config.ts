import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [
    svelte(),
    Userscript({
      entry: "src/main.ts",
      header: {
        name: pkg.name,
        version: pkg.version,
        match: "https://example.com/",
      },
    }),
  ],
});
