import test from "node:test";
import assert from "node:assert/strict";

import {
  incomingLightBearing,
  normalizeBearing,
  samplePolyline,
  unwrapBearing,
} from "./map-overlay-geometry.js";

test("normalizes bearings to one clockwise rotation", () => {
  assert.equal(normalizeBearing(360), 0);
  assert.equal(normalizeBearing(-115), 245);
});

test("incoming light travels opposite the direction toward the sun", () => {
  assert.equal(incomingLightBearing(245), 65);
  assert.equal(incomingLightBearing(350), 170);
});

test("unwraps bearings across north using the shortest rotation", () => {
  assert.equal(unwrapBearing(359, 1), 361);
  assert.equal(unwrapBearing(1, 359), -1);
  assert.equal(unwrapBearing(null, 245), 245);
});

test("samples arrows in route order with screen-space headings", () => {
  assert.deepEqual(
    samplePolyline([{ x: 0, y: 0 }, { x: 200, y: 0 }], 70, 30),
    [
      { x: 65, y: 0, angle: 90 },
      { x: 135, y: 0, angle: 90 },
    ],
  );
  assert.deepEqual(
    samplePolyline([{ x: 200, y: 0 }, { x: 0, y: 0 }], 70, 30),
    [
      { x: 135, y: 0, angle: 270 },
      { x: 65, y: 0, angle: 270 },
    ],
  );
});

test("samples bent routes using each sampled segment heading", () => {
  assert.deepEqual(
    samplePolyline(
      [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
      70,
      30,
    ),
    [
      { x: 65, y: 0, angle: 90 },
      { x: 100, y: 35, angle: 180 },
    ],
  );
});

test("returns no samples for paths without usable inset length", () => {
  assert.deepEqual(samplePolyline([]), []);
  assert.deepEqual(samplePolyline([{ x: 10, y: 20 }]), []);
  assert.deepEqual(
    samplePolyline([{ x: 0, y: 0 }, { x: 50, y: 0 }], 70, 30),
    [],
  );
});

test("ignores zero-length segments while preserving route order", () => {
  assert.deepEqual(
    samplePolyline(
      [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 200, y: 0 }],
      70,
      30,
    ),
    [
      { x: 65, y: 0, angle: 90 },
      { x: 135, y: 0, angle: 90 },
    ],
  );
});
