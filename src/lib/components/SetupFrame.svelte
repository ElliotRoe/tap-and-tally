<!--
  The frame around every setup step, laid out like Happy Hallways' tour: the step and
  title on the left, a drawing of the app on the right, progress dashes under the
  buttons, and the desert along the bottom. `wide` gives the step the whole screen,
  for drawing the room and seating students. `onboarding` is the teacher's very first
  class, set up on its own like this; every later class is set up inside the app,
  beside the sidebar. Each page decides that once, so the frame never switches midway.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import LassoMark from "$lib/art/LassoMark.svelte";
  import StepArt from "$lib/art/StepArt.svelte";
  import Sidebar from "./Sidebar.svelte";
  import SiteFooter from "./SiteFooter.svelte";

  let {
    steps,
    current,
    title,
    art,
    wide = false,
    back,
    exit,
    onboarding,
    actions,
    aside,
    children,
  }: {
    steps: string[];
    current: number;
    title: string;
    art?: "roster" | "menu";
    wide?: boolean;
    back?: string;
    /** Where "Cancel" goes, offered when this isn't the very first class. */
    exit?: string;
    /** The teacher's very first class: no sidebar, the desert along the bottom. */
    onboarding: boolean;
    actions: Snippet;
    /** Something live for the right-hand side, in place of a fixed drawing. */
    aside?: Snippet;
    children: Snippet;
  } = $props();

  const inApp = $derived(!onboarding);
</script>

<div class="shell" class:inApp>
{#if inApp}<Sidebar />{/if}
<div class="frame" class:wide>
  <header class="top">
    {#if !inApp}<span class="brand wordmark"><LassoMark size={30} /> Tap &amp; Tally</span>{/if}
    <span class="spacer"></span>
    {#if exit}<a class="btn btn-quiet btn-small" href={exit}>Cancel</a>{/if}
    {#if wide}
      <span class="head-actions">
        {#if back}<a class="btn btn-quiet" href={back}>← Back</a>{/if}
        {@render actions()}
      </span>
    {/if}
  </header>

  <main class="body" class:solo={!art && !aside && !wide}>
    <div class="content">
      <p class="eyebrow">Step {current + 1} · {steps[current]}</p>
      <h1>{title}</h1>
      {@render children()}
      {#if !wide}
        <div class="row actions">
          {#if back}<a class="btn btn-quiet" href={back}>← Back</a>{/if}
          <span class="spacer"></span>
          {@render actions()}
        </div>
      {/if}
      <ol class="dashes" aria-label="Setup progress">
        {#each steps as step, i}
          <li class:done={i <= current} aria-current={i === current ? "step" : undefined}>
            <span class="sr-only">{step}</span>
          </li>
        {/each}
      </ol>
    </div>
    {#if (art || aside) && !wide}
      <div class="art">
        {#if aside}{@render aside()}{:else if art}<StepArt kind={art} />{/if}
      </div>
    {/if}
  </main>

  {#if !wide}<SiteFooter />{/if}
</div>
</div>

<style>
  .inApp {
    display: flex;
  }

  .inApp .frame {
    flex: 1;
    min-width: 0;
  }

  /* Exactly one screen tall: setup never scrolls the page. */
  .frame {
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }

  .top {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding: 1.1rem 1.5rem;
  }

  .wide .top {
    max-width: none;
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 0.75rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 1.15rem;
  }

  .body {
    min-height: 0;
    overflow-y: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
    gap: 4rem;
    align-items: center;
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding: 0.5rem 1.5rem 1rem;
  }

  /* A step without a drawing centres itself rather than leaving the right side empty. */
  .body.solo {
    grid-template-columns: minmax(0, 720px);
    justify-content: center;
  }

  .solo .content {
    max-width: none;
  }

  .wide .body {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    max-width: none;
    padding-top: 0;
  }

  .content {
    display: grid;
    gap: 0.85rem;
    max-width: 560px;
  }

  .wide .content {
    max-width: none;
  }

  .wide h1 {
    font-size: 1.8rem;
  }

  .content :global(.intro) {
    margin: -0.25rem 0 0.25rem;
    font-size: 1.05rem;
    color: var(--muted);
  }

  .actions {
    margin-top: 0.5rem;
  }

  .dashes {
    display: flex;
    gap: 6px;
    margin: 0.25rem 0 0;
    padding: 0;
    list-style: none;
  }

  .wide .dashes {
    display: none;
  }

  .dashes li {
    width: 28px;
    height: 5px;
    border-radius: 999px;
    background: var(--border);
  }

  .dashes li.done {
    background: var(--accent);
  }


  h1 {
    font-size: clamp(1.7rem, 3vw, 2.3rem);
  }

  @media (max-height: 820px) {
    .top {
      padding-top: 0.6rem;
      padding-bottom: 0.4rem;
    }

    h1 {
      font-size: 1.7rem;
    }

    .content {
      gap: 0.65rem;
    }

    .dashes {
      display: none;
    }
  }

  @media (max-width: 860px) {
    .body {
      grid-template-columns: minmax(0, 1fr);
      gap: 1rem;
    }

    .art {
      display: none;
    }
  }
</style>
