<!-- A button that only acts once it has been held until it fills, for things a stray tap shouldn't do. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { hold } from "$lib/hold";

  let { onhold, children }: { onhold: () => void; children: Snippet } = $props();
</script>

<button type="button" class="hold" use:hold={{ onHold: onhold }}>
  <span class="fill" aria-hidden="true"></span>
  <span class="label">{@render children()}</span>
</button>

<style>
  .hold {
    position: relative;
    overflow: hidden;
    width: 100%;
    min-height: 56px;
    padding: 0.5rem 1rem;
    border: 1px dashed var(--border-strong);
    border-radius: 12px;
    background: var(--surface-sunk);
    color: var(--muted);
    font-weight: 800;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .fill {
    position: absolute;
    inset: 0;
    width: calc(var(--hold, 0) * 100%);
    background: rgb(180 83 42 / 0.18);
    box-shadow: inset -10px 0 12px -10px rgb(122 52 24 / 0.45);
  }

  .label {
    position: relative;
  }
</style>
