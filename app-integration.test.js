import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./app.js", import.meta.url), "utf8");

test("passes the resolved route line into StationMap rendering", () => {
  assert.match(
    source,
    /stationMap\.render\(selectedLineId\(\),\s*start,\s*end,\s*routeLineId\)/,
  );
});

test("calculates one route for the map overlay and clears incomplete or failed state", () => {
  assert.match(source, /const route = getRoutePath\(routeLineId,\s*start\.name,\s*end\.name\)/);
  assert.match(source, /stationMap\.updateTripOverlay\(\{\s*routeLineId,\s*routeStations:\s*route\.stations,\s*sunAzimuth:\s*recommendation\.sun\.azimuth,\s*isNight:\s*recommendation\.isNight/s);
  assert.ok((source.match(/stationMap\.clearTripOverlay\(\)/g) ?? []).length >= 2);
});

test("renders focusable endpoint links and binds pointer and keyboard highlighting", () => {
  assert.match(source, /data-map-endpoint="\$\{role\}"/);
  assert.match(source, /tabindex="0"/);
  for (const eventName of ["mouseenter", "mouseleave", "focus", "blur"]) {
    assert.match(source, new RegExp(`addEventListener\\("${eventName}"`));
  }
  assert.match(source, /stationMap\.highlightEndpoint\(role,\s*true\)/);
  assert.match(source, /stationMap\.highlightEndpoint\(role,\s*false\)/);
});
