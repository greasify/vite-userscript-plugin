import type { UserscriptPluginConfig } from "../src/types.js";

import { expect, expectTypeOf, it } from "vitest";
import { collectAutoMetaUrlsWarnings, resolvePluginConfig } from "../src/resolve.js";

it("resolvePluginConfig accepts a single config", () => {
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
  expect(resolved.scripts[0]?.server.open).toBe(false);
  expect(resolved.scripts[0]?.metaFile).toBe(true);
});

it("resolvePluginConfig accepts an array of configs", () => {
  const resolved = resolvePluginConfig([
    {
      entry: "src/a.ts",
      header: {
        name: "A",
        version: "1.0.0",
        match: "https://a.com/*",
        author: "you",
      },
    },
    {
      entry: "src/b.ts",
      fileName: "beta",
      header: {
        name: "B",
        version: "1.0.0",
        match: "https://b.com/*",
      },
    },
  ]);

  expect(resolved.scripts).toHaveLength(2);
  expect(resolved.scripts[0]?.header.author).toBe("you");
  expect(resolved.scripts[1]?.fileName).toBe("beta");
});

it("resolvePluginConfig throws without entry", () => {
  expect(() => resolvePluginConfig({} as UserscriptPluginConfig)).toThrow(/entry/);
});

it("resolvePluginConfig throws on an empty array", () => {
  expect(() => resolvePluginConfig([])).toThrow(/non-empty array/);
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
    "[vite-userscript-plugin] autoMetaUrls is enabled but \"Demo\" has no homepage, homepageURL, website, or source",
  ]);
});

it("collectAutoMetaUrlsWarnings skips scripts with website", () => {
  const resolved = resolvePluginConfig({
    entry: "src/main.ts",
    autoMetaUrls: true,
    header: {
      name: "Demo",
      version: "1.0.0",
      match: "https://example.com/*",
      website: "https://example.com/project",
    },
  });

  expect(collectAutoMetaUrlsWarnings(resolved)).toEqual([]);
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
    "[vite-userscript-plugin] autoMetaUrls is enabled but metaFile is false for \"Demo\" — @updateURL points at a .meta.js that will not be emitted",
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

it("userscriptPluginConfig accepts a single config", () => {
  expectTypeOf<{
    entry: string;
    header: { name: string; version: string; match: string };
  }>().toExtend<UserscriptPluginConfig>();
});

it("userscriptPluginConfig accepts an array of configs", () => {
  expectTypeOf<[{
    entry: string;
    header: { name: string; version: string; match: string };
  }]>().toExtend<UserscriptPluginConfig>();
});

it("resolvePluginConfig throws on empty match", () => {
  expect(() => resolvePluginConfig({
    entry: "src/a.ts",
    header: { name: "A", version: "1", match: [] },
  })).toThrow(/header\.match/);
});

it("resolvePluginConfig throws on duplicate fileName", () => {
  expect(() => resolvePluginConfig([
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
  ])).toThrow(/Duplicate fileName/);
});
