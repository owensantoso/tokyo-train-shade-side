import test from "node:test";
import assert from "node:assert/strict";

import { projectStationPoints } from "./line-schematic.js";

test("projects station coordinates into a padded schematic viewport", () => {
  const points = projectStationPoints([
    { lat: 35.6, lon: 139.6 },
    { lat: 35.7, lon: 139.8 },
    { lat: 35.65, lon: 139.7 },
  ]);

  assert.equal(points.length, 3);
  assert.equal(points.every(({ x, y }) => x >= 24 && x <= 616 && y >= 24 && y <= 196), true);
  assert.ok(points[0].x < points[1].x);
  assert.ok(points[0].y > points[1].y);
});

test("keeps a flat line centered instead of dividing by zero", () => {
  const points = projectStationPoints([
    { lat: 35.6, lon: 139.6 },
    { lat: 35.6, lon: 139.8 },
  ]);

  assert.equal(points[0].y, 110);
  assert.equal(points[1].y, 110);
});
