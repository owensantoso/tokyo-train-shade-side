# Route, Time, and Yamanote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve route interactions and departure controls while adding a correctly modeled Yamanote loop and visible result reasoning.

**Architecture:** Keep the static app architecture. Add pure route/time helpers in `shade.js`, consume them from `app.js`, and extend existing HTML/CSS controls without dependencies.

**Tech Stack:** HTML, CSS, browser JavaScript ES modules, Node test runner, GitHub Pages.

---

### Task 1: Test route and time state helpers

**Files:**
- Modify: `shade.test.js`
- Modify: `shade.js`

- [ ] Add failing tests proving `swapStations` accepts either empty value and time presets produce deterministic local dates.
- [ ] Run `node shade.test.js` and verify the new helper tests fail.
- [ ] Implement `departurePreset(now, preset)` and retain nullable values in `swapStations`.
- [ ] Run `node shade.test.js` and verify the helper tests pass.

### Task 2: Add the circular Yamanote model

**Files:**
- Modify: `shade.test.js`
- Modify: `shade.js`

- [ ] Add failing tests for all 30 JY stations, Japanese search, and shorter-arc direction in each orientation.
- [ ] Add the ordered Yamanote station data with `circular: true`.
- [ ] Add a route-segment helper that chooses the shorter forward or reverse arc and use it in `getRecommendation`.
- [ ] Run `node shade.test.js` and verify all data and direction tests pass.

### Task 3: Fix route interactions

**Files:**
- Modify: `app.js`

- [ ] Change closest-station success handling to preserve a compatible destination.
- [ ] Change swap handling to exchange selected or empty combobox state and focus the newly empty field.
- [ ] Verify complete and partial routes recompute without stale selection state.

### Task 4: Build clearer departure controls

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] Replace `datetime-local` with separate date/time fields and three preset buttons.
- [ ] Wire presets through `departurePreset`, keep `Now` labels current, and recompute on changes.
- [ ] Style compact, touch-friendly controls that fit a 320 px viewport without overlap.

### Task 5: Add Yamanote styling and visible reasoning

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `README.md`

- [ ] Add the JY selector, line badge, green theme, and header stripe segment.
- [ ] Render completed result details with the `open` attribute.
- [ ] Update supported-line and route-assumption documentation.

### Task 6: Verify and deploy

**Files:**
- Test: `shade.test.js`

- [ ] Run unit tests, syntax checks, and `git diff --check`.
- [ ] Test partial swap, preserved destination, Yamanote route, time presets, and expanded reasoning at mobile and desktop widths.
- [ ] Commit, push `main`, wait for GitHub Pages, and verify the public assets contain the release.
