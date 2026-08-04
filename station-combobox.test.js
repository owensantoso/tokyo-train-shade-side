import test from "node:test";
import assert from "node:assert/strict";
import { orderStationNames } from "./station-combobox.js";

const shinjuku = { name: "Shinjuku", nameJa: "新宿" };

test("puts the active language first in station suggestions", () => {
  assert.deepEqual(orderStationNames(shinjuku, "新宿"), {
    primary: "新宿",
    secondary: "Shinjuku",
    primaryLanguage: "ja",
    secondaryLanguage: "en",
  });
  assert.deepEqual(orderStationNames(shinjuku, "Shinjuku"), {
    primary: "Shinjuku",
    secondary: "新宿",
    primaryLanguage: "en",
    secondaryLanguage: "ja",
  });
});
