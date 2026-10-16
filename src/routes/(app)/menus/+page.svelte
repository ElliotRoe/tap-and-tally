<!-- The library of Menus, as cards: what pops up when a student is tapped. Classes can share one. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import MoreMenu from "$lib/components/MoreMenu.svelte";
  import { activeBehaviors, defaultMenu } from "$lib/domain/menus";
  import type { Menu } from "$lib/domain/types";
  import { chooseFile, downloadFile, slug } from "$lib/files";
  import { store } from "$lib/store.svelte";

  let deleting = $state<Menu | null>(null);
  let problem = $state("");

  function create() {
    const id = store.addMenu({ ...defaultMenu(), name: "New menu" });
    goto(`/menus/${id}`);
  }

  async function importMenu() {
    const text = await chooseFile();
    if (!text) return;
    const added = store.importText(text);
    problem = added?.kind === "menu" ? "" : "That file isn't a Tap & Tally menu.";
  }

  function exportMenu(menu: Menu) {
    const text = store.exportText("menu", menu.id);
    if (text) downloadFile(`${slug(menu.name)}.menu.json`, text);
  }

  function askDelete(menu: Menu) {
    const users = store.classesUsingMenu(menu.id);
    if (users.length) problem = `${menu.name} is used by ${users.map((c) => c.name).join(", ")}. Give them another menu first.`;
    else deleting = menu;
  }
</script>

<svelte:head><title>Menus · Tap &amp; Tally</title></svelte:head>

<div class="page wide stack">
  <div class="row">
    <h1>Menus</h1>
    <span class="spacer"></span>
    <button class="btn" onclick={importMenu}><Icon name="upload" size={16} /> Import</button>
    <button class="btn btn-primary" onclick={create}><Icon name="plus" size={16} /> New menu</button>
  </div>
  <p class="muted">
    The buttons that pop up when you tap a student. Classes can share a menu, so a change here shows up
    in every class using it.
  </p>
  {#if problem}<p class="problem small">{problem}</p>{/if}

  <div class="cards">
    {#each store.data.menus as menu (menu.id)}
      {@const users = store.classesUsingMenu(menu.id)}
      <article class="card menu">
        <a class="open" href="/menus/{menu.id}" aria-label="Edit {menu.name}">
          <ul class="behaviors">
            {#each activeBehaviors(menu) as behavior (behavior.id)}
              <li style="background: {behavior.color}">
                <span class="emoji">{behavior.emoji}</span>
                <span class="name">{behavior.name}</span>
                <span class="kind" title={behavior.mode === "toggle" ? "On or off for the day" : "Counts every tap"}>
                  <Icon name={behavior.mode === "toggle" ? "toggle" : "count"} size={15} />
                </span>
              </li>
            {/each}
          </ul>
        </a>
        <div class="row foot">
          <div class="text">
            <h2>{menu.name}</h2>
            <p class="muted small">{users.length ? users.map((c) => c.name).join(", ") : "Not used by any class"}</p>
          </div>
          <MoreMenu
            label="{menu.name} actions"
            actions={[
              { label: "Edit", onclick: () => goto(`/menus/${menu.id}`) },
              { label: "Export", onclick: () => exportMenu(menu) },
              { label: "Delete…", danger: true, onclick: () => askDelete(menu) },
            ]}
          />
        </div>
      </article>
    {/each}
  </div>

  <p class="legend muted small">
    <Icon name="count" size={14} /> counts every tap
    <span class="gap"></span>
    <Icon name="toggle" size={14} /> on or off for the day
  </p>
</div>

<ConfirmDialog
  open={!!deleting}
  title="Delete {deleting?.name ?? ''}?"
  message="Taps already recorded keep their names in Reports."
  confirm="Delete menu"
  danger
  onconfirm={() => deleting && store.deleteMenu(deleting.id)}
  onclose={() => (deleting = null)}
/>

<style>
  .wide {
    max-width: 1180px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .menu {
    display: grid;
    gap: 0.75rem;
    padding: 0.75rem;
    align-content: start;
  }

  .menu:hover {
    border-color: var(--border-strong);
  }

  .open {
    color: inherit;
    text-decoration: none;
  }

  .behaviors {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding: 0.6rem;
    border-radius: 10px;
    background: var(--surface-sunk);
    list-style: none;
  }

  .behaviors li {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.45rem 0.65rem;
    border-radius: 8px;
    font-weight: 800;
    font-size: 0.92rem;
  }

  .emoji {
    font-size: 1.15rem;
  }

  .name {
    flex: 1;
  }

  .kind {
    display: grid;
    place-items: center;
    color: rgb(46 34 25 / 0.55);
  }

  .foot {
    flex-wrap: nowrap;
    align-items: flex-start;
  }

  .text {
    flex: 1;
    min-width: 0;
  }

  .text h2,
  .text p {
    margin: 0;
  }

  .text h2 {
    font-size: 1.05rem;
  }

  .problem {
    margin: 0;
    color: var(--danger);
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .gap {
    width: 1rem;
  }
</style>
