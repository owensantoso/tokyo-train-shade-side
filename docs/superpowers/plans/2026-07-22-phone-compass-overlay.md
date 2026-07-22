# Phone Compass Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional phone-heading needle to the daylight orientation diagram so riders can compare the phone's direction with the calculated train bearing.

**Architecture:** A new `phone-compass.js` module owns sensor permission, absolute-heading extraction, circular smoothing, and start/stop state. `app.js` binds that controller to the existing result DOM; it never changes route or shade calculations. The feature is progressive enhancement and remains absent from night results.

**Tech Stack:** Static HTML, CSS, browser Device Orientation API, Node test runner.

---

### Task 1: Heading Logic

**Files:**
- Create: `phone-compass.js`
- Create: `phone-compass.test.js`

- [ ] Write failing tests for WebKit headings, standards-based absolute alpha conversion, relative-event rejection, signed heading differences, and smoothing across north.
- [ ] Run `node phone-compass.test.js` and confirm the missing-module failure.
- [ ] Implement pure heading helpers and rerun the test until all cases pass.

### Task 2: Sensor Controller

**Files:**
- Modify: `phone-compass.js`
- Modify: `phone-compass.test.js`

- [ ] Add failing tests using a small fake window for granted, denied, unsupported, active, and stopped states.
- [ ] Implement `PhoneCompassController` with user-triggered permission, iPhone fallback, absolute event listeners, smoothing, and listener cleanup.
- [ ] Run `node phone-compass.test.js` and confirm all controller tests pass.

### Task 3: Orientation UI

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `README.md`

- [ ] Add a hidden phone needle, phone legend key, 44px compass toggle, live status, and phone-versus-train direction row to daylight results.
- [ ] Keep the feature out of night results and preserve the current train/sun layout when unsupported or inactive.
- [ ] Update the prototype version and document local-only sensor behavior and limitations.

### Task 4: Verification And Release

**Files:**
- Test: `phone-compass.test.js`
- Test: `shade.test.js`
- Test: `line-schematic.test.js`

- [ ] Run all test files, syntax checks, and `git diff --check`.
- [ ] Test mobile inactive, granted/simulated active, stopped, denied/unsupported, daytime, and night states in the browser.
- [ ] Commit, push `main`, wait for GitHub Pages, and verify deployed v0.8 assets.
