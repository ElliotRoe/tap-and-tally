<!-- Arranging who sits where for a Class in one Room Layout, full screen. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SeatAssigner from "$lib/components/SeatAssigner.svelte";
  import { store } from "$lib/store.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const layout = $derived(store.findRoomLayout(page.params.layout!));
  const students = $derived(cls.students.filter((s) => !s.former));
  let seating = $state({ ...store.seatingFor(page.params.id!, page.params.layout!) });

  function done() {
    if (layout) store.setSeating(cls.id, layout.id, $state.snapshot(seating));
    goto(`/live/${cls.id}`);
  }
</script>

<svelte:head><title>Seats · {cls.name} · Tap &amp; Tally</title></svelte:head>

<div class="full">
  <header class="row">
    <div>
      <p class="eyebrow">{layout?.name ?? "Room"}</p>
      <h1>Who sits where in {cls.name}?</h1>
    </div>
    <span class="spacer"></span>
    <a class="btn btn-quiet" href="/live/{cls.id}">Cancel</a>
    <button class="btn btn-primary" onclick={done}>Save seats</button>
  </header>
  {#if layout}
    <SeatAssigner {layout} {students} bind:seating reserve={150} />
  {:else}
    <p>That room doesn't exist any more. <a href="/live/{cls.id}">Back to class</a></p>
  {/if}
</div>

<style>
  .full {
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 1rem;
    padding: 1rem 1.5rem;
    overflow: hidden;
  }

  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  .eyebrow {
    margin-bottom: 0.2rem;
  }
</style>
