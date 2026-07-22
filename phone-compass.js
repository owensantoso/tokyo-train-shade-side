const normalizeHeading = (degrees) => ((degrees % 360) + 360) % 360;

export function extractCompassHeading(event) {
  if (Number.isFinite(event.webkitCompassHeading)) {
    return normalizeHeading(event.webkitCompassHeading);
  }
  if (event.absolute === true && Number.isFinite(event.alpha)) {
    return normalizeHeading(360 - event.alpha);
  }
  return null;
}

export function signedHeadingDifference(referenceHeading, heading) {
  const difference = normalizeHeading(heading - referenceHeading);
  return difference > 180 ? difference - 360 : difference;
}

export function smoothHeading(previousHeading, nextHeading, factor = 0.2) {
  if (!Number.isFinite(previousHeading)) return normalizeHeading(nextHeading);
  return normalizeHeading(previousHeading + signedHeadingDifference(previousHeading, nextHeading) * factor);
}

export class PhoneCompassController {
  constructor({ windowObject = window, onState = () => {}, smoothingFactor = 0.2 } = {}) {
    this.window = windowObject;
    this.onState = onState;
    this.smoothingFactor = smoothingFactor;
    this.heading = null;
    this.listening = false;
    this.handleOrientation = this.handleOrientation.bind(this);
  }

  emit(status, heading = this.heading) {
    this.onState({ status, heading });
  }

  async start() {
    if (this.listening) return;
    const OrientationEvent = this.window.DeviceOrientationEvent;
    if (!OrientationEvent || this.window.isSecureContext === false) {
      this.emit("unsupported", null);
      return;
    }

    this.emit("requesting", null);
    try {
      if (typeof OrientationEvent.requestPermission === "function") {
        const permission = await OrientationEvent.requestPermission(true);
        if (permission !== "granted") {
          this.emit("denied", null);
          return;
        }
      }
    } catch {
      this.emit("denied", null);
      return;
    }

    this.window.addEventListener("deviceorientationabsolute", this.handleOrientation);
    this.window.addEventListener("deviceorientation", this.handleOrientation);
    this.listening = true;
    this.emit("waiting", null);
  }

  stop() {
    this.window.removeEventListener?.("deviceorientationabsolute", this.handleOrientation);
    this.window.removeEventListener?.("deviceorientation", this.handleOrientation);
    this.listening = false;
    this.heading = null;
    this.emit("idle", null);
  }

  handleOrientation(event) {
    const nextHeading = extractCompassHeading(event);
    if (nextHeading === null) return;
    this.heading = smoothHeading(this.heading, nextHeading, this.smoothingFactor);
    this.emit("active");
  }
}
