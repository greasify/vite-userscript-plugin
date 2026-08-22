import { expect, it } from "vitest";

import { GM_NAMESPACE } from "../src/constants.js";
import { createGmShimPrelude, shouldShimModule } from "../src/gm-shim.js";

it("shouldShimModule accepts user JS and framework script modules", () => {
  expect(shouldShimModule("/src/main.ts")).toBe(true);
  expect(shouldShimModule("/src/app.tsx")).toBe(true);
  expect(shouldShimModule("/src/App.vue")).toBe(true);
  expect(shouldShimModule("/src/App.vue?vue&type=script&lang.ts")).toBe(true);
  expect(shouldShimModule("/src/Widget.svelte")).toBe(true);
});

it("shouldShimModule rejects styles, raw queries and node_modules", () => {
  expect(shouldShimModule("/src/style.css")).toBe(false);
  expect(shouldShimModule("/src/style.scss")).toBe(false);
  expect(shouldShimModule("/src/App.vue?vue&type=style&lang.css")).toBe(false);
  expect(shouldShimModule("/src/Widget.svelte?svelte&type=style")).toBe(false);
  expect(shouldShimModule("/src/style.css?raw")).toBe(false);
  expect(shouldShimModule("/node_modules/vue/dist/vue.js")).toBe(false);
});

it("createGmShimPrelude reads GM APIs from the namespace", () => {
  const prelude = createGmShimPrelude();

  expect(prelude).toContain(`globalThis.${GM_NAMESPACE}`);
  expect(prelude).toContain("GM_addStyle");
  expect(prelude).toContain("unsafeWindow");
});
