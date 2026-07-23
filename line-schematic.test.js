import test from "node:test";
import assert from "node:assert/strict";

import { projectSchematicPoints, projectStationPoints } from "./line-schematic.js";

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

test("lays a long diagonal route from the visible left edge to the right edge", () => {
  const points = projectSchematicPoints([
    { lat: 35.69, lon: 139.70 },
    { lat: 35.61, lon: 139.53 },
    { lat: 35.44, lon: 139.36 },
    { lat: 35.26, lon: 139.16 },
  ], { width: 1034, height: 176, padding: 28 });

  assert.equal(points[0].x, 28);
  assert.equal(points.at(-1).x, 1006);
  assert.equal(points.every(({ y }) => y >= 28 && y <= 148), true);
});
