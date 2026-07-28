import test from "node:test";
import assert from "node:assert/strict";

import { resolveLanguage, translate } from "./locale.js";

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

test("localizes the map travel direction description", () => {
  assert.equal(
    translate("en", "mapTravelDirection", { origin: "Shibuya", destination: "Kichijoji" }),
    "Travel direction from Shibuya to Kichijoji",
  );
  assert.equal(
    translate("ja", "mapTravelDirection", { origin: "渋谷", destination: "吉祥寺" }),
    "進行方向：渋谷から吉祥寺",
  );
});
