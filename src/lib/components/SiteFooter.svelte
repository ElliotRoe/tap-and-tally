<!--
  The desert along the bottom of the page, with the teacher.dev credit sitting on the sand.
  Hidden in the bottom-right corner: a Roman vase. Clicking it turns the whole site Roman,
  where a cowboy hat sits in the same spot to switch back.
-->
<script lang="ts">
  import DesertScene from "$lib/art/DesertScene.svelte";
  import amphora from "$lib/art/svg/egg-amphora.svg?raw";
  import hat from "$lib/art/svg/egg-hat.svg?raw";
  import { theme } from "$lib/theme.svelte";

  const roman = $derived(theme.current === "roman");
</script>

<footer class="site-footer">
  <a class="credit" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
    <img src="/edtechathon-logo.svg" alt="" width="22" height="22" />
    Built by teacher.dev
  </a>
  <button
    class="egg"
    aria-label={roman ? "Back to the Wild West" : "Go to ancient Rome"}
    onclick={() => theme.toggle()}
  >
    {@html roman ? hat : amphora}
  </button>
  <DesertScene />
</footer>

<style>
  /* The scene is drawn 1600 units wide and 214 tall, anchored bottom right; --unit is
     one of those units on screen, so the egg stays on the same spot of ground. */
  .site-footer {
    position: relative;
    container-type: inline-size;
    --unit: max(100cqw / 1600, 90px / 214);
  }

  .credit {
    position: absolute;
    left: 50%;
    bottom: 12px;
    z-index: 1;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 800;
    /* Dark enough to read on the sand. */
    color: var(--foot-ink);
    text-decoration: none;
    white-space: nowrap;
  }

  .credit:hover {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .egg {
    position: absolute;
    right: calc(32 * var(--unit));
    bottom: calc(4 * var(--unit));
    z-index: 1;
    width: calc(56 * var(--unit));
    height: calc(56 * var(--unit));
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  .egg :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .egg:hover :global(.egg-body),
  .egg:focus-visible :global(.egg-body) {
    animation: wobble 0.7s ease-in-out;
  }

  .egg:active :global(.egg-body) {
    transform: scale(0.9);
  }

  .egg:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
    border-radius: 8px;
  }

  /* Rocks on its base, like something that wants to be picked up. */
  @keyframes wobble {
    0%,
    100% {
      transform: rotate(0);
    }
    20% {
      transform: rotate(-9deg) translateY(-2px);
    }
    45% {
      transform: rotate(7deg) translateY(-3px);
    }
    70% {
      transform: rotate(-4deg);
    }
    85% {
      transform: rotate(2deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .egg:hover :global(.egg-body),
    .egg:focus-visible :global(.egg-body) {
      animation: none;
    }
  }
</style>
