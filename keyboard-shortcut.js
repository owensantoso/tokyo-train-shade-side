const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[role='dialog']",
  "[role='option']",
].join(",");

export function shouldFocusOriginForTyping(event, activeElement) {
  if (
    event.defaultPrevented
    || event.isComposing
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || event.key.length !== 1
    || !event.key.trim()
  ) {
    return false;
  }

  if (activeElement?.isContentEditable) return false;
  return !activeElement?.matches?.(INTERACTIVE_SELECTOR);
}
