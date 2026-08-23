import type { UserscriptPluginConfig } from "../src/types.js";

import { expect, expectTypeOf, it } from "vitest";
import { collectAutoMetaUrlsWarnings, resolvePluginConfig } from "../src/resolve.js";

it("resolvePluginConfig accepts entry sugar", () => {
  const resolved = resolvePluginConfig({
    entry: "src/main.ts",
    header: {
      name: "Demo Script",
      version: "1.0.0",
      match: "https://example.com/*",
    },
  });

  expect(resolved.scripts).toHaveLength(1);
  expect(resolved.scripts[0]?.fileName).toBe("Demo-Script");
  expect(resolved.scripts[0]?.iifeName).toBe("Demo_Script");
});

it("resolvePluginConfig merges header defaults into scripts", () => {
  const resolved = resolvePluginConfig({
    header: { author: "you", connect: "api.example.com" },
    scripts: [
      {
        entry: "src/a.ts",
        header: {
          name: "A",
          version: "1.0.0",
          match: "https://a.com/*",
        },
      },
    ],
  });

  expect(resolved.scripts[0]?.header.author).toBe("you");
  expect(resolved.scripts[0]?.header.connect).toEqual(["api.example.com"]);
});

it("resolvePluginConfig throws without entry or scripts", () => {
  expect(() => resolvePluginConfig({} as UserscriptPluginConfig)).toThrow(/entry/);
});

it("resolvePluginConfig throws when both entry and scripts are set", () => {
  expect(() => resolvePluginConfig({
    entry: "src/a.ts",
    header: { name: "A", version: "1", match: "*" },
    scripts: [
      {
        entry: "src/b.ts",
        header: { name: "B", version: "1", match: "*" },
      },
    ],
  } as unknown as UserscriptPluginConfig),
  ).toThrow(/either/);
});

it("collectAutoMetaUrlsWarnings when homepage is missing", () => {
  const resolved = resolvePluginConfig({
    entry: "src/main.ts",
    autoMetaUrls: true,
    header: {
      name: "Demo",
      version: "1.0.0",
      match: "https://example.com/*",
    },
  });

  expect(collectAutoMetaUrlsWarnings(resolved)).toEqual([
    "[vite-userscript-plugin] autoMetaUrls is enabled but \"Demo\" has no homepage or homepageURL",
  ]);
});

it("collectAutoMetaUrlsWarnings skips scripts with homepageURL", () => {
  const resolved = resolvePluginConfig({
    entry: "src/main.ts",
    autoMetaUrls: true,
    header: {
      name: "Demo",
      version: "1.0.0",
      match: "https://example.com/*",
      homepageURL: "https://example.com/project",
    },
  });

  expect(collectAutoMetaUrlsWarnings(resolved)).toEqual([]);
});

it("collectAutoMetaUrlsWarnings when metaFile is false", () => {
  const resolved = resolvePluginConfig({
    entry: "src/main.ts",
    autoMetaUrls: true,
    metaFile: false,
    header: {
      name: "Demo",
      version: "1.0.0",
      match: "https://example.com/*",
      homepage: "https://example.com/project",
    },
  });

  expect(collectAutoMetaUrlsWarnings(resolved)).toEqual([
    "[vite-userscript-plugin] autoMetaUrls is enabled but metaFile is false — @updateURL points at a .meta.js that will not be emitted",
  ]);
});

it("collectAutoMetaUrlsWarnings is empty when autoMetaUrls is off", () => {
  const resolved = resolvePluginConfig({
    entry: "src/main.ts",
    header: {
      name: "Demo",
      version: "1.0.0",
      match: "https://example.com/*",
    },
  });

  expect(collectAutoMetaUrlsWarnings(resolved)).toEqual([]);
});

it("userscriptPluginConfig accepts entry sugar", () => {
  expectTypeOf<{
    entry: string;
    header: { name: string; version: string; match: string };
  }>().toExtend<UserscriptPluginConfig>();
});

it("userscriptPluginConfig accepts scripts", () => {
  expectTypeOf<{
    scripts: [{
      entry: string;
      header: { name: string; version: string; match: string };
    }];
  }>().toExtend<UserscriptPluginConfig>();
});

it("userscriptPluginConfig rejects entry together with scripts", () => {
  expectTypeOf<{
    entry: string;
    header: { name: string; version: string; match: string };
    scripts: [{
      entry: string;
      header: { name: string; version: string; match: string };
    }];
  }>().not.toExtend<UserscriptPluginConfig>();
});

it("resolvePluginConfig throws on duplicate fileName", () => {
  expect(() => resolvePluginConfig({
    scripts: [
      {
        entry: "src/a.ts",
        fileName: "same",
        header: { name: "A", version: "1", match: "*" },
      },
      {
        entry: "src/b.ts",
        fileName: "same",
        header: { name: "B", version: "1", match: "*" },
      },
    ],
  }),
  ).toThrow(/Duplicate fileName/);
});
