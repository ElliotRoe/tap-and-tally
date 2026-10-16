<!-- Setup step 2: start in a Grid View or a Room View. Either can be switched during class. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SetupFrame from "$lib/components/SetupFrame.svelte";
  import ViewChoice from "$lib/components/ViewChoice.svelte";
  import { drawsRoom, firstClass, setupExit, setupSteps, sharedRoom } from "$lib/setup";
  import { store } from "$lib/store.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  let view = $state(store.findClass(page.params.id!)!.lastShown.view);

  const exists = (id: string) => !!store.findRoomLayout(id);
  /** A room this teacher already drew for another class, so this one can skip drawing. */
  const reuse = $derived(sharedRoom(store.data.classes, cls.id, exists));

  const first = $derived(firstClass(store.data.classes, cls.id));

  function next() {
    store.showClass(cls.id, { view });
    if (view === "grid") return goto(first ? `/setup/${cls.id}/menu` : `/class/${cls.id}`);
    if (!exists(cls.lastShown.roomLayoutId ?? "") && reuse) store.showClass(cls.id, { roomLayoutId: reuse });
    const room = cls.lastShown.roomLayoutId;
    if (!room || !exists(room)) goto(`/setup/${cls.id}/shape`);
    else goto(`/setup/${cls.id}/${drawsRoom(store.data.classes, cls) ? "room" : "seats"}`);
  }
</script>

<SetupFrame
  steps={setupSteps(view, !reuse, first)}
  current={1}
  title="How would you like to see {cls.name}?"
  back="/setup/{cls.id}"
  exit={setupExit(store.data.classes, cls.id)}
  onboarding={first}
>
  <p class="intro">This is what you'll tap on in class. You can switch any time while teaching.</p>
  <ViewChoice {cls} bind:value={view} />
  {#snippet actions()}
    <button class="btn btn-primary" onclick={next}>{view === "grid" && !first ? "Done" : "Next"}</button>
  {/snippet}
</SetupFrame>
