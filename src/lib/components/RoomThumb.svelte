<!-- A small drawing of a Room Layout: its desks, turned as they really are, cropped to them. -->
<script lang="ts">
  import { cropOf } from "$lib/domain/room";
  import type { RoomLayout } from "$lib/domain/types";

  let { layout, label = "" }: { layout: Pick<RoomLayout, "seats">; label?: string } = $props();
  const turn = (item: { x: number; y: number; w: number; h: number; rotation: number }) =>
    item.rotation ? `rotate(${item.rotation} ${item.x + item.w / 2} ${item.y + item.h / 2})` : undefined;
  const view = $derived(cropOf(layout.seats, 40));
</script>

<!-- Every card keeps the room's shape; the desks sit centred in it, as large as fit. -->
<svg
  class="thumb"
  viewBox="{view.x} {view.y} {view.w} {view.h}"
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label={label || "A room layout"}
>
  {#each layout.seats as s (s.id)}
    <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#f3e2cb" stroke="#c9a985" stroke-width="3" transform={turn(s)} />
  {/each}
</svg>

<style>
  .thumb {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 10 / 7;
    background: #fffdf9;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
</style>
