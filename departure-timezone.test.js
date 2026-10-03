import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

for (const timezone of ["Asia/Tokyo", "UTC", "America/Los_Angeles"]) {
  test(`departure shortcuts stay in Tokyo time on a ${timezone} device`, () => {
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import { departurePreset } from "./shade.js";
      import { formatTokyoDateTime } from "./trip-state.js";
      const cases = [
        ["2026-07-21T17:45:00+09:00", "evening"],
        ["2026-07-21T18:00:00+09:00", "evening"],
        ["2026-07-21T17:45:00+09:00", "tomorrow-morning"],
        ["2026-12-31T23:50:00+09:00", "tomorrow-morning"],
        ["2026-07-21T00:15:00+09:00", "tomorrow-morning"],
        ["2026-12-31T23:50:00+09:00", "plus-30"],
      ];
      console.log(JSON.stringify(cases.map(([at, preset]) => formatTokyoDateTime(departurePreset(new Date(at), preset)))));
    `], { cwd: new URL(".", import.meta.url), env: { ...process.env, TZ: timezone }, encoding: "utf8" });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), [
      "2026-07-21T18:00", "2026-07-22T18:00", "2026-07-22T08:00",
      "2027-01-01T08:00", "2026-07-22T08:00", "2027-01-01T00:20",
    ]);
  });
}
