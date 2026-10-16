<!--
  Rolling desert hills along the bottom of the screen, full width, with the sun, the
  mesas and the big saguaro tucked into the bottom-right corner so they never sit under
  the page's content. Narrow screens lose the left of the hills, never the corner.
-->
<script lang="ts">
  import { theme } from "$lib/theme.svelte";
  import desert from "./svg/desert.svg?raw";
  import roman from "./svg/roman.svg?raw";

  // While the desert is on screen, the page's overscroll shows sand rather than white.
  $effect(() => {
    document.documentElement.classList.add("sand-foot");
    return () => document.documentElement.classList.remove("sand-foot");
  });
</script>

<div class="scene" aria-hidden="true">{@html theme.current === "roman" ? roman : desert}</div>

<style>
  /* Always the drawing's own shape, so nothing at the top is ever cropped.
     Narrow screens hit the minimum height and lose the left of the hills instead. */
  .scene {
    width: 100%;
    aspect-ratio: 1600 / 214;
    min-height: 90px;
    pointer-events: none;
  }

  .scene :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
