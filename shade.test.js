import test from "node:test";
import assert from "node:assert/strict";

import {
  LINES,
  calculateBearing,
  calculateDistanceKm,
  findClosestStation,
  recommendShadeSide,
  stationNamesForLine,
  swapStations,
} from "./shade.js";

test("includes Keio New Line and Inokashira station choices", () => {
  assert.deepEqual(Object.keys(LINES), ["keio", "inokashira"]);

  const keioStations = stationNamesForLine("keio");
  assert.equal(keioStations[0], "Shinjuku");
  assert.ok(keioStations.includes("Hatsudai"));
  assert.ok(keioStations.includes("Hatagaya"));
  assert.ok(keioStations.includes("Sasazuka"));
  assert.ok(keioStations.includes("Keio-Hachioji"));

  const inokashiraStations = stationNamesForLine("inokashira");
  assert.equal(inokashiraStations[0], "Shibuya");
  assert.ok(inokashiraStations.includes("Meidaimae"));
  assert.equal(inokashiraStations.at(-1), "Kichijoji");
});

test("calculates eastbound and westbound bearings from station coordinates", () => {
  const eastbound = calculateBearing(
    { lat: 35.6715, lon: 139.6949 },
    { lat: 35.658, lon: 139.7016 },
  );
  const westbound = calculateBearing(
    { lat: 35.658, lon: 139.7016 },
    { lat: 35.6715, lon: 139.6949 },
  );

  assert.ok(eastbound > 130 && eastbound < 160);
  assert.ok(westbound > 310 && westbound < 340);
});

test("recommends the opposite side when sun is clearly on one side", () => {
  const rightShade = recommendShadeSide({ heading: 270, sunAzimuth: 180, sunElevation: 35 });
  assert.equal(rightShade.side, "right");
  assert.equal(rightShade.confidence, "high");

  const leftShade = recommendShadeSide({ heading: 90, sunAzimuth: 180, sunElevation: 35 });
  assert.equal(leftShade.side, "left");
  assert.equal(leftShade.confidence, "high");
});

test("returns no meaningful difference when the sun is low or aligned with the train", () => {
  const lowSun = recommendShadeSide({ heading: 270, sunAzimuth: 180, sunElevation: 2 });
  assert.equal(lowSun.side, "none");
  assert.equal(lowSun.confidence, "low");

  const ahead = recommendShadeSide({ heading: 180, sunAzimuth: 186, sunElevation: 30 });
  assert.equal(ahead.side, "none");
  assert.equal(ahead.confidence, "low");
});

test("calculates geographic distance in kilometers", () => {
  const distance = calculateDistanceKm(
    { lat: 35.6687, lon: 139.6503 },
    { lat: 35.6737, lon: 139.6674 },
  );

  assert.ok(distance > 1.5 && distance < 1.8);
  assert.equal(calculateDistanceKm(
    { lat: 35.6687, lon: 139.6503 },
    { lat: 35.6687, lon: 139.6503 },
  ), 0);
});

test("finds the closest station only on the selected line", () => {
  const nearShimokitazawa = findClosestStation("inokashira", 35.6617, 139.6667);
  assert.equal(nearShimokitazawa.station.name, "Shimokitazawa");
  assert.ok(nearShimokitazawa.distanceKm < 0.01);

  const nearKeioMeidaimae = findClosestStation("keio", 35.6687, 139.6503);
  assert.equal(nearKeioMeidaimae.station.name, "Meidaimae");
  assert.ok(nearKeioMeidaimae.distanceKm < 0.01);
});

test("swaps origin and destination station names", () => {
  assert.deepEqual(swapStations("Meidaimae", "Shinjuku"), {
    startName: "Shinjuku",
    endName: "Meidaimae",
  });
});
