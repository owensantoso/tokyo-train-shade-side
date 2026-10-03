# Tokyo Presets and Station Input Corrections

Reviewed maintenance candidate, based on main `92a7e5ae79247ec78648c38e078fc30d7f7ef74d`. No deployment is part of this change.

## Behavior

- Evening and tomorrow-morning shortcuts use Tokyo calendar days and clock times, matching manual input and shared links, regardless of device timezone. `+30 min` remains an elapsed-time offset. At exactly 18:00, “This evening” chooses the next day as before.
- The Now label uses the existing Tokyo clock formatter.
- Station list shortcuts leave IME composition keys alone (`isComposing` or composition key code 229). Ordinary Enter still selects and closes the list.
- Reapplying a blank station selection during language switching leaves an empty input. Selected stations keep their identity and change labels.

## Evidence

Before the corrections, nine focused cases failed: two non-Tokyo device timezone tests, five composition cases, and two blank-endpoint language-switch cases. The fixtures invoke actual combobox methods and emulate the DOM input's string coercion; they do not validate a native Japanese IME.

After the corrections, all **98 Node tests pass** (86 baseline plus 12 new cases). Fixed-instant subprocesses test Tokyo, UTC and Los Angeles devices, Tokyo midnight, the exact evening boundary and year rollover. No astronomy, routing, rail geometry, map styling or deployment behavior is changed.

The preset calculation reuses `trip-state.js` Tokyo serialization/parsing. UTC setters advance the Tokyo calendar representation; they never read the device's local wall clock. No new dependency is added.

Real browser/native Japanese IME behavior remains a follow-up verification gate. The existing route approximation and map limits remain unchanged.
