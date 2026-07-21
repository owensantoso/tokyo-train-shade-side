const MAX_VISIBLE_OPTIONS = 9;

export class StationCombobox {
  constructor({ input, listbox, getOptions, onSelect, onInput }) {
    this.input = input;
    this.listbox = listbox;
    this.getOptions = getOptions;
    this.onSelect = onSelect;
    this.onInput = onInput;
    this.lineId = "all";
    this.selection = null;
    this.options = [];
    this.activeIndex = -1;

    this.input.addEventListener("focus", () => this.open());
    this.input.addEventListener("input", () => {
      this.selection = null;
      this.onInput?.();
      this.open();
    });
    this.input.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.input.addEventListener("blur", () => {
      window.setTimeout(() => this.close(), 100);
    });
    this.listbox.addEventListener("pointerdown", (event) => {
      const option = event.target.closest("[data-option-index]");
      if (!option) return;
      event.preventDefault();
      this.choose(Number(option.dataset.optionIndex));
    });
  }

  setLine(lineId) {
    this.lineId = lineId;
  }

  setSelection(option) {
    this.selection = option;
    this.input.value = option?.name ?? "";
    this.input.setAttribute("aria-invalid", "false");
    this.close();
  }

  getSelection() {
    return this.selection;
  }

  clear() {
    this.selection = null;
    this.input.value = "";
    this.input.setAttribute("aria-invalid", "false");
    this.close();
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
      empty.textContent = "No matching stations";
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
      name.textContent = option.name;

      const line = document.createElement("span");
      line.className = `line-badge line-badge-${option.lineId}`;
      line.textContent = option.lineLabel;

      item.append(name, line);
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
