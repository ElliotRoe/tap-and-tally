<!--
  Editing one Room Layout, full screen. Changes apply wherever the room is used, so Save
  layout warns first if any deleted desk had a student in it.
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import RoomEditorScreen from "$lib/components/RoomEditorScreen.svelte";
  import type { RoomLayout } from "$lib/domain/types";
  import { store } from "$lib/store.svelte";

  const original = store.findRoomLayout(page.params.id!);
  const back = page.url.searchParams.get("back") ?? "/layouts";
  let draft = $state<RoomLayout | null>(original ? $state.snapshot(original) : null);
  let warning = $state(false);

  const unseating = $derived.by(() => {
    if (!draft) return 0;
    const kept = new Set(draft.seats.map((s) => s.id));
    return store
      .classesSeatedIn(draft.id)
      .reduce((n, cls) => n + Object.keys(cls.seatings[draft!.id]).filter((seat) => !kept.has(seat)).length, 0);
  });

  function save() {
    if (unseating > 0) warning = true;
    else commit();
  }

  function commit() {
    if (!draft) return;
    store.updateRoomLayout(draft.id, $state.snapshot(draft));
    goto(back);
  }
</script>

<svelte:head><title>{draft?.name ?? "Room"} · Tap &amp; Tally</title></svelte:head>

{#if draft}
  <RoomEditorScreen bind:name={draft.name} bind:seats={draft.seats} close={back} onsave={save} />
{:else}
  <p class="page">That room doesn't exist. <a href="/layouts">Back to Room Layouts</a></p>
{/if}

<ConfirmDialog
  bind:open={warning}
  title="{unseating} {unseating === 1 ? 'student loses' : 'students lose'} their desk"
  message="You deleted desks that had students in them. They'll wait in the list until you seat them again."
  confirm="Save anyway"
  onconfirm={commit}
/>
