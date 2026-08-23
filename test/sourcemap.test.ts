import { Buffer } from "node:buffer";
import { expect, it } from "vitest";

import { countBannerLines, offsetSourceMap, toInlineSourceMappingUrl } from "../src/sourcemap.js";

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

it("toInlineSourceMappingUrl encodes the map as a data URL", () => {
  const map = {
    version: 3,
    file: "app.user.js",
    mappings: ";;;;AAAA",
    sources: ["app.ts"],
    names: [],
  };
  const url = toInlineSourceMappingUrl(map);

  expect(url.startsWith("data:application/json;charset=utf-8;base64,")).toBe(true);
  expect(JSON.parse(Buffer.from(url.split(",")[1] ?? "", "base64").toString("utf8"))).toEqual(map);
});
