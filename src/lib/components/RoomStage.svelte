<!--
  The room drawn to scale: a floor that keeps its shape at any screen size, with no card
  around it. `fill` makes it as large as the space it sits in allows (that space must be
  a size container). `crop` shows just one window of the room, such as the desks and a
  little floor round them, as large as it fits. The room editor draws the grid dots.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Rect } from "$lib/domain/room";
  import { STAGE_HEIGHT, STAGE_WIDTH } from "$lib/domain/types";

  let {
    element = $bindable(),
    /** Screen height kept free around the stage, so it fits without scrolling. */
    reserve = 220,
    fill = false,
    crop,
    children,
    ...rest
  }: {
    /** The whole room, even when cropped: positions on it are in room units. */
    element?: HTMLElement;
    reserve?: number;
    fill?: boolean;
    crop?: Rect;
    children: Snippet;
    [key: string]: unknown;
  } = $props();

  const view = $derived(crop ?? { x: 0, y: 0, w: STAGE_WIDTH, h: STAGE_HEIGHT });
  /** The whole room, scaled and shifted so the window fills the stage. */
  const room = $derived(
    `width: ${(STAGE_WIDTH / view.w) * 100}%; height: ${(STAGE_HEIGHT / view.h) * 100}%;` +
      `left: ${(-view.x / view.w) * 100}%; top: ${(-view.y / view.h) * 100}%`,
  );
</script>

<div class="stage" class:fill style="--reserve: {reserve}px; --ratio: {view.w / view.h}" {...rest}>
  <div class="room" style={room} bind:this={element}>
    {@render children()}
  </div>
</div>

<style>
  .stage {
    position: relative;
    width: min(100%, calc((100dvh - var(--reserve)) * var(--ratio)));
    aspect-ratio: var(--ratio);
    margin: 0 auto;
    touch-action: none;
  }

  .fill {
    width: min(100cqw, 100cqh * var(--ratio));
  }

  .room {
    position: absolute;
  }

  .room :global(.box) {
    position: absolute;
    transform-origin: center;
  }
</style>
