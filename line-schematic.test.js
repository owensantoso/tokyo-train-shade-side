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

test("keeps a diagonal route north-up instead of forcing station order left-to-right", () => {
  const points = projectSchematicPoints([
    { lat: 35.69, lon: 139.70 },
    { lat: 35.61, lon: 139.53 },
    { lat: 35.44, lon: 139.36 },
    { lat: 35.26, lon: 139.16 },
  ], { width: 640, height: 280, padding: 28 });

  assert.ok(points[0].x > points.at(-1).x);
  assert.ok(points[0].y < points.at(-1).y);
  assert.equal(points.every(({ x, y }) => x >= 28 && x <= 612 && y >= 28 && y <= 252), true);
});
