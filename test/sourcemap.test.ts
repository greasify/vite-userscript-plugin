import { expect, it } from "vitest";

import { countBannerLines, offsetSourceMap } from "../src/sourcemap.js";

it("countBannerLines counts prepended banner lines", () => {
  const prefix = "// ==UserScript==\n// @name x\n// ==/UserScript==\n\n";

  expect(countBannerLines(prefix)).toBe(4);
});

it("offsetSourceMap prepends empty generated lines", () => {
  const map = offsetSourceMap(
    {
      version: 3,
      file: "app.js",
      mappings: "AAAA",
      sources: ["app.ts"],
      names: [],
    },
    4,
    "app.user.js",
  );

  expect(map.file).toBe("app.user.js");
  expect(map.mappings).toBe(";;;;AAAA");
});
