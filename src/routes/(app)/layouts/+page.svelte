<!-- The library of Room Layouts, as cards drawn like the rooms. Any class can be shown in any of them. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import MoreMenu from "$lib/components/MoreMenu.svelte";
  import RoomThumb from "$lib/components/RoomThumb.svelte";
  import type { RoomLayout } from "$lib/domain/types";
  import { chooseFile, downloadFile, slug } from "$lib/files";
  import { store } from "$lib/store.svelte";

  let deleting = $state<RoomLayout | null>(null);
  let problem = $state("");

  async function importRoom() {
    const text = await chooseFile();
    if (!text) return;
    const added = store.importText(text);
    problem = added?.kind === "room-layout" ? "" : "That file isn't a Tap & Tally room.";
  }

  function exportRoom(room: RoomLayout) {
    const text = store.exportText("room-layout", room.id);
    if (text) downloadFile(`${slug(room.name)}.room.json`, text);
  }
</script>

<svelte:head><title>Room Layouts · Tap &amp; Tally</title></svelte:head>

<div class="page wide stack">
  <div class="row">
    <h1>Room Layouts</h1>
    <span class="spacer"></span>
    <button class="btn" onclick={importRoom}><Icon name="upload" size={16} /> Import</button>
    <a class="btn btn-primary" href="/room/new"><Icon name="plus" size={16} /> New room</a>
  </div>
  <p class="muted">
    The rooms you teach in. Pick one for any class while teaching; each class keeps its own seating in
    every room.
  </p>
  {#if problem}<p class="problem small">{problem}</p>{/if}

  <div class="cards">
    {#each store.data.roomLayouts as room (room.id)}
      {@const seatedIn = store.classesSeatedIn(room.id)}
      <article class="card room">
        <a class="open" href="/room/{room.id}" aria-label="Edit {room.name}">
          <RoomThumb layout={room} label={room.name} />
        </a>
        <div class="row foot">
          <div class="text">
            <h2>{room.name}</h2>
            <p class="muted small">
              {room.seats.length} desks{seatedIn.length ? ` · ${seatedIn.map((c) => c.name).join(", ")}` : ""}
            </p>
          </div>
          <MoreMenu
            label="{room.name} actions"
            actions={[
              { label: "Edit", onclick: () => goto(`/room/${room.id}`) },
              { label: "Export", onclick: () => exportRoom(room) },
              { label: "Delete…", danger: true, onclick: () => (deleting = room) },
            ]}
          />
        </div>
      </article>
    {:else}
      <p class="card muted">No rooms yet. Make one here, or choose Room while teaching.</p>
    {/each}
  </div>
</div>

<ConfirmDialog
  open={!!deleting}
  title="Delete {deleting?.name ?? ''}?"
  message="Every class's seating in this room goes with it."
  confirm="Delete room"
  danger
  onconfirm={() => deleting && store.deleteRoomLayout(deleting.id)}
  onclose={() => (deleting = null)}
/>

<style>
  .wide {
    max-width: 1180px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .room {
    display: grid;
    gap: 0.75rem;
    padding: 0.75rem;
    transition: border-color 0.12s;
  }

  .room:hover {
    border-color: var(--border-strong);
  }

  .open {
    display: block;
    border-radius: 10px;
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
</style>
