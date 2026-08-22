import { createRequire } from "node:module";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";

const { name, version } = createRequire(import.meta.url)("./package.json") as {
  name: string;
  version: string;
};

export default defineConfig({
  plugins: [
    svelte(),
    Userscript({
      entry: "src/main.ts",
      header: {
        name,
        version,
        match: "https://example.com/",
      },
    }),
  ],
});
