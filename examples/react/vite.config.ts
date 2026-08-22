import { createRequire } from "node:module";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Userscript from "vite-userscript-plugin";

const { name, version } = createRequire(import.meta.url)("./package.json") as {
  name: string;
  version: string;
};

export default defineConfig({
  plugins: [
    react(),
    Userscript({
      entry: "src/index.tsx",
      header: {
        name,
        version,
        match: "https://example.com/",
      },
    }),
  ],
});
