const MAX_VISIBLE_OPTIONS = 9;
const TAP_MOVEMENT_THRESHOLD = 8;

export function compactStationCodes(codes = [], maxVisible = 2) {
  if (codes.length <= maxVisible) return codes.join(" · ");
  return `${codes.length} lines`;
}

export function isTapGesture(start, end) {
  return Math.hypot(end.x - start.x, end.y - start.y) <= TAP_MOVEMENT_THRESHOLD;
}

export function orderStationNames(option, preferredName) {
  const japaneseFirst = preferredName === option?.nameJa;
  return japaneseFirst
    ? { primary: option.nameJa, secondary: option.name, primaryLanguage: "ja", secondaryLanguage: "en" }
    : { primary: option.name, secondary: option.nameJa, primaryLanguage: "en", secondaryLanguage: "ja" };
}

export class StationCombobox {
  constructor({ input, listbox, codeElement, clearButton, getOptions, onSelect, onInput, onClear, getText = (key) => key, getOptionLabel = (option) => option?.name ?? "" }) {
    this.input = input;
    this.listbox = listbox;
    this.codeElement = codeElement;
    this.clearButton = clearButton;
    this.getOptions = getOptions;
    this.onSelect = onSelect;
    this.onInput = onInput;
    this.onClear = onClear;
    this.getText = getText;
    this.getOptionLabel = getOptionLabel;
    this.lineId = "all";
    this.selection = null;
    this.options = [];
    this.activeIndex = -1;
    this.pointerSession = null;

    this.input.addEventListener("focus", () => this.open());
    this.input.addEventListener("input", () => {
      this.selection = null;
      this.updateClearButton();
      this.onInput?.();
      this.open();
    });
    this.input.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.input.addEventListener("blur", () => {
      const listInteraction = this.pointerSession !== null;
      window.setTimeout(() => {
        if (!listInteraction) this.close();
      }, 100);
    });
    this.listbox.addEventListener("pointerdown", (event) => {
      const option = event.target.closest("[data-option-index]");
      if (!option) return;

      if (event.pointerType === "mouse") event.preventDefault();
      this.pointerSession = {
        pointerId: event.pointerId,
        optionIndex: Number(option.dataset.optionIndex),
        start: { x: event.clientX, y: event.clientY },
      };
    });
    this.listbox.addEventListener("pointerup", (event) => {
      const session = this.pointerSession;
      if (!session || session.pointerId !== event.pointerId) return;

      this.pointerSession = null;
      const option = event.target.closest("[data-option-index]");
      const endedOnSameOption = Number(option?.dataset.optionIndex) === session.optionIndex;
      if (endedOnSameOption && isTapGesture(session.start, { x: event.clientX, y: event.clientY })) {
        event.preventDefault();
        this.choose(session.optionIndex);
      }
    });
    this.listbox.addEventListener("pointercancel", () => {
      this.pointerSession = null;
    });
    document.addEventListener("pointerdown", (event) => {
      if (event.target !== this.input && !this.listbox.contains(event.target)) this.close();
    });
    this.clearButton?.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    this.clearButton?.addEventListener("click", () => {
      this.clear();
      this.onClear?.();
      this.focusAndOpen();
    });
    this.updateClearButton();
  }

  setLine(lineId) {
    this.lineId = lineId;
  }

  setSelection(option) {
    this.selection = option;
    this.input.value = option ? (this.getOptionLabel(option) ?? "") : "";
    this.input.setAttribute("aria-invalid", "false");
    if (this.codeElement) {
      const stationCodes = option?.stationCodes ?? (option?.stationCode ? [option.stationCode] : []);
      this.codeElement.textContent = compactStationCodes(stationCodes);
      this.codeElement.title = option ? `${stationCodes.join(" · ")} — ${option.lineName}` : "";
      this.codeElement.setAttribute("aria-label", option ? `${stationCodes.join(", ")}. ${option.lineName}` : "");
      this.codeElement.hidden = !option;
    }
    this.updateClearButton();
    this.close();
  }

  getSelection() {
    return this.selection;
  }

  clear() {
    this.selection = null;
    this.input.value = "";
    this.input.setAttribute("aria-invalid", "false");
    if (this.codeElement) {
      this.codeElement.textContent = "";
      this.codeElement.hidden = true;
    }
    this.updateClearButton();
    this.close();
  }

  updateClearButton() {
    if (this.clearButton) this.clearButton.hidden = !this.input.value;
  }

  focusAndOpen() {
    this.input.focus();
    this.open();
  }

  open() {
    this.options = this.getOptions(this.input.value, this.lineId).slice(0, MAX_VISIBLE_OPTIONS);
    this.activeIndex = this.options.length ? 0 : -1;
    this.render();
    this.listbox.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
    this.updateActiveOption();
  }

  close() {
    this.listbox.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-activedescendant");
    this.activeIndex = -1;
  }

  choose(index) {
    const option = this.options[index];
    if (!option) return;
    this.setSelection(option);
    this.onSelect(option);
  }

  handleKeydown(event) {
    if (event.isComposing || event.keyCode === 229) return;

    if (event.key === "Escape") {
      this.close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (this.listbox.hidden) this.open();
      if (!this.options.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      this.activeIndex = (this.activeIndex + delta + this.options.length) % this.options.length;
      this.updateActiveOption();
      return;
    }

    if (event.key === "Enter" && !this.listbox.hidden && this.activeIndex >= 0) {
      event.preventDefault();
      this.choose(this.activeIndex);
    }
  }

  render() {
    this.listbox.replaceChildren();
    if (!this.options.length) {
      const empty = document.createElement("li");
      empty.className = "suggestion-empty";
      empty.textContent = this.getText("noMatches");
      this.listbox.append(empty);
      return;
    }

    this.options.forEach((option, index) => {
      const item = document.createElement("li");
      item.id = `${this.listbox.id}-option-${index}`;
      item.className = "station-suggestion";
      item.dataset.optionIndex = String(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");

      const name = document.createElement("span");
      name.className = "suggestion-name";
      const orderedNames = orderStationNames(option, this.getOptionLabel(option));
      const primaryName = document.createElement("span");
      primaryName.lang = orderedNames.primaryLanguage;
      primaryName.textContent = orderedNames.primary;
      const secondaryName = document.createElement("span");
      secondaryName.className = "suggestion-name-secondary";
      secondaryName.lang = orderedNames.secondaryLanguage;
      secondaryName.textContent = orderedNames.secondary;
      name.append(primaryName, secondaryName);

      const lines = document.createElement("span");
      lines.className = "suggestion-lines";
      option.lineIds.forEach((lineId, lineIndex) => {
        const line = document.createElement("span");
        const stationCode = option.stationCodes[lineIndex];
        line.className = `line-badge line-badge-${lineId}`;
        line.textContent = stationCode;
        line.setAttribute("aria-label", `${stationCode}, ${option.lineNames[lineIndex]}`);
        lines.append(line);
      });
      lines.title = option.lineName;

      item.append(name, lines);
      this.listbox.append(item);
    });
  }

  updateActiveOption() {
    const items = this.listbox.querySelectorAll('[role="option"]');
    items.forEach((item, index) => {
      const isActive = index === this.activeIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
      if (isActive) {
        this.input.setAttribute("aria-activedescendant", item.id);
        item.scrollIntoView({ block: "nearest" });
      }
    });
  }
}
