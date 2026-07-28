import test from "node:test";
import assert from "node:assert/strict";

import { lineCoordinates } from "./network-map.js";

test("converts line stations to Leaflet coordinates and closes circular routes", () => {
  const open = lineCoordinates({
    stations: [
      { lat: 35.6, lon: 139.6 },
      { lat: 35.7, lon: 139.7 },
    ],
  });
  assert.deepEqual(open, [[35.6, 139.6], [35.7, 139.7]]);

  const circular = lineCoordinates({
    circular: true,
    stations: [
      { lat: 35.6, lon: 139.6 },
      { lat: 35.7, lon: 139.7 },
    ],
  });
  assert.deepEqual(circular, [[35.6, 139.6], [35.7, 139.7], [35.6, 139.6]]);
});
