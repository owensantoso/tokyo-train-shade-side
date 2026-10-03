import test from "node:test";
import assert from "node:assert/strict";
import { orderStationNames, StationCombobox } from "./station-combobox.js";

const shinjuku = { name: "Shinjuku", nameJa: "新宿" };

test("puts the active language first in station suggestions", () => {
  assert.deepEqual(orderStationNames(shinjuku, "新宿"), {
    primary: "新宿",
    secondary: "Shinjuku",
    primaryLanguage: "ja",
    secondaryLanguage: "en",
  });
  assert.deepEqual(orderStationNames(shinjuku, "Shinjuku"), {
    primary: "Shinjuku",
    secondary: "新宿",
    primaryLanguage: "en",
    secondaryLanguage: "ja",
  });
});

function combobox(getOptionLabel = (option) => option?.name) {
  // DOM input values coerce assignments to strings. Keep that behavior in the fixture.
  let value = "";
  const input = {
    get value() { return value; },
    set value(next) { value = String(next); },
    setAttribute() {}, removeAttribute() {},
  };
  return Object.assign(Object.create(StationCombobox.prototype), {
    input, listbox: { hidden: false, querySelectorAll: () => [] }, codeElement: null, clearButton: { hidden: true },
    getOptionLabel, selection: null, options: [shinjuku], activeIndex: 0, onSelect() {},
  });
}

for (const key of ["Enter", "ArrowDown", "ArrowUp", "Escape"]) {
  test(`IME composition owns ${key} instead of the station list`, () => {
    const field = combobox();
    let prevented = false;
    field.handleKeydown({ key, isComposing: true, preventDefault() { prevented = true; } });
    assert.equal(prevented, false);
    assert.equal(field.getSelection(), null);
    assert.equal(field.activeIndex, 0);
    assert.equal(field.listbox.hidden, false);
  });
}

test("composition key-code Enter does not select a station after composition state clears", () => {
  const field = combobox();
  let prevented = false;
  field.handleKeydown({ key: "Enter", isComposing: false, keyCode: 229, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.equal(field.getSelection(), null);
});

test("ordinary Enter still selects and closes the station list", () => {
  const field = combobox();
  let selected = null;
  let prevented = false;
  field.onSelect = (option) => { selected = option; };
  field.handleKeydown({ key: "Enter", isComposing: false, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(field.getSelection(), shinjuku);
  assert.equal(selected, shinjuku);
  assert.equal(field.input.value, "Shinjuku");
  assert.equal(field.listbox.hidden, true);
});

for (const selections of [[null, null], [shinjuku, null], [shinjuku, shinjuku]]) {
  test(`language switching preserves selections and blank fields (${selections.filter(Boolean).length} selected)`, () => {
    let language = "en";
    const fields = selections.map((selection) => {
      const field = combobox((option) => language === "ja" ? option?.nameJa : option?.name);
      field.setSelection(selection);
      return field;
    });
    for (const next of ["ja", "en"]) {
      language = next;
      fields.forEach((field, index) => {
        field.setSelection(field.getSelection()); // The actual language-switch call boundary.
        assert.equal(field.getSelection(), selections[index]);
        assert.equal(field.input.value, selections[index] ? (next === "ja" ? "新宿" : "Shinjuku") : "");
        assert.equal(field.clearButton.hidden, !selections[index]);
      });
    }
  });
}
