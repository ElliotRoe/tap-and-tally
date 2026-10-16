import { STAGE_HEIGHT, STAGE_WIDTH } from "$lib/domain/types";

/**
 * Positions a box on the room stage, in percentages so the stage can be any size, turned
 * about its centre.
 */
export function boxStyle(
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
): string {
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;
  const turn = rotation ? `;transform:rotate(${rotation}deg)` : "";
  return `left:${pct(x, STAGE_WIDTH)};top:${pct(y, STAGE_HEIGHT)};width:${pct(w, STAGE_WIDTH)};height:${pct(h, STAGE_HEIGHT)}${turn}`;
}

/** The same, for anything placed in a Room Layout. */
export function placedStyle(item: {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}): string {
  return boxStyle(item.x, item.y, item.w, item.h, item.rotation);
}

/** A pointer's position on the stage, in stage units. */
export function stagePoint(
  stage: HTMLElement,
  event: { clientX: number; clientY: number },
) {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * STAGE_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * STAGE_HEIGHT,
  };
}

/** How many stage units one screen pixel is worth on this stage element. */
export function unitsPerPixel(stage: HTMLElement): number {
  return STAGE_WIDTH / stage.getBoundingClientRect().width;
}

/**
 * The element under a pointer carrying a data attribute, ignoring the element being
 * dragged (marked with the "dragging" class) and whatever it is still sitting inside.
 */
export function dropTarget(
  event: PointerEvent,
  attribute: string,
): HTMLElement | null {
  const dragged = document.querySelector(".dragging");
  const hit = document
    .elementsFromPoint(event.clientX, event.clientY)
    .find(
      (el) =>
        el instanceof HTMLElement &&
        el.dataset[attribute] &&
        !(dragged && el.contains(dragged)),
    );
  return (hit as HTMLElement) ?? null;
}

/**
 * Keeps a student's tile upright on a turned desk: a square the size of the desk's short
 * side, centred on it and turned back the other way.
 */
export function uprightStyle(item: {
  w: number;
  h: number;
  rotation: number;
}): string {
  const side = Math.min(item.w, item.h);
  const pw = (side / item.w) * 100;
  const ph = (side / item.h) * 100;
  const turn = item.rotation ? `;transform:rotate(${-item.rotation}deg)` : "";
  return `position:absolute;width:${pw}%;height:${ph}%;left:${(100 - pw) / 2}%;top:${(100 - ph) / 2}%${turn}`;
}
