<!--
  The logo: a lasso, or a laurel wreath in the Roman theme. static/icon.svg and
  static/icon-roman.svg are the same drawings on a tile, for the browser tab.
-->
<script lang="ts">
  import { theme } from "$lib/theme.svelte";
  import laurel from "./svg/laurel.svg?raw";
  import lasso from "./svg/lasso.svg?raw";

  let { size = 32 }: { size?: number } = $props();
</script>

<span class="mark" style="width: {size}px; height: {size}px" aria-hidden="true">{@html theme.current === "roman" ? laurel : lasso}</span>

<style>
  .mark {
    display: inline-block;
    flex: none;
  }

  .mark :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
