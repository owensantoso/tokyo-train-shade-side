import test from "node:test";
import assert from "node:assert/strict";

import {
  clockToMinutes,
  formatTokyoDateTime,
  minutesToClock,
  parseTokyoDateTime,
  parseTripState,
  serializeTripState,
} from "./trip-state.js";

test("converts between clock values and slider minutes", () => {
  assert.equal(clockToMinutes("00:00"), 0);
  assert.equal(clockToMinutes("13:45"), 825);
  assert.equal(minutesToClock(825), "13:45");
  assert.equal(minutesToClock(1439), "23:59");
});

test("formats and parses exact Tokyo wall-clock timestamps", () => {
  const date = new Date("2026-07-29T13:45:00+09:00");

  assert.equal(formatTokyoDateTime(date), "2026-07-29T13:45");
  assert.equal(parseTokyoDateTime("2026-07-29T13:45").getTime(), date.getTime());
  assert.equal(parseTokyoDateTime("2026-02-31T13:45"), null);
  assert.equal(parseTokyoDateTime("not-a-date"), null);
});

test("round-trips the shareable route state", () => {
  const query = serializeTripState({
    language: "ja",
    lineId: "shinjuku",
    startName: "Iwamotocho",
    endName: "Higashi-ojima",
    date: new Date("2026-07-29T13:45:00+09:00"),
  });

  assert.equal(query, "lang=ja&line=shinjuku&from=Iwamotocho&to=Higashi-ojima&at=2026-07-29T13%3A45");
  assert.deepEqual(parseTripState(`?${query}`, ["all", "shinjuku"]), {
    language: "ja",
    lineId: "shinjuku",
    startName: "Iwamotocho",
    endName: "Higashi-ojima",
    date: new Date("2026-07-29T13:45:00+09:00"),
  });
});

test("ignores invalid line and time values in shared state", () => {
  assert.deepEqual(parseTripState("?line=fake&from=Shibuya&at=bad", ["all", "inokashira"]), {
    language: null,
    lineId: "all",
    startName: "Shibuya",
    endName: null,
    date: null,
  });
});
