<!-- A drawing of the app's own screens, the way Happy Hallways illustrates its steps. -->
<script lang="ts">
  import { theme } from "$lib/theme.svelte";
  import heroRoman from "./svg/hero-roman.svg?raw";
  import hero from "./svg/hero.svg?raw";
  import menuRoman from "./svg/menu-roman.svg?raw";
  import menu from "./svg/menu.svg?raw";
  import rosterRoman from "./svg/roster-roman.svg?raw";
  import roster from "./svg/roster.svg?raw";

  type Kind = "hero" | "roster" | "menu";
  let { kind }: { kind: Kind } = $props();

  const ROMAN: Record<Kind, string> = { hero: heroRoman, roster: rosterRoman, menu: menuRoman };

  const ART: Record<Kind, { svg: string; label: string }> = {
    hero: { svg: hero, label: "A class shown as tiles of initials, with a lasso round one student who has three taps today" },
    roster: { svg: roster, label: "A new class card with five student names pasted in" },
    menu: { svg: menu, label: "The box that opens when a student is tapped, with three things to track" },
  };
</script>

<div class="art" role="img" aria-label={ART[kind].label}>{@html theme.current === "roman" ? ROMAN[kind] : ART[kind].svg}</div>

<style>
  .art :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
