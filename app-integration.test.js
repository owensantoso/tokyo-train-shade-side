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

test("updates slider results live but commits URL state only when dragging ends", () => {
  assert.match(source, /renderRecommendation\(\{\s*syncUrl:\s*false,\s*saveRecent:\s*false\s*\}\)/);
  assert.match(source, /resultTimeSlider\.addEventListener\("input",\s*applyResultSliderTime\)/);
  assert.match(source, /resultTimeSlider\.addEventListener\("change",\s*commitResultSliderTime\)/);
});

test("clears empty sides instead of assigning null selections during swap", () => {
  assert.match(source, /if \(end\) origin\.setSelection\(end\);\s*else origin\.clear\(\)/);
  assert.match(source, /if \(start\) destination\.setSelection\(start\);\s*else destination\.clear\(\)/);
  assert.doesNotMatch(source, /setSelection\([^)]*\?\s*\{[^}]*\}\s*:\s*null\)/);
});

test("origin search remains available across all lines", () => {
  assert.match(source, /origin\.setLine\("all"\)/);
  assert.match(source, /!option\.lineIds\.includes\(selectedLineId\(\)\)/);
});
