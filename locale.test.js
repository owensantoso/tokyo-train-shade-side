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

test("localizes result endpoint and sunlight map descriptions", () => {
  assert.equal(
    translate("en", "mapEndpointAria", { role: "origin", station: "Shibuya", code: "IN01" }),
    "Highlight origin Shibuya (IN01) on the station map",
  );
  assert.equal(
    translate("ja", "mapEndpointAria", { role: "乗車駅", station: "渋谷", code: "IN01" }),
    "駅マップで乗車駅の渋谷（IN01）を強調表示",
  );
  assert.equal(
    translate("en", "mapSunDescription", { degrees: 245 }),
    "Sun direction 245 degrees clockwise from north",
  );
  assert.equal(
    translate("ja", "mapSunDescription", { degrees: 245 }),
    "太陽の方向：北から時計回りに245度",
  );
});
