/** Teaching full screen: the side menu hides, and the browser's own bars too where allowed. */
class Ui {
  fullscreen = $state(false);

  async enterFullscreen() {
    this.fullscreen = true;
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Some browsers refuse; hiding the side menu is still full screen enough.
    }
  }

  async exitFullscreen() {
    this.fullscreen = false;
    if (document.fullscreenElement)
      await document.exitFullscreen().catch(() => {});
  }
}

export const ui = new Ui();

if (typeof document !== "undefined") {
  // Pressing Esc leaves the browser's full screen; leave ours with it.
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) ui.fullscreen = false;
  });
}
