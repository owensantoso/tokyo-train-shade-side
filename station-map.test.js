import test from "node:test";
import assert from "node:assert/strict";

import { nearestPointIndex } from "./station-map.js";

test("selects the geographically nearest station when marker hit areas overlap", () => {
  const points = [
    { x: 10, y: 10 },
    { x: 15, y: 10 },
    { x: 30, y: 10 },
  ];

  assert.equal(nearestPointIndex(points, { x: 14, y: 10 }, 22), 1);
  assert.equal(nearestPointIndex(points, { x: 80, y: 80 }, 22), -1);
});
