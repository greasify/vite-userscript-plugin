import type { UserscriptPluginConfig } from "../src/types.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import vue from "@vitejs/plugin-vue";
import { build } from "vite";

import { afterEach, expect, it } from "vitest";
import Userscript from "../src/index.js";

const fixtures = fileURLToPath(new URL("./fixtures", import.meta.url));
const outDirs: string[] = [];

afterEach(async () => {
  await Promise.all(outDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

async function buildFixture(name: string, plugin: UserscriptPluginConfig, options: {
  plugins?: import("vite").PluginOption[];
  minify?: boolean | "oxc" | "terser";
  sourcemap?: boolean;
} = {}) {
  const root = join(fixtures, name);
  const outDir = await mkdtemp(join(tmpdir(), `userscript-${name}-`));
  outDirs.push(outDir);

  await build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: [...(options.plugins ?? []), Userscript(plugin)],
    build: {
      outDir,
      emptyOutDir: true,
      write: true,
      sourcemap: options.sourcemap,
      minify: options.minify,
    },
  });

  return outDir;
}

function readOut(outDir: string, fileName: string) {
  return readFile(join(outDir, fileName), "utf8");
}

it("vanilla CSS is inlined into an unminified userscript", async () => {
  const outDir = await buildFixture("vanilla", {
    entry: "src/main.ts",
    fileName: "vanilla",
    header: {
      name: "Vanilla",
      version: "1.0.0",
      match: "https://example.com/*",
    },
  });

  const userscript = await readOut(outDir, "vanilla.user.js");
  const meta = await readOut(outDir, "vanilla.meta.js");

  expect(userscript).toContain("==UserScript==");
  expect(userscript).toContain("@name");
  expect(userscript).toContain("userscript-fixture");
  expect(userscript).toMatch(/GM_addStyle|__vite_style__/);
  expect(userscript).toContain("data-userscript");
  expect(meta).toContain("==UserScript==");
  expect(meta).not.toContain("userscript-fixture");
});

it("explicit minify still keeps the metablock", async () => {
  const outDir = await buildFixture(
    "vanilla",
    {
      entry: "src/main.ts",
      fileName: "vanilla",
      header: {
        name: "Vanilla",
        version: "1.0.0",
        match: "https://example.com/*",
      },
    },
    { minify: true },
  );

  const userscript = await readOut(outDir, "vanilla.user.js");
  expect(userscript.startsWith("// ==UserScript==")).toBe(true);
  expect(userscript).toContain("userscript-fixture");
  expect(userscript).not.toContain("export const hello");
});

it("sourcemap is emitted next to the userscript", async () => {
  const outDir = await buildFixture(
    "vanilla",
    {
      entry: "src/main.ts",
      fileName: "vanilla",
      header: {
        name: "Vanilla",
        version: "1.0.0",
        match: "https://example.com/*",
      },
    },
    { sourcemap: true },
  );

  const map = JSON.parse(await readOut(outDir, "vanilla.user.js.map")) as {
    file?: string;
    sources: string[];
  };

  expect(map.file).toBe("vanilla.user.js");
  expect(map.sources.some(source => source.includes("main"))).toBe(true);
});

it("multiple entries emit two userscripts", async () => {
  const outDir = await buildFixture("multi", {
    scripts: [
      {
        entry: "src/foo.ts",
        fileName: "foo",
        header: {
          name: "Foo",
          version: "1.0.0",
          match: "https://foo.example/*",
        },
      },
      {
        entry: "src/bar.ts",
        fileName: "bar",
        header: {
          name: "Bar",
          version: "1.0.0",
          match: "https://bar.example/*",
        },
      },
    ],
  });

  const foo = await readOut(outDir, "foo.user.js");
  const bar = await readOut(outDir, "bar.user.js");

  expect(foo).toMatch(/@name\s+Foo/);
  expect(foo).toContain("https://foo.example/*");
  expect(bar).toMatch(/@name\s+Bar/);
  expect(bar).toContain("https://bar.example/*");
  expect(await readOut(outDir, "foo.meta.js")).toMatch(/@name\s+Foo/);
  expect(await readOut(outDir, "bar.meta.js")).toMatch(/@name\s+Bar/);
});

it("grant none is preserved and CSS grant is not added", async () => {
  const outDir = await buildFixture("grant-none", {
    entry: "src/main.ts",
    fileName: "none",
    header: {
      name: "None",
      version: "1.0.0",
      match: "https://example.com/*",
      grant: "none",
    },
  });

  const userscript = await readOut(outDir, "none.user.js");
  expect(userscript).toMatch(/@grant\s+none/);
  expect(userscript).not.toContain("GM_addStyle");
});

it("imported images are inlined as data URLs", async () => {
  const outDir = await buildFixture("asset", {
    entry: "src/main.ts",
    fileName: "asset",
    header: {
      name: "Asset",
      version: "1.0.0",
      match: "https://example.com/*",
    },
  });

  const userscript = await readOut(outDir, "asset.user.js");
  expect(userscript).toContain("data:image/png");
  expect(userscript).not.toMatch(/\/assets\/.+\.png/);
});

it("vue SFC styles are inlined", async () => {
  const outDir = await buildFixture(
    "vue",
    {
      entry: "src/main.ts",
      fileName: "vue",
      header: {
        name: "Vue",
        version: "1.0.0",
        match: "https://example.com/*",
      },
    },
    { plugins: [vue()] },
  );

  const userscript = await readOut(outDir, "vue.user.js");
  expect(userscript).toContain("vue-fixture");
  expect(userscript).toContain("rebeccapurple");
});

it("svelte SFC styles are inlined", async () => {
  const outDir = await buildFixture(
    "svelte",
    {
      entry: "src/main.ts",
      fileName: "svelte",
      header: {
        name: "Svelte",
        version: "1.0.0",
        match: "https://example.com/*",
      },
    },
    { plugins: [svelte()] },
  );

  const userscript = await readOut(outDir, "svelte.user.js");
  expect(userscript).toContain("svelte-fixture");
  expect(userscript).toContain("darkorange");
});
