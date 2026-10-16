<!--
  Draws a Room Layout, FigJam style, filling the space it's given. Drag a Desk out of the
  bar at the bottom. Click a desk to select it, then drag to move, pull a handle to
  resize, or the round handle above to turn it (15° steps). Drag across empty floor to
  select several (Shift-click adds or removes one); they move together, and the handles
  on the box around them stretch them as one. Everything snaps to the grid dots. Delete
  or Backspace removes the selection; arrow keys nudge it; Ctrl/⌘-A selects every desk.
  Ctrl/⌘ C, X and V copy, cut and paste desks, even into another room; Ctrl/⌘-D
  duplicates; Alt/Option-drag drags away copies and leaves the originals.
-->

<script module lang="ts">
  import type { Seat as CopiedSeat } from "$lib/domain/types";

  /** Desks copied with Ctrl/⌘-C, kept while the app is open so they paste into any room. */
  let clipboard: CopiedSeat[] = [];
  /** How far the next paste lands from the copied desks, so repeated pastes fan out. */
  let pasteShift = 0;
</script>

<script lang="ts">
  import { Camera } from "$lib/camera.svelte";
  import {
    boundsOf,
    boxesIn,
    copiesOf,
    GRID,
    moveBox,
    moveBoxes,
    newSeat,
    place,
    resizeBox,
    resizeBoxes,
    rotateBox,
    type Rect,
  } from "$lib/domain/room";
  import { SEAT_HEIGHT, SEAT_WIDTH, STAGE_WIDTH, type Id, type Placed, type Seat } from "$lib/domain/types";
  import { History } from "$lib/history.svelte";
  import { boxStyle, placedStyle, stagePoint } from "$lib/stage";
  import Icon from "./Icon.svelte";
  import RoomStage from "./RoomStage.svelte";

  let { seats = $bindable() }: { seats: Seat[] } = $props();

  let stage = $state<HTMLElement>();
  let area = $state<HTMLElement>();
  let trash = $state<HTMLElement>();
  let selection = $state<Id[]>([]);
  /** The one desk selected, which gets its own handles and can be turned. */
  const single = $derived(selection.length === 1 ? selection[0] : null);
  const chosen = $derived(seats.filter((s) => selection.includes(s.id)));
  const group = $derived(selection.length > 1 && chosen.length ? boundsOf(chosen) : null);
  /** The rectangle being dragged across empty floor to select desks. */
  let marquee = $state<Rect | null>(null);
  /** A Desk being dragged out of the bar: where the pointer is, and where it would land. */
  let adding = $state<{ x: number; y: number; at: { x: number; y: number } | null } | null>(null);
  /** While desks are being dragged, the delete zone pops up; `over` when they're above it. */
  let moving = $state(false);
  let overTrash = $state(false);

  const HANDLES = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
  ] as const;

  const find = (id: Id): Placed | undefined => seats.find((s) => s.id === id);

  function write(...next: Placed[]) {
    for (const box of next) {
      const i = seats.findIndex((s) => s.id === box.id);
      if (i !== -1) seats[i] = box;
    }
  }

  // Undo and redo: every change records the desks as they were just before it.

  const history = new History<Seat[]>();
  const checkpoint = () => history.record($state.snapshot(seats));

  function undo() {
    const previous = history.undo($state.snapshot(seats));
    if (previous) (seats = previous), (selection = []);
  }

  function redo() {
    const next = history.redo($state.snapshot(seats));
    if (next) (seats = next), (selection = []);
  }

  // Panning and zooming the floor, Figma style.

  const camera = new Camera();
  let pointers = new Map<number, { x: number; y: number }>();
  let pinch: { distance: number; x: number; y: number } | null = null;
  /** Set once two fingers touch, so whatever the first finger was dragging stops. */
  let pinched = false;
  let spaceHeld = $state(false);

  const areaPoint = (x: number, y: number) => {
    const rect = area!.getBoundingClientRect();
    return { x: x - rect.left, y: y - rect.top };
  };

  function pointerDownCapture(event: PointerEvent) {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinched = true;
      marquee = null;
      event.stopPropagation();
    } else if (spaceHeld) {
      // Holding the space bar, any drag pans.
      event.stopPropagation();
      event.preventDefault();
      let last = { x: event.clientX, y: event.clientY };
      follow((e) => {
        camera.panBy(e.clientX - last.x, e.clientY - last.y);
        last = { x: e.clientX, y: e.clientY };
      });
    }
  }

  function pointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch && pointers.size === 2) {
      // Two fingers zoom by how far apart they are, and pan as they move together.
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      camera.panBy(x - pinch.x, y - pinch.y);
      const at = areaPoint(x, y);
      camera.zoomAt(distance / pinch.distance, at.x, at.y);
      pinch = { distance, x, y };
    }
  }

  function pointerUp(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) pinched = false;
  }

  $effect(() => {
    if (!area) return;
    const el = area;
    // Not passive, so pinching zooms the floor rather than the whole page.
    const wheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      camera.wheel(e, rect.left, rect.top);
    };
    // Safari sends trackpad pinches as gestures instead.
    let lastScale = 1;
    const gestureStart = (e: Event) => {
      e.preventDefault();
      lastScale = 1;
    };
    const gestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as Event & { scale: number; clientX: number; clientY: number };
      const at = areaPoint(g.clientX, g.clientY);
      camera.zoomAt(g.scale / lastScale, at.x, at.y);
      lastScale = g.scale;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("gesturestart", gestureStart);
    el.addEventListener("gesturechange", gestureChange);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("gesturestart", gestureStart);
      el.removeEventListener("gesturechange", gestureChange);
    };
  });

  function zoomBy(factor: number) {
    if (area) camera.zoomAt(factor, area.clientWidth / 2, area.clientHeight / 2);
  }

  /** The dots: one every 20 room units, lined up with the room's corner wherever it's panned. */
  let dots = $state("");
  let areaWidth = $state(0);
  let areaHeight = $state(0);
  $effect(() => {
    void [camera.x, camera.y, camera.zoom, areaWidth, areaHeight];
    if (!stage || !area) return;
    const room = stage.getBoundingClientRect();
    const box = area.getBoundingClientRect();
    const pitch = room.width / 50;
    const x = room.left - box.left - pitch / 2;
    const y = room.top - box.top - pitch / 2;
    dots = `background-size: ${pitch}px ${pitch}px; background-position: ${x}px ${y}px`;
  });

  // Dragging.

  /** Follows the pointer until it lifts. */
  function follow(onMove: (e: PointerEvent) => void, onUp?: (e: PointerEvent) => void) {
    const move = (e: PointerEvent) => onMove(e);
    const up = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onUp?.(e);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /**
   * Runs one drag, reporting each move in room units. A change to the desks records an
   * undo step the moment it first moves, so a plain click records nothing.
   */
  function drag(
    event: PointerEvent,
    onMove: (dx: number, dy: number, point: { x: number; y: number }, e: PointerEvent) => void,
    { records = true, onUp }: { records?: boolean; onUp?: (e: PointerEvent) => void } = {},
  ) {
    if (!stage) return;
    event.preventDefault();
    event.stopPropagation();
    const from = stagePoint(stage, event);
    let started = false;
    follow(
      (e) => {
        if (pinched) return;
        if (!started && records) checkpoint();
        started = true;
        const point = stagePoint(stage!, e);
        onMove(point.x - from.x, point.y - from.y, point, e);
      },
      (e) => onUp?.(e),
    );
  }

  const over = (el: HTMLElement | undefined, e: PointerEvent) => {
    const r = el?.getBoundingClientRect();
    return !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };

  /** Adds desks as one undo step and selects them. */
  function addCopies(copies: Seat[]) {
    if (!copies.length) return;
    checkpoint();
    seats = [...seats, ...copies];
    selection = copies.map((c) => c.id);
  }

  function startMove(event: PointerEvent, id: Id) {
    if (event.shiftKey) {
      event.stopPropagation();
      selection = selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id];
      return;
    }
    if (!selection.includes(id)) selection = [id];
    // Alt/Option-drag: leave the originals and drag away copies, in one undo step.
    const copying = event.altKey;
    if (copying) addCopies(copiesOf($state.snapshot(chosen)));
    const starts = $state.snapshot(chosen);
    drag(
      event,
      (dx, dy, _point, e) => {
        moving = true;
        overTrash = over(trash, e);
        if (starts.length === 1) write(moveBox(starts[0], dx, dy));
        else write(...moveBoxes(starts, dx, dy));
      },
      {
        onUp: (e) => {
          // Dropped on the delete zone: gone. The undo step from the drag brings them back.
          if (moving && over(trash, e)) {
            seats = seats.filter((s) => !selection.includes(s.id));
            selection = [];
          }
          moving = false;
          overTrash = false;
        },
        records: !copying,
      },
    );
  }

  function startGroupResize(event: PointerEvent, sx: number, sy: number) {
    const starts = $state.snapshot(chosen);
    drag(event, (dx, dy) => write(...resizeBoxes(starts, sx, sy, dx, dy)));
  }

  /** Dragging across empty floor draws a rectangle and selects every desk it touches. */
  function startMarquee(event: PointerEvent) {
    if (!stage || event.button !== 0) return;
    const keep = event.shiftKey ? [...selection] : [];
    const from = stagePoint(stage, event);
    let moved = false;
    drag(
      event,
      (_dx, _dy, point) => {
        moved = true;
        marquee = {
          x: Math.min(from.x, point.x),
          y: Math.min(from.y, point.y),
          w: Math.abs(point.x - from.x),
          h: Math.abs(point.y - from.y),
        };
        selection = [...new Set([...keep, ...boxesIn(marquee, seats)])];
      },
      {
        records: false,
        onUp: () => {
          if (!moved) selection = keep;
          marquee = null;
        },
      },
    );
  }

  function startResize(event: PointerEvent, id: Id, sx: number, sy: number) {
    const start = find(id);
    if (start) drag(event, (dx, dy) => write(resizeBox(start, sx, sy, dx, dy)));
  }

  function startRotate(event: PointerEvent, id: Id) {
    const start = find(id);
    if (start) drag(event, (_dx, _dy, point) => write(rotateBox(start, point.x, point.y)));
  }

  function remove() {
    if (!selection.length) return;
    checkpoint();
    seats = seats.filter((s) => !selection.includes(s.id));
    selection = [];
  }

  function keydown(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest("input, textarea, select")) return;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (event.key === " ") {
      event.preventDefault();
      spaceHeld = true;
      return;
    }
    if (mod && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && key === "y") {
      event.preventDefault();
      redo();
      return;
    }
    if (mod && key === "a") {
      event.preventDefault();
      selection = seats.map((s) => s.id);
      return;
    }
    if (mod && (key === "c" || key === "x") && selection.length) {
      event.preventDefault();
      clipboard = $state.snapshot(chosen);
      pasteShift = 0;
      if (key === "x") remove();
      return;
    }
    if (mod && key === "v" && clipboard.length) {
      event.preventDefault();
      pasteShift += 2 * GRID;
      addCopies(copiesOf(clipboard, pasteShift, pasteShift));
      return;
    }
    if (mod && key === "d" && selection.length) {
      event.preventDefault();
      addCopies(copiesOf($state.snapshot(chosen), 2 * GRID, 2 * GRID));
      return;
    }
    if (!selection.length) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      remove();
      return;
    }
    const nudge: Record<string, [number, number]> = {
      ArrowLeft: [-GRID, 0],
      ArrowRight: [GRID, 0],
      ArrowUp: [0, -GRID],
      ArrowDown: [0, GRID],
    };
    const by = nudge[event.key];
    if (by) {
      event.preventDefault();
      checkpoint();
      const starts = $state.snapshot(chosen);
      if (starts.length === 1) write(moveBox(starts[0], by[0], by[1]));
      else write(...moveBoxes(starts, by[0], by[1]));
    }
    if (event.key === "Escape") selection = [];
  }

  /** Drags a new Desk out of the bar; over the room, it snaps to where it would land. */
  function startAdding(event: PointerEvent) {
    event.preventDefault();
    adding = { x: event.clientX, y: event.clientY, at: null };
    follow(
      (e) => {
        if (!adding || !stage) return;
        adding.x = e.clientX;
        adding.y = e.clientY;
        const point = stagePoint(stage, e);
        adding.at = over(stage, e) ? place(point.x - SEAT_WIDTH / 2, point.y - SEAT_HEIGHT / 2) : null;
      },
      (e) => {
        // A plain click on the bar drops it in the middle of the room instead.
        const moved = Math.hypot(e.clientX - event.clientX, e.clientY - event.clientY) > 6;
        const at = adding?.at ?? (moved ? null : place(500 - SEAT_WIDTH / 2, 350 - SEAT_HEIGHT / 2));
        if (at) add(at.x, at.y);
        adding = null;
      },
    );
  }

  function add(x: number, y: number) {
    checkpoint();
    const seat = newSeat(x, y);
    seats = [...seats, seat];
    selection = [seat.id];
  }
</script>

<svelte:window
  onkeydown={keydown}
  onkeyup={(e) => e.key === " " && (spaceHeld = false)}
  onpointermove={pointerMove}
  onpointerup={pointerUp}
  onpointercancel={pointerUp}
/>

{#snippet handles(item: Placed)}
  {#if single === item.id}
    <span class="outline" aria-hidden="true"></span>
    {#each HANDLES as [sx, sy]}
      <span
        class="handle"
        style="left: {(sx + 1) * 50}%; top: {(sy + 1) * 50}%; cursor: {sx === 0 ? 'ns' : sy === 0 ? 'ew' : sx === sy ? 'nwse' : 'nesw'}-resize"
        onpointerdown={(e) => startResize(e, item.id, sx, sy)}
        role="presentation"
      ></span>
    {/each}
    <span class="stem" aria-hidden="true"></span>
    <span class="rotate" onpointerdown={(e) => startRotate(e, item.id)} role="presentation" title="Turn"></span>
  {/if}
{/snippet}

<div class="editor">
  <div
    class="area"
    class:panning={spaceHeld}
    style={dots}
    bind:this={area}
    bind:clientWidth={areaWidth}
    bind:clientHeight={areaHeight}
    onpointerdowncapture={pointerDownCapture}
    onpointerdown={(e) => (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("camera")) && startMarquee(e)}
    role="presentation"
  >
    <div class="camera" style="transform: translate({camera.x}px, {camera.y}px) scale({camera.zoom})">
      <RoomStage bind:element={stage} fill>
        <div class="floor" onpointerdown={startMarquee} role="presentation"></div>
        {#each seats as seat (seat.id)}
          <div
            class="box desk"
            class:selected={selection.includes(seat.id)}
            class:picked={selection.length > 1 && selection.includes(seat.id)}
            style={placedStyle(seat)}
            onpointerdown={(e) => startMove(e, seat.id)}
            role="button"
            tabindex="-1"
            aria-label="Desk: drag to move"
          >
            {@render handles(seat)}
          </div>
        {/each}
        {#if group}
          <div class="box group" style={boxStyle(group.x, group.y, group.w, group.h)}>
            <span class="outline" aria-hidden="true"></span>
            {#each HANDLES as [sx, sy]}
              <span
                class="handle"
                style="left: {(sx + 1) * 50}%; top: {(sy + 1) * 50}%; cursor: {sx === 0 ? 'ns' : sy === 0 ? 'ew' : sx === sy ? 'nwse' : 'nesw'}-resize"
                onpointerdown={(e) => startGroupResize(e, sx, sy)}
                role="presentation"
              ></span>
            {/each}
          </div>
        {/if}
        {#if adding?.at}
          <div class="box landing" style={boxStyle(adding.at.x, adding.at.y, SEAT_WIDTH, SEAT_HEIGHT)}></div>
        {/if}
        {#if marquee}
          <div class="box marquee" style={boxStyle(marquee.x, marquee.y, marquee.w, marquee.h)}></div>
        {/if}
      </RoomStage>
    </div>
  </div>

  <div class="bar" role="toolbar" aria-label="Room tools">
    <button class="tool icon" onclick={undo} disabled={!history.past.length} title="Undo (⌘Z)" aria-label="Undo">
      <Icon name="undo" size={20} />
    </button>
    <button class="tool icon" onclick={redo} disabled={!history.future.length} title="Redo (⌘⇧Z)" aria-label="Redo">
      <Icon name="redo" size={20} />
    </button>
    <span class="divider"></span>
    <button class="tool add" onpointerdown={(e) => startAdding(e)} title="Drag a desk into the room">
      <span class="desk-swatch"></span>Desk
    </button>
    {#if selection.length > 1 && !moving}<span class="picked-count small">{selection.length} selected</span>{/if}
    {#if selection.length || moving}
      <button
        class="trash"
        class:moving
        class:over={overTrash}
        bind:this={trash}
        onclick={remove}
        title="Delete (or drop desks here)"
        aria-label="Delete the selected desks"
      >
        <Icon name="trash" size={20} />
        {#if moving}<span>Drop to delete</span>{/if}
      </button>
    {/if}
  </div>

  <div class="zoom" aria-label="Zoom">
    <button onclick={() => zoomBy(1 / 1.25)} aria-label="Zoom out" title="Zoom out"><Icon name="minus" size={16} /></button>
    <button class="percent" onclick={() => camera.reset()} title="Back to 100%">{Math.round(camera.zoom * 100)}%</button>
    <button onclick={() => zoomBy(1.25)} aria-label="Zoom in" title="Zoom in"><Icon name="plus" size={16} /></button>
  </div>
</div>

{#if adding && !adding.at}
  <div
    class="ghost"
    style="left: {adding.x}px; top: {adding.y}px; --size: {((stage?.getBoundingClientRect().width ?? 800) * SEAT_WIDTH) / STAGE_WIDTH}px"
  ></div>
{/if}

<style>
  /* The floor covers the whole screen, dotted edge to edge; the room sits in the space
     between the header and the bar, which float over it. */
  .editor {
    position: absolute;
    inset: 0;
  }

  .area {
    position: absolute;
    inset: 0;
    padding: 76px 32px 120px;
    container-type: size;
    overflow: hidden;
    touch-action: none;
    background-image: radial-gradient(circle, var(--border-strong) 1px, transparent 1.4px);
  }

  .area.panning,
  .area.panning :global(*) {
    cursor: grab !important;
  }

  .camera {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    transform-origin: 0 0;
  }

  .landing {
    z-index: 4;
    border: 2px dashed var(--accent);
    background: color-mix(in srgb, #f3e2cb 70%, transparent);
    pointer-events: none;
  }

  .floor {
    position: absolute;
    inset: 0;
  }

  .desk {
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .desk {
    border: 1px solid #c9a985;
    border-radius: 2px;
    background: #f3e2cb;
  }

  .selected {
    z-index: 5;
  }

  /* Each desk in a multiple selection is outlined; the handles sit on the box round them all. */
  .picked {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  .group {
    z-index: 6;
    pointer-events: none;
  }

  .group .outline {
    border-style: dashed;
  }

  .group .handle {
    pointer-events: auto;
  }

  .marquee {
    z-index: 7;
    border: 1px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    pointer-events: none;
  }

  .picked-count {
    padding: 0 0.4rem;
    color: var(--muted);
    font-weight: 700;
  }

  /* Exactly on the edges, so lining things up by eye is honest. */
  .outline {
    position: absolute;
    inset: -1px;
    border: 2px solid var(--accent);
    border-radius: inherit;
    pointer-events: none;
  }

  .handle {
    position: absolute;
    width: 12px;
    height: 12px;
    margin: -6px 0 0 -6px;
    border: 2px solid var(--accent);
    border-radius: 3px;
    background: #fff;
    z-index: 2;
  }

  .stem {
    position: absolute;
    left: 50%;
    top: -22px;
    width: 2px;
    height: 22px;
    margin-left: -1px;
    background: var(--accent);
    pointer-events: none;
  }

  .rotate {
    position: absolute;
    left: 50%;
    top: -34px;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    background: #fff;
    cursor: grab;
    z-index: 2;
  }

  /* The bar along the bottom, like FigJam's: undo and redo, desks to drag in, and the
     delete zone that pops up while desks are being dragged. */
  .bar {
    position: absolute;
    left: 50%;
    bottom: 20px;
    translate: -50% 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .tool {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 48px;
    padding: 0.35rem 0.9rem 0.35rem 0.45rem;
    border: 0;
    border-radius: 12px;
    background: none;
    font-weight: 800;
    cursor: grab;
    touch-action: none;
  }

  .tool:hover:not(:disabled) {
    background: var(--surface-sunk);
  }

  .tool.icon {
    padding: 0.35rem 0.6rem;
    color: var(--muted);
    cursor: pointer;
  }

  .tool:disabled {
    color: var(--border-strong);
    cursor: default;
  }

  .trash {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0.35rem 0.75rem;
    border: 0;
    border-radius: 12px;
    background: none;
    color: var(--danger);
    font-weight: 800;
    animation: pop 0.18s ease-out;
    transition:
      background 0.15s,
      padding 0.15s;
  }

  .trash:hover,
  .trash.moving {
    background: var(--danger-wash);
  }

  .trash.moving {
    padding: 0.35rem 1.2rem;
    border: 2px dashed var(--danger);
  }

  .trash.over {
    background: var(--danger);
    color: #fff;
    transform: scale(1.06);
  }

  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }

  .zoom {
    position: absolute;
    right: 20px;
    bottom: 20px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .zoom button {
    display: grid;
    place-items: center;
    min-width: 34px;
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--muted);
    font-weight: 700;
    font-size: 0.8rem;
  }

  .zoom button:hover {
    background: var(--surface-sunk);
  }

  .zoom .percent {
    min-width: 52px;
  }

  /* A desk bigger than the bar, a third of it peeking up over the top, ready to pull out. */
  .desk-swatch {
    width: 60px;
    height: 60px;
    margin-top: -42px;
    border: 1px solid #c9a985;
    border-radius: 2px;
    background: #f3e2cb;
    box-shadow: 0 6px 14px -8px rgb(90 58 32 / 0.45);
    transition: transform 0.15s;
  }

  .tool:hover .desk-swatch {
    transform: translateY(-4px);
  }

  .divider {
    width: 1px;
    height: 28px;
    margin: 0 0.35rem;
    background: var(--border);
  }


  .ghost {
    position: fixed;
    z-index: 50;
    /* The same size as a desk in the room, so it's clear what lands where. */
    width: var(--size);
    height: var(--size);
    translate: -50% -50%;
    pointer-events: none;
    opacity: 0.85;
    border: 1px solid #c9a985;
    background: #f3e2cb;
  }

</style>
