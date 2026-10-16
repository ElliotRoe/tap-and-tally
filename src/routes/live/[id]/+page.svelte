<!--
  Live Mode: the full-screen screen for class. The ✕ top left leaves; the only control
  at the bottom switches between the Grid and the Room. Everything else (which room,
  seating, the Grid's order, the Menu) sits behind the gear top right. Each Class
  reopens the way it was last used.
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ClassSwitcher from "$lib/components/ClassSwitcher.svelte";
  import GridOrderEditor from "$lib/components/GridOrderEditor.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import LiveView from "$lib/components/LiveView.svelte";
  import type { GridOrder, Id } from "$lib/domain/types";
  import { store } from "$lib/store.svelte";
  import { liveTracker } from "$lib/tracker.svelte";
  import { ui } from "$lib/ui.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const shown = $derived(cls.lastShown);
  const menu = $derived(store.findMenu(cls.menuId));
  const layout = $derived(store.findRoomLayout(shown.roomLayoutId) ?? store.data.roomLayouts[0]);
  const seating = $derived(layout ? (cls.seatings[layout.id] ?? {}) : {});

  // The first time a class is shown in a room, seat it A–Z.
  $effect(() => {
    if (layout && !cls.seatings[layout.id]) store.seatingFor(cls.id, layout.id);
  });

  // Opening a class makes it the one Start class goes to next time.
  $effect(() => {
    if (store.data.lastClassId !== cls.id) store.showClass(cls.id);
  });

  const ORDERS: { value: GridOrder; label: string }[] = [
    { value: "first-asc", label: "First name A–Z" },
    { value: "first-desc", label: "First name Z–A" },
    { value: "last-asc", label: "Last name A–Z" },
    { value: "last-desc", label: "Last name Z–A" },
    { value: "custom", label: "My own order" },
  ];

  function setView(view: "grid" | "room") {
    if (view === "room" && !layout) {
      goto(`/room/new?class=${cls.id}`);
      return;
    }
    store.showClass(cls.id, { view, roomLayoutId: layout?.id ?? null });
  }

  async function exit() {
    await ui.exitFullscreen();
    goto(`/class/${cls.id}`);
  }

  // The gear's panel.
  let settingsOpen = $state(false);
  let settingsRoot = $state<HTMLElement>();

  // Dragging the Grid into the teacher's own order.
  let arranging = $state(false);
  let arrangeDialog = $state<HTMLDialogElement>();
  let order = $state<GridOrder>("first-asc");
  let customOrder = $state<Id[]>([]);

  $effect(() => {
    if (arranging && !arrangeDialog?.open) {
      order = shown.gridOrder;
      customOrder = [...shown.customOrder];
      arrangeDialog?.showModal();
    }
    if (!arranging && arrangeDialog?.open) arrangeDialog.close();
  });

  function chooseOrder(value: GridOrder) {
    if (value === "custom") {
      settingsOpen = false;
      arranging = true;
    } else store.showClass(cls.id, { gridOrder: value });
  }

  function chooseRoom(value: string) {
    if (value === "new") goto(`/room/new?class=${cls.id}`);
    else store.showClass(cls.id, { roomLayoutId: value });
  }
</script>

<svelte:head><title>{cls.name} · Tap &amp; Tally</title></svelte:head>

<svelte:window
  onpointerdown={(e) => settingsOpen && !settingsRoot?.contains(e.target as Node) && (settingsOpen = false)}
  onkeydown={(e) => e.key === "Escape" && (settingsOpen = false)}
/>

<div class="live">
  <header class="top">
    <div class="left">
      <button class="square" onclick={exit} aria-label="Leave class" title="Leave class">
        <Icon name="close" size={22} />
      </button>
    </div>
    <ClassSwitcher {cls} />
    <div class="right">
    <span class="hint small">Tap to track · Hold to mark absent</span>

    <div class="settings" bind:this={settingsRoot}>
      <button
        class="square"
        aria-label="Class settings"
        title="Settings"
        aria-expanded={settingsOpen}
        onclick={() => (settingsOpen = !settingsOpen)}
      >
        <Icon name="settings" size={22} />
      </button>

      {#if settingsOpen}
        <div class="panel" role="dialog" aria-label="Class settings">
          <section>
            <h2>Grid</h2>
            <label>
              Order
              <select value={shown.gridOrder} onchange={(e) => chooseOrder(e.currentTarget.value as GridOrder)}>
                {#each ORDERS as option}<option value={option.value}>{option.label}</option>{/each}
              </select>
            </label>
            {#if shown.gridOrder === "custom"}
              <button
                class="item"
                onclick={() => {
                  settingsOpen = false;
                  arranging = true;
                }}><Icon name="grip" size={18} weight={4} /> Rearrange the grid</button
              >
            {/if}
          </section>

          <section>
            <h2>Room</h2>
            {#if layout}
              <label>
                Room
                <select value={layout.id} onchange={(e) => chooseRoom(e.currentTarget.value)}>
                  {#each store.data.roomLayouts as room (room.id)}<option value={room.id}>{room.name}</option>{/each}
                  <option value="new">+ New room…</option>
                </select>
              </label>
              <a class="item" href="/live/{cls.id}/seats/{layout.id}"><Icon name="seats" size={18} /> Arrange seats</a>
              <a class="item" href="/room/{layout.id}?back=/live/{cls.id}"><Icon name="edit" size={18} /> Edit room</a>
            {:else}
              <a class="item" href="/room/new?class={cls.id}"><Icon name="plus" size={18} /> Draw a room</a>
            {/if}
          </section>

          <section>
            <h2>What you track</h2>
            {#if menu}
              <a class="item" href="/menus/{menu.id}"><Icon name="menu" size={18} /> Edit {menu.name}</a>
            {/if}
            <a class="item" href="/class/{cls.id}"><Icon name="seats" size={18} /> Students and class settings</a>
          </section>
        </div>
      {/if}
    </div>
    </div>
  </header>

  <main class="body">
    <LiveView
      {cls}
      {menu}
      tracker={liveTracker}
      view={shown.view}
      order={shown.gridOrder}
      customOrder={shown.customOrder}
      {layout}
      {seating}
      fill
    />
  </main>

  <nav class="bar" aria-label="View">
    <div class="segmented" role="radiogroup" aria-label="View">
      <button role="radio" aria-checked={shown.view === "grid"} class:on={shown.view === "grid"} onclick={() => setView("grid")}>
        <Icon name="grid" size={18} /> Grid
      </button>
      <button role="radio" aria-checked={shown.view === "room"} class:on={shown.view === "room"} onclick={() => setView("room")}>
        <Icon name="room" size={18} /> Room
      </button>
    </div>
  </nav>
</div>

<dialog class="arrange" bind:this={arrangeDialog} onclose={() => (arranging = false)}>
  <h2>Arrange {cls.name}</h2>
  <GridOrderEditor {cls} bind:order bind:customOrder />
  <div class="row">
    <span class="spacer"></span>
    <button class="btn btn-quiet" onclick={() => (arranging = false)}>Cancel</button>
    <button
      class="btn btn-primary"
      onclick={() => {
        store.showClass(cls.id, { gridOrder: order, customOrder: $state.snapshot(customOrder) });
        arranging = false;
      }}>Done</button
    >
  </div>
</dialog>

<style>
  .live {
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }

  /* ✕ on the left, the class name in the middle, the gear on the right. */
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.5rem 0.5rem;
  }

  .left {
    justify-self: start;
  }

  .right {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .square {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    background: var(--surface);
    color: var(--muted);
  }

  .square:hover,
  .square[aria-expanded="true"] {
    background: var(--surface-sunk);
    color: var(--text);
  }

  .hint {
    color: var(--faint);
    font-weight: 700;
  }

  .settings {
    position: relative;
  }

  .panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 40;
    display: grid;
    gap: 0.25rem;
    width: 300px;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 24px 60px -24px rgb(59 36 22 / 0.45);
  }

  .panel section {
    display: grid;
    gap: 0.35rem;
    padding: 0.5rem;
  }

  .panel section + section {
    border-top: 1px solid var(--border);
  }

  .panel h2 {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .panel label {
    font-size: 0.85rem;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 42px;
    padding: 0.4rem 0.6rem;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--text);
    font-weight: 700;
    text-align: left;
    text-decoration: none;
  }

  .item:hover {
    background: var(--surface-sunk);
  }

  .body {
    min-height: 0;
    overflow-y: auto;
    padding: 0.5rem 1.5rem 0.75rem;
  }

  .bar {
    margin: 0 auto 0.85rem;
    padding: 0.35rem;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .segmented {
    display: flex;
    padding: 3px;
    border-radius: 12px;
    background: var(--surface-sunk);
  }

  .segmented button {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 48px;
    padding: 0.3rem 1.4rem;
    border: 0;
    border-radius: 9px;
    background: none;
    font-weight: 800;
    font-size: 1.02rem;
    color: var(--muted);
  }

  .segmented .on {
    background: var(--surface);
    color: var(--accent);
    box-shadow: 0 1px 3px rgb(90 58 32 / 0.15);
  }

  .arrange {
    max-width: min(900px, calc(100vw - 2rem));
  }

  .arrange[open] {
    display: grid;
    gap: 1rem;
  }
</style>
