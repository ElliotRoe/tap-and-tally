<!-- The class name as a dropdown: pick another class to switch Live Mode to it. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Class } from "$lib/domain/types";
  import { store } from "$lib/store.svelte";
  import Icon from "./Icon.svelte";

  let { cls }: { cls: Class } = $props();
  let open = $state(false);
</script>

<div class="switcher">
  <button class="title" aria-expanded={open} aria-haspopup="menu" onclick={() => (open = !open)}>
    <h1>{cls.name}</h1>
    {#if store.data.classes.length > 1}<Icon name="chevron" size={22} />{/if}
  </button>
  {#if open && store.data.classes.length > 1}
    <div class="menu" role="menu">
      {#each store.data.classes as other (other.id)}
        <button
          role="menuitem"
          class:current={other.id === cls.id}
          onclick={() => {
            open = false;
            goto(`/live/${other.id}`);
          }}>{other.name}</button
        >
      {/each}
    </div>
  {/if}
</div>

<svelte:window onclick={(e) => open && !(e.target as HTMLElement).closest(".switcher") && (open = false)} />

<style>
  .switcher {
    position: relative;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.5rem 0.2rem 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--text);
  }

  .title:hover {
    background: var(--surface-sunk);
  }

  h1 {
    margin: 0;
    font-size: clamp(1.4rem, 2.6vw, 2rem);
  }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    display: grid;
    min-width: 240px;
    padding: 0.35rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .menu button {
    padding: 0.7rem 0.85rem;
    border: 0;
    border-radius: 8px;
    background: none;
    font-weight: 700;
    text-align: left;
  }

  .menu button:hover,
  .menu .current {
    background: var(--accent-wash);
    color: var(--accent-deep);
  }
</style>
