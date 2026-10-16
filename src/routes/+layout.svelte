<script lang="ts">
  import "../styles.css";
  let { children } = $props();
</script>

<svelte:head>
  <title>Tap & Tally</title>
  <meta name="description" content="Wrangle your class's participation. Tap a student, tally what they did. Everything stays on your laptop." />
</svelte:head>

{@render children()}
