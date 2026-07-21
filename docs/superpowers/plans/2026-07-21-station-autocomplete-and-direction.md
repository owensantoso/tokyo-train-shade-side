# Station Autocomplete And Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add line-aware station autocomplete and human-readable train/sun direction explanations while refining the station-board visual system.

**Architecture:** Pure search, all-lines, and compass logic stays in `shade.js`. A new `station-combobox.js` owns accessible combobox DOM behavior, while `app.js` coordinates the two comboboxes, line state, geolocation, swap, and recommendation rendering.

**Tech Stack:** Static HTML, CSS, JavaScript modules, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Pure Station Search And Compass Helpers

**Files:**
- Modify: `shade.test.js`
- Modify: `shade.js`

- [ ] **Step 1: Add failing tests for `stationOptions`, `filterStationOptions`, all-lines nearest lookup, `describeBearing`, and `describeSunElevation`.**
- [ ] **Step 2: Run `npm test` and verify the missing exports fail the suite.**
- [ ] **Step 3: Implement flattened line-aware options, stable prefix/substring filtering, all-lines nearest lookup, 16-point compass conversion, and elevation bands.**
- [ ] **Step 4: Run `npm test` and confirm the full suite passes.**

Expected contracts:

```js
assert.deepEqual(describeBearing(239), { short: "WSW", label: "West-southwest" });
assert.equal(filterStationOptions("meidai", "all").length, 2);
assert.equal(findClosestStation("all", 35.658, 139.7016).station.name, "Shibuya");
```

### Task 2: Accessible Combobox Component

**Files:**
- Create: `station-combobox.js`
- Modify: `index.html`
- Modify: `app.js`

- [ ] **Step 1: Replace both native selects with labeled text inputs and listboxes using unique ARIA ids.**
- [ ] **Step 2: Implement `StationCombobox` with `setLine`, `setSelection`, `clear`, `focusAndOpen`, `getSelection`, keyboard navigation, and pointer selection.**
- [ ] **Step 3: Default to All lines, establish a line from station selection, and hand Origin selection to an already-open Destination list.**
- [ ] **Step 4: Update swap and geolocation to work with selected station records and all-lines mode.**

### Task 3: Human Explanation And Visual Refinement

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Render human compass labels and raw degrees in the details disclosure.**
- [ ] **Step 2: Add a top-down compass with train and sun indicators driven by safe numeric CSS custom properties.**
- [ ] **Step 3: Restyle the shell as crisp Tokyo wayfinding with flat fields, technical labels, restrained corners, and semantic line badges.**
- [ ] **Step 4: Center a new two-arrow swap SVG in a stable 44px target and verify it does not shift.**
- [ ] **Step 5: Add listbox open, active, empty, focus, touch, and reduced-motion states.**

### Task 4: Verification And Deployment

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document All lines search, keyboard controls, and human compass descriptions.**
- [ ] **Step 2: Run `npm test`, `node --check`, and `git diff --check`.**
- [ ] **Step 3: Verify 375px, landscape, and desktop layouts plus keyboard/pointer flows in the browser.**
- [ ] **Step 4: Verify no horizontal overflow, inaccessible labels, stale recommendations, or console errors.**
- [ ] **Step 5: Commit the scoped changes, integrate to `main`, push, wait for Pages, and repeat the key autocomplete interaction on the live URL.**

