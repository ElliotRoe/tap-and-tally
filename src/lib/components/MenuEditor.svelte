<!--
  Edit a Menu: its name and its Behaviors, each with an emoji, a colour, and whether it
  counts every tap or is on or off for the day. Removing a Behavior hides it from the
  popup but keeps it, so its past Taps still have a name in Reports.
-->
<script lang="ts">
  import { COLORS, EMOJIS, newBehavior } from "$lib/domain/menus";
  import type { Id, Menu } from "$lib/domain/types";
  import Icon from "./Icon.svelte";

  const MAX = 8;
  let { menu = $bindable() }: { menu: Menu } = $props();
  let picking = $state<Id | null>(null);
  const active = $derived(menu.behaviors.filter((b) => !b.removed));

  function add() {
    const behavior = newBehavior(menu.behaviors.length);
    menu.behaviors.push(behavior);
    picking = null;
  }
</script>

<label class="menu-name">
  <span>Menu name</span>
  <input bind:value={menu.name} placeholder="Participation" />
</label>

<ul class="list">
  {#each menu.behaviors as behavior (behavior.id)}
    {#if !behavior.removed}
      <li class="behavior" style="--chip: {behavior.color}">
        <div class="row">
          <button
            type="button"
            class="emoji"
            aria-label="Change emoji for {behavior.name || 'this behavior'}"
            aria-expanded={picking === behavior.id}
            onclick={() => (picking = picking === behavior.id ? null : behavior.id)}>{behavior.emoji}</button
          >
          <input class="name" bind:value={behavior.name} placeholder="What you're tracking" aria-label="Behavior name" />
          <div class="mode" role="radiogroup" aria-label="How taps count">
            <button
              type="button"
              role="radio"
              aria-checked={behavior.mode === "count"}
              class:on={behavior.mode === "count"}
              title="Counts every tap"
              onclick={() => (behavior.mode = "count")}><Icon name="count" size={15} /> Count</button
            >
            <button
              type="button"
              role="radio"
              aria-checked={behavior.mode === "toggle"}
              class:on={behavior.mode === "toggle"}
              title="On or off for the day"
              onclick={() => (behavior.mode = "toggle")}><Icon name="toggle" size={15} /> On/off</button
            >
          </div>
          <button
            type="button"
            class="btn btn-quiet btn-small"
            aria-label="Remove {behavior.name}"
            onclick={() => (behavior.removed = true)}>✕</button
          >
        </div>
        {#if picking === behavior.id}
          <div class="picker">
            <div class="emojis">
              {#each EMOJIS as emoji}
                <button type="button" class:on={behavior.emoji === emoji} onclick={() => (behavior.emoji = emoji)}>{emoji}</button>
              {/each}
            </div>
            <label class="own small">
              Or type any emoji
              <input
                maxlength="8"
                value={behavior.emoji}
                oninput={(e) => {
                  const typed = e.currentTarget.value.trim();
                  if (typed) behavior.emoji = typed;
                }}
              />
            </label>
            <div class="colors" role="radiogroup" aria-label="Colour">
              {#each COLORS as color}
                <button
                  type="button"
                  role="radio"
                  aria-checked={behavior.color === color.value}
                  aria-label={color.name}
                  class="swatch"
                  style="background: {color.value}"
                  onclick={() => (behavior.color = color.value)}
                ></button>
              {/each}
            </div>
            <button type="button" class="btn btn-small" onclick={() => (picking = null)}>Done</button>
          </div>
        {/if}
      </li>
    {/if}
  {/each}
</ul>

{#if active.length < MAX}
  <button type="button" class="btn btn-small add" onclick={add}>+ Add something to track</button>
{:else}
  <p class="muted small">That's the most a Menu can hold, so it stays quick to tap.</p>
{/if}

<style>
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  .behavior {
    padding: 0.4rem;
    border-radius: var(--radius);
    background: var(--chip);
    border: 1px solid var(--border-strong);
  }

  .behavior .row {
    flex-wrap: nowrap;
    gap: 0.4rem;
  }

  .menu-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .menu-name span {
    flex: none;
  }

  .behavior input {
    min-height: 40px;
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }

  .emoji {
    flex: none;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    font-size: 1.5rem;
  }

  .name {
    flex: 1;
    min-width: 0;
  }

  .mode {
    flex: none;
    display: flex;
    padding: 3px;
    border-radius: 10px;
    background: rgb(255 253 249 / 0.7);
  }

  .mode button {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 34px;
    padding: 0.2rem 0.6rem;
    border: 0;
    border-radius: 8px;
    background: none;
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--muted);
  }

  .mode .on {
    background: var(--surface);
    color: var(--accent);
    box-shadow: 0 1px 3px rgb(90 58 32 / 0.15);
  }

  .picker {
    display: grid;
    gap: 0.6rem;
    margin-top: 0.6rem;
    padding: 0.75rem;
    border-radius: 10px;
    background: var(--surface);
    justify-items: start;
  }

  .emojis {
    display: grid;
    grid-template-columns: repeat(8, 40px);
    gap: 0.25rem;
  }

  .emojis button {
    width: 40px;
    height: 40px;
    border: 2px solid transparent;
    border-radius: 8px;
    background: none;
    font-size: 1.3rem;
  }

  .emojis button.on {
    border-color: var(--accent);
    background: var(--accent-wash);
  }

  .own input {
    width: 90px;
  }

  .colors {
    display: flex;
    gap: 0.4rem;
  }

  .swatch {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
  }

  .swatch[aria-checked="true"] {
    border-color: var(--text);
    box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--text);
  }

  .add {
    justify-self: start;
  }

  @media (max-width: 560px) {
    .behavior .row {
      flex-wrap: wrap;
    }

    .emojis {
      grid-template-columns: repeat(6, 40px);
    }
  }
</style>
