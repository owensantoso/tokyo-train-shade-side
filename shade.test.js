import test from "node:test";
import assert from "node:assert/strict";

import {
  LINES,
  calculateBearing,
  calculateDistanceKm,
  departurePreset,
  describeBearing,
  describeSunElevation,
  filterStationOptions,
  findClosestStation,
  getRoutePath,
  recommendShadeSide,
  shouldPreserveDestination,
  stationOptions,
  stationNamesForLine,
  swapStations,
} from "./shade.js";
import { isTapGesture } from "./station-combobox.js";

test("distinguishes a touch tap from a scrolling gesture", () => {
  assert.equal(isTapGesture({ x: 10, y: 20 }, { x: 14, y: 25 }), true);
  assert.equal(isTapGesture({ x: 10, y: 20 }, { x: 10, y: 32 }), false);
});

test("includes all supported Tokyo line corridors", () => {
  assert.deepEqual(Object.keys(LINES), ["keio", "inokashira", "shinjuku", "ginza", "chuo", "yamanote"]);

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

  assert.deepEqual(stationNamesForLine("shinjuku").slice(0, 2), ["Shinjuku", "Shinjuku-sanchome"]);
  assert.equal(stationNamesForLine("shinjuku").at(-1), "Motoyawata");
  assert.equal(stationNamesForLine("ginza").length, 19);
  assert.deepEqual(stationNamesForLine("ginza").slice(0, 2), ["Shibuya", "Omote-sando"]);
  assert.equal(stationNamesForLine("chuo").at(-1), "Takao");
  assert.equal(LINES.shinjuku.code, "S");
  assert.equal(LINES.ginza.code, "G");
  assert.equal(LINES.chuo.code, "JC");
  assert.equal(LINES.yamanote.code, "JY");
  assert.equal(LINES.yamanote.circular, true);
  assert.equal(stationNamesForLine("yamanote").length, 30);
  assert.ok(stationNamesForLine("yamanote").includes("Takanawa Gateway"));
});

test("chooses the shorter direction around the Yamanote loop", () => {
  const clockwise = getRoutePath("yamanote", "Tokyo", "Yurakucho");
  assert.deepEqual(clockwise.stations.map(({ name }) => name), ["Tokyo", "Yurakucho"]);
  assert.equal(clockwise.direction, "clockwise / outer loop");

  const counterclockwise = getRoutePath("yamanote", "Tokyo", "Kanda");
  assert.deepEqual(counterclockwise.stations.map(({ name }) => name), ["Tokyo", "Kanda"]);
  assert.equal(counterclockwise.direction, "counterclockwise / inner loop");

  const acrossSeam = getRoutePath("yamanote", "Shinagawa", "Osaki");
  assert.deepEqual(acrossSeam.stations.map(({ name }) => name), ["Shinagawa", "Osaki"]);
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
  assert.deepEqual(swapStations("Shinjuku", null), { startName: null, endName: "Shinjuku" });
  assert.deepEqual(swapStations(null, "Shibuya"), { startName: "Shibuya", endName: null });
});

test("preserves a destination when closest station resolves to the same line", () => {
  assert.equal(shouldPreserveDestination({ lineId: "yamanote" }, "yamanote"), true);
  assert.equal(shouldPreserveDestination({ lineId: "chuo" }, "yamanote"), false);
  assert.equal(shouldPreserveDestination(null, "yamanote"), true);
});

test("builds useful future departure presets", () => {
  const now = new Date(2026, 6, 21, 17, 45);
  assert.equal(departurePreset(now, "plus-30").getTime(), new Date(2026, 6, 21, 18, 15).getTime());
  assert.equal(departurePreset(now, "evening").getTime(), new Date(2026, 6, 21, 18, 0).getTime());
  assert.equal(departurePreset(now, "tomorrow-morning").getTime(), new Date(2026, 6, 22, 8, 0).getTime());

  const afterEvening = new Date(2026, 6, 21, 20, 0);
  assert.equal(departurePreset(afterEvening, "evening").getTime(), new Date(2026, 6, 22, 18, 0).getTime());
});

test("builds station search options for all lines or one selected line", () => {
  const allOptions = stationOptions("all");
  const sharedStations = allOptions.filter((option) => option.name === "Meidaimae");

  assert.deepEqual(sharedStations.map((option) => option.lineId), ["keio", "inokashira"]);
  assert.equal(stationOptions("inokashira").every((option) => option.lineId === "inokashira"), true);
  assert.equal(stationOptions("keio").length, LINES.keio.stations.length);
});

test("filters station suggestions with prefix matches before substring matches", () => {
  const sharedMatches = filterStationOptions("meidai", "all");
  assert.equal(sharedMatches.length, 2);
  assert.deepEqual(sharedMatches.map((option) => option.lineId), ["keio", "inokashira"]);

  const shMatches = filterStationOptions("sh", "all");
  const firstSubstringIndex = shMatches.findIndex((option) => !option.name.toLowerCase().startsWith("sh"));
  assert.ok(firstSubstringIndex > 0);
  assert.equal(shMatches.slice(0, firstSubstringIndex).every((option) => option.name.toLowerCase().startsWith("sh")), true);
  assert.equal(filterStationOptions("shibuya", "keio").length, 0);
});

test("searches Japanese station names and keeps line identity", () => {
  const shinjukuMatches = filterStationOptions("新宿", "all");
  assert.deepEqual(shinjukuMatches.map((option) => [option.lineId, option.name]), [
    ["keio", "Shinjuku"],
    ["shinjuku", "Shinjuku"],
    ["shinjuku", "Shinjuku-sanchome"],
    ["chuo", "Shinjuku"],
    ["yamanote", "Shinjuku"],
  ]);

  const ginzaMatch = filterStationOptions("浅草", "ginza");
  assert.equal(ginzaMatch.length, 1);
  assert.equal(ginzaMatch[0].name, "Asakusa");
  assert.equal(ginzaMatch[0].lineCode, "G");
});

test("finds the closest station across all lines and reports its line", () => {
  const closest = findClosestStation("all", 35.658, 139.7016);
  assert.equal(closest.station.name, "Shibuya");
  assert.equal(closest.lineId, "inokashira");
});

test("turns raw bearings into 16-point compass directions", () => {
  assert.deepEqual(describeBearing(239), { short: "WSW", label: "West-southwest" });
  assert.deepEqual(describeBearing(45), { short: "NE", label: "Northeast" });
  assert.deepEqual(describeBearing(359), { short: "N", label: "North" });
});

test("describes the sun's height in human terms", () => {
  assert.equal(describeSunElevation(-2), "Below the horizon");
  assert.equal(describeSunElevation(8), "Low above the horizon");
  assert.equal(describeSunElevation(34), "Mid-sky");
  assert.equal(describeSunElevation(58), "High in the sky");
  assert.equal(describeSunElevation(76), "Nearly overhead");
});
