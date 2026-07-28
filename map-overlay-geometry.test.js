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

test("rejects non-numeric and non-finite bearings", () => {
  assert.equal(normalizeBearing("245"), null);
  assert.equal(normalizeBearing(Infinity), null);
  assert.equal(incomingLightBearing("245"), null);
  assert.equal(incomingLightBearing(Infinity), null);
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

test("rejects invalid next and previous bearings when unwrapping", () => {
  assert.equal(unwrapBearing(245, Infinity), null);
  assert.equal(unwrapBearing(245, "350"), null);
  assert.equal(unwrapBearing(Infinity, 245), null);
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

test("rejects invalid polyline coordinates", () => {
  assert.deepEqual(samplePolyline([{ x: 0, y: 0 }, { x: Infinity, y: 0 }]), []);
  assert.deepEqual(samplePolyline([{ x: 0, y: 0 }, { x: "200", y: 0 }]), []);
  assert.deepEqual(
    samplePolyline([{ x: 0, y: 0 }, , { x: 200, y: 0 }]),
    [],
  );
  assert.deepEqual(
    samplePolyline([
      { x: -Number.MAX_VALUE, y: 0 },
      { x: Number.MAX_VALUE, y: 0 },
    ]),
    [],
  );
});

test("rejects invalid polyline sampling options", () => {
  const route = [{ x: 0, y: 0 }, { x: 200, y: 0 }];

  assert.deepEqual(samplePolyline(route, Infinity, 30), []);
  assert.deepEqual(samplePolyline(route, 0, 30), []);
  assert.deepEqual(samplePolyline(route, "70", 30), []);
  assert.deepEqual(samplePolyline(route, Number.MIN_VALUE, 30), []);
  assert.deepEqual(samplePolyline(route, 70, Infinity), []);
  assert.deepEqual(samplePolyline(route, 70, -1), []);
  assert.deepEqual(samplePolyline(route, 70, "30"), []);
});

test("caps dense sampling while keeping samples evenly distributed", () => {
  const samples = samplePolyline(
    [{ x: 0, y: 0 }, { x: 1000, y: 0 }],
    1,
    0,
  );

  assert.equal(samples.length, 200);
  assert.deepEqual(samples[0], { x: 2.5, y: 0, angle: 90 });
  assert.deepEqual(samples.at(-1), { x: 997.5, y: 0, angle: 90 });
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
