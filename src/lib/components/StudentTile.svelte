<!--
  A student as a tile: big initials, a short name, and today's total. While a hold is
  under way the tile fills from the left (driven by the --hold variable from the hold
  action); `flash` shows a moment of confirmation, and absent students get an X.
-->
<script lang="ts">
  import { initials, shortName } from "$lib/domain/students";
  import type { Student } from "$lib/domain/types";

  let {
    student,
    total,
    absent = false,
    compact = false,
    flash = "",
  }: {
    student: Student;
    total?: number;
    absent?: boolean;
    compact?: boolean;
    flash?: string;
  } = $props();
</script>

<span class="tile" class:faded={total === 0} class:absent class:compact>
  <span class="fill" aria-hidden="true"></span>
  {#if absent}<span class="cross" aria-hidden="true"></span>{/if}
  <span class="letters">{initials(student)}</span>
  <span class="name">{absent ? "Absent" : shortName(student)}</span>
  {#if total !== undefined && total > 0 && !absent}
    <span class="total" aria-label="{total} today">{total}</span>
  {/if}
  {#if flash}<span class="flash" role="status">{flash}</span>{/if}
</span>

<style>
  .tile {
    position: relative;
    overflow: visible;
    display: grid;
    place-content: center;
    gap: 0.15rem;
    width: 100%;
    height: 100%;
    min-height: 110px;
    padding: 0.4rem;
    border: 1px solid #d9bfa0;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 6px 16px -10px rgb(90 58 32 / 0.35);
    text-align: center;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: transform 0.08s;
  }

  /* On a desk: square, like the furniture. The edge is drawn centred on the desk's edge,
     so two desks pushed together share one line instead of showing two. */
  .compact {
    min-height: 0;
    border: 0;
    border-radius: 0;
    outline: 1px solid #d9bfa0;
    outline-offset: -0.5px;
    box-shadow: none;
  }

  .compact.absent {
    outline: 1px dashed var(--border-strong);
  }

  .letters {
    font-size: 1.9rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.01em;
  }

  .compact .letters {
    font-size: clamp(0.85rem, 1.6vw, 1.2rem);
  }

  .name {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* A desk is too small for a name; the initials carry it. */
  .compact .name {
    display: none;
  }

  /* Nobody has tapped them yet today. */
  .faded {
    border-color: var(--border);
    box-shadow: none;
  }

  .faded .letters {
    color: #a8957f;
  }

  .absent {
    background: var(--surface-sunk);
    border-style: dashed;
    border-color: var(--border-strong);
    box-shadow: none;
  }

  .absent .letters,
  .absent .name {
    color: #b3a28e;
  }

  .total {
    position: absolute;
    top: -9px;
    right: -9px;
    min-width: 26px;
    height: 26px;
    padding: 0 0.4rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--accent);
    color: #fffaf2;
    font-weight: 800;
    font-size: 0.8rem;
    border: 2.5px solid var(--surface);
  }

  /* The hold: a soft wash sweeping in from the left, with a shadowed leading edge. */
  .fill {
    position: absolute;
    inset: 0;
    width: calc(var(--hold, 0) * 100%);
    border-radius: inherit;
    background: rgb(180 83 42 / 0.16);
    box-shadow: inset -10px 0 12px -10px rgb(122 52 24 / 0.45);
    pointer-events: none;
  }

  /* Absent: a circle with a slash through it, like a "no entry" sign. */
  .cross {
    position: absolute;
    left: 50%;
    top: 50%;
    height: 72%;
    aspect-ratio: 1;
    translate: -50% -50%;
    pointer-events: none;
    border: 3px solid rgb(163 50 31 / 0.5);
    border-radius: 50%;
    background: linear-gradient(
      45deg,
      transparent calc(50% - 1.5px),
      rgb(163 50 31 / 0.5) calc(50% - 1.5px),
      rgb(163 50 31 / 0.5) calc(50% + 1.5px),
      transparent calc(50% + 1.5px)
    );
  }

  .letters,
  .name {
    position: relative;
  }

  .flash {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    padding: 0.25rem;
    border-radius: inherit;
    background: var(--accent);
    color: #fffaf2;
    font-weight: 800;
    font-size: 0.85rem;
    text-align: center;
    animation: flash 1.2s ease forwards;
  }

  @keyframes flash {
    0%,
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
