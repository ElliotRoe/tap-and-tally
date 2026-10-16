<script lang="ts">
  import Sidebar from "$lib/components/Sidebar.svelte";
  import SiteFooter from "$lib/components/SiteFooter.svelte";

  let { children } = $props();
</script>

<div class="shell">
  <Sidebar />
  <div class="main">
    <div class="content">{@render children()}</div>
    <SiteFooter />
  </div>
</div>

<style>
  .shell {
    display: flex;
    min-height: 100vh;
  }

  /* The desert sits at the foot of the page, below the content however short it is. */
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .content {
    flex: 1;
    padding-bottom: 2rem;
  }

  @media (max-width: 800px) {
    .shell {
      flex-direction: column;
    }
  }
</style>
