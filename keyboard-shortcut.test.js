import test from "node:test";
import assert from "node:assert/strict";

import { shouldFocusOriginForTyping } from "./keyboard-shortcut.js";

const event = (overrides = {}) => ({
  key: "s",
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  defaultPrevented: false,
  isComposing: false,
  ...overrides,
});

const element = (interactive = false) => ({
  isContentEditable: false,
  matches: () => interactive,
});

test("routes an unmodified printable key to origin from idle page chrome", () => {
  assert.equal(shouldFocusOriginForTyping(event(), element()), true);
});

test("does not steal typing or keyboard interaction from active controls", () => {
  assert.equal(shouldFocusOriginForTyping(event(), element(true)), false);
  assert.equal(shouldFocusOriginForTyping(event({ key: "ArrowDown" }), element()), false);
  assert.equal(shouldFocusOriginForTyping(event({ ctrlKey: true }), element()), false);
  assert.equal(shouldFocusOriginForTyping(event({ defaultPrevented: true }), element()), false);
  assert.equal(shouldFocusOriginForTyping(event({ isComposing: true }), element()), false);
});
