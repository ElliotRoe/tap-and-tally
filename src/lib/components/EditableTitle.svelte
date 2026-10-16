<!--
  A title you rename in place, the way a Google Doc's name works: it underlines on hover,
  and clicking it turns it into a text box. Enter or clicking away keeps the change.
-->
<script lang="ts">
  let {
    value,
    onchange,
    level = 1,
    label = "Rename",
  }: { value: string; onchange: (next: string) => void; level?: 1 | 2; label?: string } = $props();

  let editing = $state(false);
  let draft = $state("");

  function start() {
    draft = value;
    editing = true;
  }

  function finish() {
    editing = false;
    const next = draft.trim();
    if (next && next !== value) onchange(next);
  }

  function focus(node: HTMLInputElement) {
    node.focus();
    node.select();
  }
</script>

{#if editing}
  <input
    class="title-input level-{level}"
    bind:value={draft}
    use:focus
    onblur={finish}
    onkeydown={(e) => {
      if (e.key === "Enter") finish();
      if (e.key === "Escape") editing = false;
    }}
    aria-label={label}
  />
{:else}
  <button class="title level-{level}" onclick={start} title="Click to rename">{value}</button>
{/if}

<style>
  .title,
  .title-input {
    margin: 0;
    padding: 0.05rem 0.25rem;
    margin-left: -0.25rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: none;
    color: var(--text);
    font-weight: 800;
    letter-spacing: -0.02em;
    text-align: left;
    line-height: 1.2;
  }

  .level-1 {
    font-size: clamp(1.7rem, 3vw, 2.3rem);
  }

  .level-2 {
    font-size: 1.4rem;
  }

  .title {
    cursor: text;
    text-decoration: underline transparent 2px;
    text-underline-offset: 6px;
    transition: text-decoration-color 0.15s;
  }

  .title:hover {
    text-decoration-color: var(--border-strong);
  }

  .title-input {
    width: min(100%, 28ch);
    min-height: 0;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash);
  }
</style>
