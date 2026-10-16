<!-- Setup, Room View: pick a starting shape for the room, sized for the class. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SetupFrame from "$lib/components/SetupFrame.svelte";
  import ShapePicker from "$lib/components/ShapePicker.svelte";
  import type { StartingShape } from "$lib/domain/room";
  import { createRoom } from "$lib/rooms";
  import { firstClass, setupExit, setupSteps } from "$lib/setup";
  import { store } from "$lib/store.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const first = $derived(firstClass(store.data.classes, cls.id));
  const seats = $derived(cls.students.filter((s) => !s.former).length);

  function pick(shape: StartingShape) {
    // Coming back to pick again replaces the room this setup made, if nobody else uses it.
    const previous = cls.lastShown.roomLayoutId;
    if (previous && store.classesSeatedIn(previous).every((c) => c.id === cls.id)) {
      store.deleteRoomLayout(previous);
    }
    createRoom(shape, cls.id);
    goto(`/setup/${cls.id}/room`);
  }
</script>

<SetupFrame
  steps={setupSteps("room")}
  current={2}
  title="Which looks most like your room?"
  back="/setup/{cls.id}/view"
  exit={setupExit(store.data.classes, cls.id)}
  onboarding={first}
>
  <p class="intro">Pick the closest. Next you'll move the desks to match.</p>
  <ShapePicker {seats} onpick={pick} />
  {#snippet actions()}{/snippet}
</SetupFrame>
