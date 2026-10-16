/**
 * Panning and zooming a canvas, Figma style: scrolling pans, pinching (which trackpads
 * send as Ctrl + scroll) or Ctrl/⌘ + scroll zooms about the pointer, and two fingers on a
 * touch screen pinch and pan together. Positions are in screen pixels from the canvas's
 * top-left corner; the content is drawn translated by (x, y), then scaled by zoom.
 */
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3;

export class Camera {
  x = $state(0);
  y = $state(0);
  zoom = $state(1);

  /** Zooms by a factor, keeping the point (px, py) under the pointer where it is. */
  zoomAt(factor: number, px: number, py: number) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom * factor));
    const k = next / this.zoom;
    this.x = px - (px - this.x) * k;
    this.y = py - (py - this.y) * k;
    this.zoom = next;
  }

  panBy(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
  }

  /** A wheel or trackpad event over the canvas, whose top-left corner is at (left, top). */
  wheel(event: WheelEvent, left: number, top: number) {
    event.preventDefault();
    // A mouse wheel's click is a big step; a trackpad pinch sends many small ones.
    const step = Math.max(-20, Math.min(20, event.deltaY));
    if (event.ctrlKey || event.metaKey)
      this.zoomAt(
        Math.exp(-step * 0.01),
        event.clientX - left,
        event.clientY - top,
      );
    else this.panBy(-event.deltaX, -event.deltaY);
  }
}
