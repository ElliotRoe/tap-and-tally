<!-- The paste-one-name-per-line box, with a live count of the students it finds. -->
<script lang="ts">
  import { parseRoster } from "$lib/domain/students";

  let { value = $bindable(""), label = "Students" }: { value?: string; label?: string } = $props();
  const count = $derived(parseRoster(value).length);
</script>

<label>
  <span class="row">
    {label}
    <span class="spacer"></span>
    <span class="count" aria-live="polite">{count} {count === 1 ? "student" : "students"}</span>
  </span>
  <textarea
    bind:value
    rows="7"
    placeholder={"One student per line, the way you'd like their name shown:\nMaria Gonzalez\nTom Ng\nCher"}
  ></textarea>
</label>

<style>
  .count {
    padding: 0.1rem 0.7rem;
    border-radius: 999px;
    background: var(--accent-wash);
    color: var(--accent-deep);
    font-weight: 700;
    font-size: 0.875rem;
  }
</style>
