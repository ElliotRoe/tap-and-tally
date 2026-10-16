<!-- Setup, Room View: who sits where, full screen. Starts seated A–Z, front row first. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SeatAssigner from "$lib/components/SeatAssigner.svelte";
  import SetupFrame from "$lib/components/SetupFrame.svelte";
  import { drawsRoom, firstClass, setupExit, setupSteps } from "$lib/setup";
  import { store } from "$lib/store.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const layoutId = store.findClass(page.params.id!)!.lastShown.roomLayoutId;
  const layout = $derived(store.findRoomLayout(layoutId));
  const students = $derived(cls.students.filter((s) => !s.former));
  const drawn = $derived(drawsRoom(store.data.classes, cls));
  const first = $derived(firstClass(store.data.classes, cls.id));
  const steps = $derived(setupSteps("room", drawn, first));
  let seating = $state(layoutId ? { ...store.seatingFor(page.params.id!, layoutId) } : {});

  function next() {
    if (layout) store.setSeating(cls.id, layout.id, $state.snapshot(seating));
    goto(first ? `/setup/${cls.id}/menu` : `/class/${cls.id}`);
  }
</script>

<SetupFrame
  {steps}
  current={steps.indexOf("Seats")}
  title="Who sits where?"
  wide
  back="/setup/{cls.id}/{drawn ? 'room' : 'view'}"
  exit={setupExit(store.data.classes, cls.id)}
  onboarding={first}
>
  {#if layout}
    <SeatAssigner {layout} {students} bind:seating reserve={260} />
  {:else}
    <p>Draw your room first. <a href="/setup/{cls.id}/shape">Pick a shape</a></p>
  {/if}
  {#snippet actions()}
    <button class="btn btn-primary" onclick={next} disabled={!layout}>{first ? "Next" : "Done"}</button>
  {/snippet}
</SetupFrame>
