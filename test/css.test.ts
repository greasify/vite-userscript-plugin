import { expect, it } from "vitest";

import { createCssInject, escapeCssForTemplate } from "../src/css.js";

it("escapeCssForTemplate escapes backticks, interpolations and slashes", () => {
  expect(escapeCssForTemplate("a`b${c}\\d")).toBe("a\\`b\\${c}\\\\d");
});

it("createCssInject embeds CSS via JSON and uses the auto injector", () => {
  const css = "body { content: \"`${oops}`\" }";
  const injected = createCssInject(css);

  expect(injected).toContain("GM_addStyle");
  expect(injected).toContain(JSON.stringify(css));
});

it("createCssInject uses a custom function", () => {
  const injected = createCssInject("body{}", (css) => {
    void css;
  });

  expect(injected.startsWith("(")).toBe(true);
  expect(injected).toContain(JSON.stringify("body{}"));
});
