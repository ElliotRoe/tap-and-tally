/**
 * Tells a tap from a press-and-hold. While held, the element's `--hold` CSS variable runs
 * from 0 to 1, so it can fill like a progress bar; letting go early is a tap, holding
 * until it fills calls onHold. The fill waits a moment before it starts, so an ordinary
 * tap never flickers it. A right-click holds straight away.
 */
export const HOLD_MS = 700;
/** How long a press must last before the hold starts to show. */
export const HOLD_DELAY_MS = 150;

export function hold(
  node: HTMLElement,
  handlers: { onTap?: () => void; onHold: () => void },
) {
  let current = handlers;
  let frame = 0;
  let started = 0;
  let start = { x: 0, y: 0 };
  let done = false;

  const set = (progress: number) => {
    node.style.setProperty("--hold", String(progress));
    node.toggleAttribute("data-holding", progress > 0 && progress < 1);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    set(0);
  };

  const tick = (now: number) => {
    const progress = Math.min(
      Math.max(now - started - HOLD_DELAY_MS, 0) / HOLD_MS,
      1,
    );
    set(progress);
    if (progress < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      done = true;
      frame = 0;
      current.onHold();
      setTimeout(() => set(0), 150);
    }
  };

  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    done = false;
    start = { x: event.clientX, y: event.clientY };
    started = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const move = (event: PointerEvent) => {
    if (
      frame &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12
    )
      stop();
  };

  const click = () => {
    const wasHeld = done;
    stop();
    done = false;
    if (!wasHeld) current.onTap?.();
  };

  const menu = (event: Event) => {
    event.preventDefault();
    stop();
    done = true;
    current.onHold();
  };

  node.addEventListener("pointerdown", down);
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerleave", stop);
  node.addEventListener("pointercancel", stop);
  node.addEventListener("click", click);
  node.addEventListener("contextmenu", menu);
  return {
    update(next: typeof handlers) {
      current = next;
    },
    destroy() {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", stop);
      node.removeEventListener("pointercancel", stop);
      node.removeEventListener("click", click);
      node.removeEventListener("contextmenu", menu);
    },
  };
}
