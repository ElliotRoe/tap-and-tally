<!-- The left nav: every Class to teach, then the shared Room Layouts and Menus, Reports and Settings. -->
<script lang="ts">
  import { page } from "$app/state";
  import LassoMark from "$lib/art/LassoMark.svelte";
  import { startClass } from "$lib/startClass";
  import Icon from "./Icon.svelte";
  import { backupDue } from "$lib/domain/backup";
  import { store } from "$lib/store.svelte";

  const here = (path: string) => page.url.pathname === path || page.url.pathname.startsWith(path + "/");
  const due = $derived(backupDue(store.data));
</script>

<nav class="sidebar" aria-label="Main">
  <a class="brand wordmark" href="/"><LassoMark size={32} /> Tap & Tally</a>

  {#if store.startClass}
    <button class="btn btn-primary start" onclick={() => startClass(store.startClass!.id)}>
      <Icon name="play" size={16} /> Start class
    </button>
  {/if}

  <h2 class="heading">Classes</h2>
  <ul>
    {#each store.data.classes as cls (cls.id)}
      <li><a href="/class/{cls.id}" class:active={here(`/class/${cls.id}`)}>{cls.name}</a></li>
    {/each}
    <li><a href="/setup" class="new">+ New class</a></li>
  </ul>

  <ul class="tools">
    <li><a href="/layouts" class:active={here("/layouts")}><Icon name="room" /> Room Layouts</a></li>
    <li><a href="/menus" class:active={here("/menus")}><Icon name="menu" /> Menus</a></li>
    <li><a href="/reports" class:active={here("/reports")}><Icon name="reports" /> Reports</a></li>
  </ul>

  <div class="bottom">
    {#if due}
      <a class="nudge small" href="/settings">
        <strong>Time for a backup</strong>
        Your taps only live on this laptop. Download a copy.
      </a>
    {/if}
    {#if store.saveFailed}
      <p class="nudge warn small">This browser stopped saving. Download a backup now from Settings.</p>
    {/if}
    <a href="/settings" class:active={here("/settings")}><Icon name="settings" /> Settings</a>
  </div>
</nav>

<style>
  .sidebar {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 240px;
    height: 100vh;
    padding: 1rem 0.75rem;
    overflow-y: auto;
    border-right: 1px solid var(--border);
    background: var(--surface-sunk);
  }

  .brand {
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem 1rem;
        font-size: 1.1rem;
    color: var(--text);
    text-decoration: none;
  }

  .start {
    margin: 0 0.25rem 0.75rem;
  }

  .heading {
    margin: 0.5rem 0.75rem 0.25rem;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  a {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.75rem;
    border-radius: 10px;
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
  }

  ul a:hover,
  .bottom > a:hover {
    background: var(--bg);
  }

  a.active {
    background: var(--surface);
    color: var(--accent);
    box-shadow: 0 1px 2px rgb(90 58 32 / 0.08);
  }

  .new {
    color: var(--accent-deep);
  }

  .tools {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .bottom {
    margin-top: auto;
    display: grid;
    gap: 0.5rem;
  }

  .nudge {
    display: grid;
    gap: 0.2rem;
    padding: 0.75rem;
    border-radius: 12px;
    background: var(--accent-wash);
    font-weight: 400;
    margin: 0;
  }

  .warn {
    background: #f4cfc6;
  }

  @media (max-width: 800px) {
    .sidebar {
      position: static;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      width: 100%;
      height: auto;
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }

    .brand {
      padding-bottom: 0.25rem;
      width: 100%;
    }

    .start {
      margin: 0;
    }

    .heading {
      display: none;
    }

    ul,
    .bottom {
      display: flex;
      flex-wrap: wrap;
      margin: 0;
      padding: 0;
      border: 0;
    }
  }
</style>
