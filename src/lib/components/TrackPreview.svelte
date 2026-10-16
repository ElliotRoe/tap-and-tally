<!--
  The drawing beside "What do you want to track?": the class as the teacher chose to see
  it (a few grid tiles, or a pod of desks up close), one student being tapped, and the
  box that opens, listing exactly the Behaviors being edited. It redraws as they edit,
  in the same card-on-a-hill style as the other setup drawings.
-->
<script lang="ts">
  import { initials, shortName } from "$lib/domain/students";
  import type { Behavior, Student } from "$lib/domain/types";
  import hillRoman from "$lib/art/svg/hill-roman.svg?raw";
  import hill from "$lib/art/svg/hill.svg?raw";
  import { theme } from "$lib/theme.svelte";
  import Icon from "./Icon.svelte";

  let {
    className,
    students,
    view,
    behaviors,
  }: {
    className: string;
    students: Student[];
    view: "grid" | "room";
    behaviors: Behavior[];
  } = $props();

  /** A few of the class's own students; the first is being tapped, clear of the box. */
  const shown = $derived(students.slice(0, view === "room" ? 4 : 6));
  const tapped = $derived(shown[0]);
  const named = $derived(behaviors.filter((b) => b.name.trim()));

  // An arrow from the tapped student to the box, measured from where both actually sit.
  let preview = $state<HTMLElement>();
  let tappedEl = $state<HTMLElement>();
  let boxEl = $state<HTMLElement>();
  let arrow = $state("");
  $effect(() => {
    if (!preview) return;
    void [named.length, view, tapped];
    const draw = () => {
      if (!preview || !tappedEl || !boxEl) return;
      const origin = preview.getBoundingClientRect();
      const from = tappedEl.getBoundingClientRect();
      const to = boxEl.getBoundingClientRect();
      const x1 = from.left + from.width * 0.5 - origin.left;
      const y1 = from.bottom - from.height * 0.2 - origin.top;
      const x2 = to.left - 6 - origin.left;
      const y2 = to.top + 26 - origin.top;
      arrow = `M${x1} ${y1}C${x1} ${y2} ${x1 + (x2 - x1) * 0.4} ${y2} ${x2} ${y2}`;
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(preview);
    return () => observer.disconnect();
  });
</script>

<div
  class="preview"
  bind:this={preview}
  role="img"
  aria-label="Tapping {tapped ? shortName(tapped) : 'a student'} opens a box with {named.map((b) => b.name).join(', ') || 'nothing yet'}"
>
  <div class="hill" aria-hidden="true">{@html theme.current === "roman" ? hillRoman : hill}</div>

  <div class="card" aria-hidden="true">
    <p class="eyebrow">{className || "Your class"}</p>
    <div class={view === "room" ? "pod" : "tiles"}>
      {#each shown as student (student.id)}
        {#if student.id === tapped?.id}
          <span class="tile tapped" bind:this={tappedEl}>{initials(student)}</span>
        {:else}
          <span class="tile">{initials(student)}</span>
        {/if}
      {/each}
    </div>
  </div>

  <svg class="arrow" aria-hidden="true">
    <defs>
      <marker id="track-arrow-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M1 1 9 5 1 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </marker>
    </defs>
    {#if arrow}<path d={arrow} marker-end="url(#track-arrow-head)" />{/if}
  </svg>

  <div class="box" aria-hidden="true" bind:this={boxEl}>
    <p class="who">{tapped ? shortName(tapped) : "A student"}</p>
    {#each named as behavior (behavior.id)}
      <div class="row" style="background: {behavior.color}">
        <span class="emoji">{behavior.emoji}</span>
        <span class="name">{behavior.name}</span>
        <Icon name={behavior.mode === "toggle" ? "toggle" : "count"} size={13} />
      </div>
    {:else}
      <p class="empty">Add something to track</p>
    {/each}
  </div>
</div>

<style>
  /* Laid out on the same 600 × 480 canvas as the other setup drawings. */
  .preview {
    position: relative;
    aspect-ratio: 600 / 480;
    container-type: inline-size;
  }

  /* Sized by the drawing's own width (cqw), so it scales like an illustration. */
  .card,
  .box {
    font-size: 2.6cqw;
  }

  .hill {
    position: absolute;
    left: 56.3%;
    top: 1.7%;
    width: 48.3%;
  }

  .hill :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }

  .card {
    position: absolute;
    left: 4%;
    top: 12%;
    width: 58%;
    padding: 4cqw;
    border: 1px solid var(--border);
    border-radius: 3cqw;
    background: var(--surface);
    box-shadow: 0 10px 24px -12px rgb(90 58 32 / 0.25);
  }

  .eyebrow {
    margin: 0 0 3cqw;
    font-size: 0.75em;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2cqw;
  }

  /* Desks pushed together in a four, seen up close. */
  .pod {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    width: 72%;
    margin: 0 auto;
  }

  .tile {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px solid #d9bfa0;
    border-radius: 2cqw;
    background: var(--surface);
    font-size: 1.2em;
    font-weight: 800;
  }

  .pod .tile {
    border-radius: 0;
    border: 0;
    outline: 1px solid #c9a985;
    outline-offset: -0.5px;
    background: #f3e2cb;
  }

  .tapped {
    background: var(--accent-wash);
    color: var(--accent);
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  .pod .tapped {
    background: var(--accent-wash);
  }

  /* Above the card, under the box: from the tapped student to what opens. */
  .arrow {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    color: var(--accent);
  }

  .arrow path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 2 6;
  }

  .arrow marker path {
    stroke-dasharray: none;
  }

  /* The box that opens, overlapping the card like it does in class. */
  .box {
    position: absolute;
    left: 38%;
    top: 44%;
    width: 54%;
    display: grid;
    gap: 1.4cqw;
    padding: 3cqw;
    border: 1px solid var(--border);
    border-radius: 3cqw;
    background: var(--surface);
    z-index: 2;
    box-shadow: 0 24px 40px -18px rgb(59 36 22 / 0.4);
  }

  .who {
    margin: 0 0 0.6cqw;
    font-weight: 800;
    font-size: 1.05em;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 1.6cqw;
    padding: 1.6cqw 2.2cqw;
    border-radius: 1.6cqw;
    font-weight: 800;
    font-size: 0.92em;
    color: var(--text);
    animation: slide 0.2s ease-out;
  }

  .row :global(svg) {
    color: rgb(46 34 25 / 0.5);
  }

  .emoji {
    font-size: 1.2em;
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    margin: 0;
    color: var(--faint);
    font-weight: 700;
  }

  @keyframes slide {
    from {
      opacity: 0;
      translate: 0 -4px;
    }
  }
</style>
