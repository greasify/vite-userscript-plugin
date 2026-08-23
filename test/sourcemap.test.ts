import { Buffer } from "node:buffer";
import { expect, it } from "vitest";

import { countBannerLines, offsetSourceMap, stripVendorSourcesContent, toInlineSourceMappingUrl } from "../src/sourcemap.js";

it("countBannerLines counts prepended banner lines", () => {
  const prefix = "// ==UserScript==\n// @name x\n// ==/UserScript==\n\n";

  expect(countBannerLines(prefix)).toBe(4);
  expect(countBannerLines("")).toBe(0);
});

it("offsetSourceMap accounts for banner plus CSS prelude", () => {
  const prelude = "// ==UserScript==\n// ==/UserScript==\n\n(function (css) {\n  GM_addStyle(css)\n})(\"body{}\");\n";
  const map = offsetSourceMap({ mappings: "AAAA" }, countBannerLines(prelude));

  expect(map.mappings).toBe(`${";".repeat(countBannerLines(prelude))}AAAA`);
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

it("stripVendorSourcesContent keeps app sources and drops vendor text", () => {
  const map = stripVendorSourcesContent({
    version: 3,
    mappings: "AAAA",
    sources: [
      "../src/main.ts",
      "../node_modules/vue/dist/vue.runtime.esm-bundler.js",
      "\0plugin-vue:export-helper",
      "virtual:userscript",
    ],
    sourcesContent: [
      "createApp(App)",
      "export function createApp() {}",
      "export default {}",
      "virtual module",
    ],
  });

  expect(map.sourcesContent).toEqual([
    "createApp(App)",
    null,
    null,
    null,
  ]);
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
