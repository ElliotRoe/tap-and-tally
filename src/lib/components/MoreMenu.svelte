<!-- A ⋯ button that opens a short list of actions. -->
<script lang="ts">
  import Icon from "./Icon.svelte";

  type Action = { label: string; onclick: () => void; danger?: boolean };
  let { actions, label = "More" }: { actions: Action[]; label?: string } = $props();
  let open = $state(false);
  let root = $state<HTMLElement>();
</script>

<svelte:window onpointerdown={(e) => open && !root?.contains(e.target as Node) && (open = false)} />

<div class="more" bind:this={root}>
  <button
    type="button"
    class="btn btn-quiet btn-small dots"
    aria-label={label}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={(e) => {
      e.stopPropagation();
      open = !open;
    }}><Icon name="more" size={20} weight={3} /></button
  >
  {#if open}
    <div class="menu" role="menu">
      {#each actions as action}
        <button
          type="button"
          role="menuitem"
          class:danger={action.danger}
          onclick={(e) => {
            e.stopPropagation();
            open = false;
            action.onclick();
          }}>{action.label}</button
        >
      {/each}
    </div>
  {/if}
</div>

<style>
  .more {
    position: relative;
  }

  .dots {
    width: 38px;
    padding: 0;
  }

  .menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 30;
    display: grid;
    min-width: 160px;
    padding: 0.3rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .menu button {
    padding: 0.55rem 0.75rem;
    border: 0;
    border-radius: 8px;
    background: none;
    font-weight: 700;
    text-align: left;
  }

  .menu button:hover {
    background: var(--surface-sunk);
  }

  .danger {
    color: var(--danger);
  }
</style>
