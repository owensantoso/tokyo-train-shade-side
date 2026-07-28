import test from "node:test";
import assert from "node:assert/strict";

import { resolveLanguage } from "./locale.js";

test("language preference follows URL, saved setting, browser, then English", () => {
  assert.equal(resolveLanguage({ urlLanguage: "ja", savedLanguage: "en", browserLanguages: ["en-US"] }), "ja");
  assert.equal(resolveLanguage({ savedLanguage: "ja", browserLanguages: ["en-US"] }), "ja");
  assert.equal(resolveLanguage({ browserLanguages: ["ja-JP", "en-US"] }), "ja");
  assert.equal(resolveLanguage({ browserLanguages: ["fr-FR"] }), "en");
});

test("invalid language values are ignored", () => {
  assert.equal(resolveLanguage({ urlLanguage: "fr", savedLanguage: "ja", browserLanguages: [] }), "ja");
  assert.equal(resolveLanguage({ urlLanguage: "fr", savedLanguage: "de", browserLanguages: ["ja"] }), "ja");
});
