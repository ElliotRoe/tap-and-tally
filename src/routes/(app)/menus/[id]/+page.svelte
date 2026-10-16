<!-- Edit one Menu. Changes apply to every Class using it. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import MenuEditor from "$lib/components/MenuEditor.svelte";
  import { activeBehaviors } from "$lib/domain/menus";
  import type { Menu } from "$lib/domain/types";
  import { store } from "$lib/store.svelte";

  const original = store.findMenu(page.params.id!);
  let draft = $state<Menu | null>(original ? $state.snapshot(original) : null);
  const users = $derived(draft ? store.classesUsingMenu(draft.id) : []);
  const ready = $derived(!!draft && activeBehaviors(draft).some((b) => b.name.trim()));

  function save() {
    if (!draft) return;
    const menu = $state.snapshot(draft);
    menu.name = menu.name.trim() || "My menu";
    menu.behaviors = menu.behaviors
      .map((b) => ({ ...b, name: b.name.trim() }))
      .filter((b) => b.name || b.removed);
    store.updateMenu(menu.id, menu);
    goto("/menus");
  }
</script>

<svelte:head><title>{draft?.name ?? "Menu"} · Tap & Tally</title></svelte:head>

<div class="page stack">
  {#if draft}
    <a class="btn btn-quiet btn-small back" href="/menus">← Menus</a>
    <h1>Edit menu</h1>
    {#if users.length > 1}
      <p class="small shared">Used by {users.map((c) => c.name).join(", ")}. Changes apply to all of them.</p>
    {/if}
    <div class="card stack">
      <MenuEditor bind:menu={draft} />
    </div>
    <p class="muted small">Removing something keeps its past taps in Reports.</p>
    <div class="row">
      <span class="spacer"></span>
      <a class="btn btn-quiet" href="/menus">Cancel</a>
      <button class="btn btn-primary" onclick={save} disabled={!ready}>Save</button>
    </div>
  {:else}
    <p>That menu doesn't exist. <a href="/menus">Back to Menus</a></p>
  {/if}
</div>

<style>
  .back {
    justify-self: start;
  }

  .shared {
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    background: var(--accent-wash);
  }
</style>
