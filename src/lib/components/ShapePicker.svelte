<!-- The four starting shapes for a new room, each drawn small at the class's size. -->
<script lang="ts">
  import { STARTING_SHAPES, startingRoom, type StartingShape } from "$lib/domain/room";
  import RoomThumb from "./RoomThumb.svelte";

  let { seats, onpick }: { seats: number; onpick: (shape: StartingShape) => void } = $props();
  const previews = $derived(STARTING_SHAPES.map((shape) => ({ ...shape, room: startingRoom(seats, shape.value) })));
</script>

<div class="shapes">
  {#each previews as shape (shape.value)}
    <button type="button" class="shape" onclick={() => onpick(shape.value)}>
      <RoomThumb layout={shape.room} label="{shape.label}: {shape.hint}" />
      <strong>{shape.label}</strong>
      <span class="muted small">{shape.hint}</span>
    </button>
  {/each}
</div>

<style>
  .shapes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .shape {
    display: grid;
    gap: 0.35rem;
    padding: 0.75rem 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: var(--shadow);
    text-align: left;
    transition: border-color 0.12s, box-shadow 0.12s;
  }

  .shape:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash), var(--shadow);
  }

  .shape strong {
    margin-top: 0.4rem;
    font-size: 1.05rem;
  }
</style>
