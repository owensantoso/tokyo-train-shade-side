import test from "node:test";
import assert from "node:assert/strict";

import {
  PhoneCompassController,
  extractCompassHeading,
  signedHeadingDifference,
  smoothHeading,
} from "./phone-compass.js";

class FakeWindow {
  constructor(permission = "granted") {
    this.listeners = new Map();
    this.DeviceOrientationEvent = {
      requestPermission: async () => permission,
    };
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, event) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

test("extracts iPhone and standards-based absolute compass headings", () => {
  assert.equal(extractCompassHeading({ webkitCompassHeading: 241.5 }), 241.5);
  assert.equal(extractCompassHeading({ absolute: true, alpha: 90 }), 270);
  assert.equal(extractCompassHeading({ absolute: true, alpha: 0 }), 0);
});

test("rejects relative orientation and invalid sensor readings", () => {
  assert.equal(extractCompassHeading({ absolute: false, alpha: 90 }), null);
  assert.equal(extractCompassHeading({ absolute: true, alpha: null }), null);
  assert.equal(extractCompassHeading({ webkitCompassHeading: Number.NaN }), null);
});

test("compares headings using the shortest signed angle", () => {
  assert.equal(signedHeadingDifference(149, 155), 6);
  assert.equal(signedHeadingDifference(359, 1), 2);
  assert.equal(signedHeadingDifference(1, 359), -2);
});

test("smooths compass headings across north without a full rotation", () => {
  assert.ok(smoothHeading(359, 1, 0.5) < 0.01);
  assert.equal(smoothHeading(null, 241, 0.2), 241);
});

test("requests permission and publishes smoothed active headings", async () => {
  const fakeWindow = new FakeWindow("granted");
  const states = [];
  const compass = new PhoneCompassController({
    windowObject: fakeWindow,
    smoothingFactor: 0.5,
    onState: (state) => states.push(state),
  });

  await compass.start();
  assert.equal(states.at(-1).status, "waiting");
  fakeWindow.emit("deviceorientation", { webkitCompassHeading: 359 });
  fakeWindow.emit("deviceorientation", { webkitCompassHeading: 1 });

  assert.equal(states.at(-1).status, "active");
  assert.ok(states.at(-1).heading < 0.01);
});

test("reports denied and unsupported states without adding listeners", async () => {
  const deniedWindow = new FakeWindow("denied");
  const deniedStates = [];
  const denied = new PhoneCompassController({
    windowObject: deniedWindow,
    onState: (state) => deniedStates.push(state),
  });
  await denied.start();

  assert.equal(deniedStates.at(-1).status, "denied");
  assert.equal(deniedWindow.listeners.size, 0);

  const unsupportedStates = [];
  const unsupported = new PhoneCompassController({
    windowObject: {},
    onState: (state) => unsupportedStates.push(state),
  });
  await unsupported.start();
  assert.equal(unsupportedStates.at(-1).status, "unsupported");
});

test("stops sensor listeners and returns to idle", async () => {
  const fakeWindow = new FakeWindow("granted");
  const states = [];
  const compass = new PhoneCompassController({
    windowObject: fakeWindow,
    onState: (state) => states.push(state),
  });

  await compass.start();
  compass.stop();

  assert.equal(states.at(-1).status, "idle");
  assert.equal(fakeWindow.listeners.get("deviceorientation")?.size, 0);
  assert.equal(fakeWindow.listeners.get("deviceorientationabsolute")?.size, 0);
});
