import type { HeaderConfig } from "../src/types.js";

import { expect, it } from "vitest";
import { Banner, generateBanner } from "../src/banner.js";
import { grants } from "../src/constants.js";

const defaultBanner: HeaderConfig = {
  "name": "vitest",
  "version": "1.0.0",
  "author": "John Doe",
  "description": "vitest",
  "namespace": "vitest",
  "connect": "vitest.dev",
  "license": "MIT",
  "noframes": true,
  "icon": "https://vitest.dev/favicon.ico",
  "icon64": "https://vitest.dev/favicon.ico",
  "exclude": ["https://vitest.dev/guide/*", "https://vitest.dev/api/*"],
  "include": "https://vitest.dev",
  "homepage": "https://github.com/vitest-dev/vitest",
  "downloadURL": "https://vitest.dev",
  "supportURL": "https://vitest.dev",
  "updateURL": "https://vitest.dev",
  "resource": [["vitest", "https://vitest.dev"]],
  "require": "https://example.com/index.js",
  "grant": [...grants],
  "match": "https://vitest.dev",
  "run-at": "document-start",
};

it("banner default snapshot", () => {
  const banner = new Banner(defaultBanner).generate();
  expect(banner).toMatchSnapshot();
});

it("banner does not mutate input header", () => {
  const header: HeaderConfig = {
    name: "vitest",
    version: "1.0.0",
    match: "https://example.com",
    homepage: "https://example.com/project",
  };
  const clone = structuredClone(header);

  generateBanner(header, { autoMetaUrls: true, fileName: "vitest" });

  expect(header).toEqual(clone);
});

it("banner skips false and undefined fields", () => {
  const banner = generateBanner({
    name: "vitest",
    version: "1.0.0",
    match: "https://example.com",
    noframes: false,
    unwrap: undefined,
  });

  expect(banner).not.toContain("@noframes");
  expect(banner).not.toContain("@unwrap");
});

it("banner prints grant none as a single field", () => {
  const banner = generateBanner({
    name: "vitest",
    version: "1.0.0",
    match: "https://example.com",
    grant: "none",
  });

  expect(banner).toContain("@grant");
  expect(banner).toContain("none");
  expect(banner).not.toContain("GM_addStyle");
});

it("banner autoMetaUrls keeps explicit update and download URLs", () => {
  const banner = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
      homepage: "https://github.com/vitest-dev/vitest",
      updateURL: "https://vitest.dev",
      downloadURL: "https://vitest.dev",
    },
    { autoMetaUrls: true, fileName: "vitest" },
  );

  expect(banner).toContain("@updateURL");
  expect(banner).toContain("https://vitest.dev");
  expect(banner).not.toContain("vitest.meta.js");
});

it("banner autoMetaUrls without homepage does not add update or download URLs", () => {
  const banner = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
    },
    { autoMetaUrls: true, fileName: "vitest" },
  );

  expect(banner).not.toContain("@updateURL");
  expect(banner).not.toContain("@downloadURL");
});

it("banner autoMetaUrls joins homepage without trailing slash", () => {
  const banner = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
      homepage: "https://crashmax-dev.github.io/jsx",
    },
    { autoMetaUrls: true, fileName: "vitest" },
  );

  expect(banner).toContain(
    "https://crashmax-dev.github.io/jsx/vitest.meta.js",
  );
  expect(banner).toContain(
    "https://crashmax-dev.github.io/jsx/vitest.user.js",
  );
});

it("banner generate hook receives userscript text", () => {
  const banner = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
    },
    {
      mode: "meta",
      generate: ({ userscript, mode }) => `${userscript}\n// mode:${mode}`,
    },
  );

  expect(banner).toContain("==UserScript==");
  expect(banner).toContain("// mode:meta");
});

it("banner sanitizes newlines in header values", () => {
  const banner = generateBanner({
    name: "x\n// @grant unsafeWindow",
    version: "1.0.0",
    match: "https://example.com",
  });

  expect(banner).toContain("// @name");
  expect(banner.split("\n").filter(line => line.startsWith("// @name"))).toHaveLength(1);
  expect(banner).not.toMatch(/^\/\/ @grant unsafeWindow$/m);
});

it("banner skips object header values", () => {
  const banner = generateBanner({
    name: "vitest",
    version: "1.0.0",
    match: "https://example.com",
    extra: { nested: true },
  });

  expect(banner).not.toContain("[object Object]");
  expect(banner).not.toContain("@extra");
});

it("banner autoMetaUrls uses website and source aliases", () => {
  const fromWebsite = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
      website: "https://example.com/project",
    },
    { autoMetaUrls: true, fileName: "vitest" },
  );
  const fromSource = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
      source: "https://example.com/src/",
    },
    { autoMetaUrls: true, fileName: "vitest" },
  );

  expect(fromWebsite).toContain("https://example.com/project/vitest.meta.js");
  expect(fromSource).toContain("https://example.com/src/vitest.user.js");
});

it("banner autoMetaUrls ignores an invalid homepage", () => {
  const banner = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
      homepage: "not a url",
    },
    { autoMetaUrls: true, fileName: "vitest" },
  );

  expect(banner).not.toContain("@updateURL");
  expect(banner).not.toContain("@downloadURL");
});

it("banner align false uses a single space", () => {
  const banner = generateBanner(
    {
      name: "vitest",
      version: "1.0.0",
      match: "https://example.com",
    },
    { align: false },
  );

  expect(banner).toContain("// @name vitest");
});
