<!-- Today's total, as a bubble on a tile's top-right corner. Its parent must be positioned. -->
<script lang="ts">
  let { total }: { total: number } = $props();
</script>

<span class="total" aria-label="{total} today">{total}</span>

<style>
  .total {
    position: absolute;
    top: -9px;
    right: -9px;
    min-width: 26px;
    height: 26px;
    padding: 0 0.4rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--accent);
    color: #fffaf2;
    font-weight: 800;
    font-size: 0.8rem;
    border: 2.5px solid var(--surface);
  }
</style>
