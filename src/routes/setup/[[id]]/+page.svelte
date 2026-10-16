<!-- Setup step 1: the Class's name and roster. With an id, it's revisiting that step via Back. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import RosterInput from "$lib/components/RosterInput.svelte";
  import SetupFrame from "$lib/components/SetupFrame.svelte";
  import { fullName, parseRoster } from "$lib/domain/students";
  import { firstClass, setupExit, setupSteps } from "$lib/setup";
  import { store } from "$lib/store.svelte";

  const existing = page.params.id ? store.findClass(page.params.id) : undefined;
  // Decided once, as the page opens: saving the new class must not flip them mid-step.
  const onboarding = firstClass(store.data.classes, existing?.id);
  const exit = setupExit(store.data.classes, existing?.id);
  const originalRoster = existing?.students.map(fullName).join("\n") ?? "";
  let name = $state(existing?.name ?? "");
  let roster = $state(originalRoster);
  const ready = $derived(name.trim() !== "" && parseRoster(roster).length > 0);

  function next(event: SubmitEvent) {
    event.preventDefault();
    if (!ready) return;
    let id = existing?.id;
    if (id) {
      store.updateClass(id, { name: name.trim() });
      if (roster !== originalRoster) store.replaceRoster(id, roster);
    } else {
      id = store.addClass(name, roster);
    }
    goto(`/setup/${id}/view`);
  }
</script>

<form onsubmit={next}>
  <SetupFrame
    steps={setupSteps(null, true, onboarding)}
    current={0}
    title={onboarding ? "Let's set up your first class" : "Set up a new class"}
    art="roster"
    {exit}
    {onboarding}
  >
    <p class="intro">Give it a name, then paste in your roster.</p>
    {#if onboarding}
      <p class="device small">
        <strong>Set this up on the iPad or computer you'll tap with in class.</strong> Everything stays on
        that device: there's no account and nothing is uploaded. You can download it all as a spreadsheet
        from Settings any time.
      </p>
    {/if}
    <label>
      Class name
      <input bind:value={name} placeholder="Period 2 Algebra" autocomplete="off" />
    </label>
    <RosterInput bind:value={roster} />
    {#snippet actions()}
      <button class="btn btn-primary" disabled={!ready}>Next</button>
    {/snippet}
  </SetupFrame>
</form>

<style>
  .device {
    margin: 0;
    padding: 0.65rem 0.85rem;
    border-radius: 10px;
    background: var(--accent-wash);
    color: var(--accent-deep);
    line-height: 1.45;
  }
</style>
