import { expect, it } from "vitest";

import { sanitizeFileName, toIdentifier } from "../src/names.js";

it("sanitizeFileName replaces unsafe path characters", () => {
  expect(sanitizeFileName("My Script / v2")).toBe("My-Script-v2");
  expect(sanitizeFileName("<>:\"foo")).toBe("foo");
});

it("toIdentifier produces a valid JS identifier", () => {
  expect(toIdentifier("my-script")).toBe("my_script");
  expect(toIdentifier("123foo")).toBe("_123foo");
  expect(toIdentifier("Привет")).toBe("userscript");
});
