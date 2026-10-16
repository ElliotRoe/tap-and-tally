<!--
  Drawing a room, full screen like FigJam: the dotted floor runs edge to edge, ✕ top left
  goes back, the room's name sits in the middle (click it to rename), and Save layout is
  top right. Used by setup and by Room Layouts.
-->
<script lang="ts">
  import type { Seat } from "$lib/domain/types";
  import EditableTitle from "./EditableTitle.svelte";
  import Icon from "./Icon.svelte";
  import RoomEditor from "./RoomEditor.svelte";

  let {
    name = $bindable(),
    seats = $bindable(),
    close,
    onsave,
  }: {
    name: string;
    seats: Seat[];
    /** Where ✕ goes, without saving. */
    close: string;
    onsave: () => void;
  } = $props();
</script>

<div class="screen">
  <header class="top">
    <a class="square" href={close} aria-label="Close without saving" title="Close without saving">
      <Icon name="close" size={22} />
    </a>
    <div class="name">
      <EditableTitle value={name} onchange={(next) => (name = next)} level={2} label="Room name" />
    </div>
    <button class="btn btn-primary save" onclick={onsave}>Save layout</button>
  </header>

  <main class="body">
    <RoomEditor bind:seats />
  </main>
</div>

<style>
  .screen {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--bg);
  }

  /* Floats over the dotted floor; only its buttons catch the pointer. */
  .top {
    position: absolute;
    inset: 0 0 auto;
    z-index: 30;
    pointer-events: none;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.25rem 0.25rem;
  }

  .top > * {
    pointer-events: auto;
  }

  .square {
    justify-self: start;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    background: var(--surface);
    color: var(--muted);
  }

  .square:hover {
    background: var(--surface-sunk);
    color: var(--text);
  }

  .name {
    text-align: center;
  }

  .save {
    justify-self: end;
  }

  .body {
    position: absolute;
    inset: 0;
  }
</style>
