import { createRequire } from "node:module";

import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";

const { name, version } = createRequire(import.meta.url)("./package.json") as {
  name: string;
  version: string;
};

export default defineConfig({
  plugins: [
    Userscript({
      entry: "src/index.ts",
      header: {
        name,
        version,
        match: "https://example.com/",
      },
    }),
  ],
});
