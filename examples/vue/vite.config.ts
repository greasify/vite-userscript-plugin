import { createRequire } from "node:module";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";

const { name, version } = createRequire(import.meta.url)("./package.json") as {
  name: string;
  version: string;
};

export default defineConfig({
  plugins: [
    vue(),
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
