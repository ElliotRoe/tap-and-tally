<!-- Backup, a spreadsheet of everything, Restore, and Erase everything. Downloads are the only copies that leave this device. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { readData } from "$lib/domain/backup";
  import { dayKey } from "$lib/domain/days";
  import { everythingCsv } from "$lib/domain/reports";
  import { downloadFile } from "$lib/files";
  import Icon from "$lib/components/Icon.svelte";
  import { store } from "$lib/store.svelte";

  let restoring = $state<string | null>(null);
  let problem = $state("");
  let erasing = $state(false);

  const lastBackup = $derived(
    store.data.lastBackupAt
      ? new Date(store.data.lastBackupAt).toLocaleDateString(undefined, { dateStyle: "long" })
      : null,
  );

  function download() {
    const file = new Blob([store.backupText()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `tap-and-tally-backup-${dayKey()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function choose(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const text = await file.text();
    problem = readData(text) ? "" : "That file isn't a Tap & Tally backup.";
    if (!problem) restoring = text;
  }
</script>

<svelte:head><title>Settings · Tap & Tally</title></svelte:head>

<div class="page stack">
  <h1>Settings</h1>

  <section class="card stack">
    <h2>Backup</h2>
    <p>
      Everything lives in this browser on this laptop. If the browser's data is cleared, it's gone,
      so download a backup now and then. It's also how you move to a new computer.
    </p>
    <p class="muted small">{lastBackup ? `Last backup: ${lastBackup}` : "You haven't downloaded a backup yet."}</p>
    <div><button class="btn btn-primary" onclick={download}><Icon name="download" size={16} /> Download a backup</button></div>
  </section>

  <section class="card stack">
    <h2>Spreadsheet</h2>
    <p>
      Every tap and absence from every class, a row each, with the date, time, class and
      student. Opens in Excel, Numbers or Google Sheets.
    </p>
    <div>
      <button
        class="btn"
        onclick={() => downloadFile(`tap-and-tally-${dayKey()}.csv`, everythingCsv(store.data), "text/csv")}
        ><Icon name="download" size={16} /> Download everything as a spreadsheet</button
      >
    </div>
  </section>

  <section class="card stack">
    <h2>Restore</h2>
    <p>Open a backup file to put everything back the way it was. This replaces what's here now.</p>
    <label class="btn file">
      Choose a backup file…
      <input type="file" accept=".json,application/json" onchange={choose} class="sr-only" />
    </label>
    {#if problem}<p class="problem small">{problem}</p>{/if}
  </section>

  <section class="card stack danger-zone">
    <h2>Erase everything</h2>
    <p class="muted">Removes every class, room, menu and tap from this laptop.</p>
    <div><button class="btn btn-danger" onclick={() => (erasing = true)}>Erase everything</button></div>
  </section>
</div>

<ConfirmDialog
  open={restoring !== null}
  title="Replace everything with this backup?"
  message="What's on this laptop now will be swapped for what's in the file."
  confirm="Restore"
  onconfirm={() => {
    if (restoring && store.restore(restoring)) goto("/");
  }}
  onclose={() => (restoring = null)}
/>

<ConfirmDialog
  bind:open={erasing}
  title="Erase everything?"
  message="Every class, student and tap on this laptop will be gone for good."
  confirm="Erase everything"
  danger
  onconfirm={() => {
    store.eraseEverything();
    goto("/");
  }}
/>

<style>
  .file {
    justify-self: start;
    display: inline-flex;
  }

  .problem {
    color: var(--danger);
    margin: 0;
  }

  .danger-zone {
    border-color: #e8b8ad;
  }
</style>
