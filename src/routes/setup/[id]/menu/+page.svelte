<!--
  Setup's "What do you want to track?": the Menu that pops up when a student is tapped.
  Beside it, a drawing of exactly that happening in this class, redrawn as the list is
  edited. A teacher with other Menus can reuse one; changes to a shared Menu apply to
  every Class using it. Next comes the practice tap.
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import MenuEditor from "$lib/components/MenuEditor.svelte";
  import SetupFrame from "$lib/components/SetupFrame.svelte";
  import TrackPreview from "$lib/components/TrackPreview.svelte";
  import { activeBehaviors, defaultMenu } from "$lib/domain/menus";
  import type { Menu } from "$lib/domain/types";
  import { drawsRoom, firstClass, setupExit, setupSteps } from "$lib/setup";
  import { store } from "$lib/store.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const first = $derived(firstClass(store.data.classes, cls.id));
  const saved = store.findClass(page.params.id!)!;
  const choosing = store.data.menus.length > 1 || store.data.classes.length > 1;

  let draft = $state<Menu>($state.snapshot(store.findMenu(saved.menuId) ?? defaultMenu()));
  const sharedWith = $derived(store.classesUsingMenu(draft.id).filter((c) => c.id !== cls.id));
  const steps = $derived(setupSteps(cls.lastShown.view, drawsRoom(store.data.classes, cls)));
  const ready = $derived(activeBehaviors(draft).some((b) => b.name.trim()));

  function choose(menu: Menu) {
    draft = $state.snapshot(menu);
  }

  function finish() {
    const menu = $state.snapshot(draft);
    menu.name = menu.name.trim() || "My menu";
    // A row left without a name isn't something to track.
    menu.behaviors = menu.behaviors
      .map((b) => ({ ...b, name: b.name.trim() }))
      .filter((b) => b.name || b.removed);
    if (store.findMenu(menu.id)) store.updateMenu(menu.id, menu);
    else store.addMenu(menu);
    store.updateClass(cls.id, { menuId: menu.id });
    goto(`/setup/${cls.id}/practice`);
  }
</script>

<SetupFrame
  {steps}
  current={steps.indexOf("What you track")}
  title="What do you want to track?"
  back="/setup/{cls.id}/{cls.lastShown.view === 'room' ? 'seats' : 'view'}"
  exit={setupExit(store.data.classes, cls.id)}
  onboarding={first}
>
  <p class="intro">When you tap a student, these buttons pop up. Start with ours, or make them your own.</p>

  {#if choosing}
    <div class="menus" role="radiogroup" aria-label="Menu">
      {#each store.data.menus as menu (menu.id)}
        <button role="radio" aria-checked={draft.id === menu.id} class="pick" class:on={draft.id === menu.id} onclick={() => choose(menu)}>
          <strong>{menu.name}</strong>
          <span>{activeBehaviors(menu).map((b) => b.emoji).join(" ")}</span>
        </button>
      {/each}
      <button role="radio" aria-checked={!store.findMenu(draft.id)} class="pick new" class:on={!store.findMenu(draft.id)} onclick={() => (draft = { ...defaultMenu(), name: "" })}>
        <strong>+ New menu</strong>
      </button>
    </div>
  {/if}

  {#if sharedWith.length}
    <p class="small shared">Also used by {sharedWith.map((c) => c.name).join(", ")}. Changes here apply there too.</p>
  {/if}

  <MenuEditor bind:menu={draft} />


  {#snippet actions()}
    <button class="btn btn-primary" onclick={finish} disabled={!ready}>Next</button>
  {/snippet}

  {#snippet aside()}
    <TrackPreview
      className={cls.name}
      students={cls.students.filter((s) => !s.former)}
      view={cls.lastShown.view}
      behaviors={activeBehaviors(draft)}
    />
  {/snippet}
</SetupFrame>

<style>
  .menus {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pick {
    display: grid;
    gap: 0.2rem;
    padding: 0.6rem 1rem;
    text-align: left;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .pick.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash);
  }

  .new {
    border-style: dashed;
  }

  .shared {
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    background: var(--accent-wash);
  }
</style>
