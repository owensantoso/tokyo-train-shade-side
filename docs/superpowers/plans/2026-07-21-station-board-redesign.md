# Station Board Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved station-board redesign with route swapping and selected-line nearest-station lookup.

**Architecture:** Preserve the zero-build static site. Put deterministic distance and station-selection logic in `shade.js`; keep browser geolocation and rendering in `app.js`; express the approved visual system in semantic HTML and mobile-first CSS.

**Tech Stack:** HTML5, CSS, browser JavaScript modules, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Geographic Helpers

**Files:**
- Modify: `shade.test.js`
- Modify: `shade.js`

- [ ] **Step 1: Write failing tests for geographic distance and line-scoped nearest station**

```js
test("finds the closest station only on the selected line", () => {
  assert.equal(findClosestStation("inokashira", 35.6617, 139.6667).station.name, "Shimokitazawa");
  assert.equal(findClosestStation("keio", 35.6687, 139.6503).station.name, "Meidaimae");
});
```

- [ ] **Step 2: Run `npm test` and confirm the missing export causes failure**
- [ ] **Step 3: Implement `calculateDistanceKm` with the haversine formula and `findClosestStation` over `LINES[lineId].stations`**
- [ ] **Step 4: Run `npm test` and confirm all tests pass**

### Task 2: Commuter Interactions

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] **Step 1: Add semantic controls for segmented lines, stacked stations, swap, nearest station, and Now / Pick time**
- [ ] **Step 2: Implement swap as a value exchange followed by recommendation rendering**
- [ ] **Step 3: Implement geolocation with pending, success, denied, unavailable, timeout, and unsupported messages**
- [ ] **Step 4: Keep technical recommendation values inside a native `details` disclosure**

### Task 3: Station-Board Visual System

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add line, surface, text, focus, answer, and status design tokens**
- [ ] **Step 2: Build the one-column phone layout with 44px controls and stable station field dimensions**
- [ ] **Step 3: Add the wider two-column tool/result layout without nesting cards**
- [ ] **Step 4: Add hover, focus-visible, disabled, loading, error, and reduced-motion states**

### Task 4: Verification And Publish

**Files:**
- Modify: `README.md`
- Create: `.gitignore`

- [ ] **Step 1: Document geolocation privacy, HTTPS requirement, and approximate nearest-station behavior**
- [ ] **Step 2: Ignore `.superpowers/` mockup session artifacts**
- [ ] **Step 3: Run `npm test` and inspect the full output**
- [ ] **Step 4: Serve the site locally and verify swap, time selection, geolocation states, console output, and responsive layouts in a browser**
- [ ] **Step 5: Stage only project changes, commit, push `main`, wait for Pages, and verify the live HTML and module assets return HTTP 200**

