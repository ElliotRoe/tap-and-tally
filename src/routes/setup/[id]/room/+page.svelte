<!-- Setup, Room View: draw the room, full screen. It's called "My Classroom" until renamed. ✕ goes back to the shapes. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import RoomEditorScreen from "$lib/components/RoomEditorScreen.svelte";
  import type { RoomLayout } from "$lib/domain/types";
  import { store } from "$lib/store.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const saved = store.findRoomLayout(store.findClass(page.params.id!)!.lastShown.roomLayoutId);
  let draft = $state<RoomLayout | null>(saved ? $state.snapshot(saved) : null);

  $effect(() => {
    if (!draft) goto(`/setup/${cls.id}/shape`, { replaceState: true });
  });

  function next() {
    if (!draft) return;
    store.updateRoomLayout(draft.id, $state.snapshot(draft));
    goto(`/setup/${cls.id}/seats`);
  }
</script>

{#if draft}
  <RoomEditorScreen bind:name={draft.name} bind:seats={draft.seats} close="/setup/{cls.id}/shape" onsave={next} />
{/if}
