<!--
  A Class's students and their week at a glance: a column per day showing what each
  student got (or that they were absent), today's column marked, and the week's totals.
  Each row's ⋯ holds Edit and Remove, or Bring back for Former Students. Add students
  opens the paste-a-list box.
-->
<script lang="ts">
  import { buildWeek } from "$lib/domain/reports";
  import { fullName, parseRoster } from "$lib/domain/students";
  import type { Class, Student } from "$lib/domain/types";
  import { store } from "$lib/store.svelte";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import MoreMenu from "./MoreMenu.svelte";
  import RosterInput from "./RosterInput.svelte";

  let { cls }: { cls: Class } = $props();

  const week = $derived(buildWeek(cls, store.data));

  let adding = $state(false);
  let roster = $state("");
  let addDialog = $state<HTMLDialogElement>();
  let editing = $state<{ id: string; firstName: string; lastName: string } | null>(null);
  let editDialog = $state<HTMLDialogElement>();
  let removing = $state<Student | null>(null);

  $effect(() => {
    if (adding) addDialog?.showModal();
    else addDialog?.close();
  });
  $effect(() => {
    if (editing) editDialog?.showModal();
    else editDialog?.close();
  });

  function add(event: SubmitEvent) {
    event.preventDefault();
    store.addStudents(cls.id, roster);
    roster = "";
    adding = false;
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    if (!editing || !editing.firstName.trim()) return;
    store.updateStudent(cls.id, editing.id, {
      firstName: editing.firstName.trim(),
      lastName: editing.lastName.trim(),
    });
    editing = null;
  }
</script>

<div class="row">
  <h2>Students</h2>
  <span class="spacer"></span>
  <button class="btn btn-small" onclick={() => (adding = true)}>+ Add students</button>
</div>

{#snippet chips(counts: number[], totals = false)}
  <span class="chips">
    {#each week.behaviors as behavior, i (behavior.id)}
      {#if counts[i]}
        <span class="chip" style="background: {behavior.color}" title="{behavior.name}: {counts[i]}">
          {behavior.emoji}{#if counts[i] > 1 || (totals && behavior.mode === "count")}<b>{counts[i]}</b>{/if}
        </span>
      {/if}
    {/each}
  </span>
{/snippet}

{#if week.behaviors.length}
  <p class="key small">
    {#each week.behaviors as behavior (behavior.id)}
      <span><span class="emoji">{behavior.emoji}</span> {behavior.name}</span>
    {/each}
  </p>
{/if}

<div class="scroll">
  <table>
    <thead>
      <tr>
        <th>Student</th>
        {#each week.days as day (day.key)}
          <th class="day" class:today={day.today}>{day.label} <span class="date">{day.date}</span></th>
        {/each}
        <th class="week">This week</th>
        <th><span class="sr-only">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      {#each week.rows as row (row.student.id)}
        <tr class:former={row.student.former}>
          <td class="name">{fullName(row.student)} {#if row.student.former}<span class="badge">Left</span>{/if}</td>
          {#each row.days as cell, i (week.days[i].key)}
            <td class="day" class:today={week.days[i].today} class:ahead={week.days[i].ahead}>
              {#if cell.absent}
                <span class="absent">Absent</span>
              {:else if cell.counts.some((n) => n > 0)}
                {@render chips(cell.counts)}
              {:else if !week.days[i].ahead}
                <span class="none">–</span>
              {/if}
            </td>
          {/each}
          <td class="week">
            {@render chips(row.total, true)}
            {#if row.absent}<span class="absent-days">{row.absent} {row.absent === 1 ? "day" : "days"} absent</span>{/if}
          </td>
          <td class="actions">
            <MoreMenu
              label="{row.student.firstName} actions"
              actions={row.student.former
                ? [{ label: "Bring back", onclick: () => store.updateStudent(cls.id, row.student.id, { former: false }) }]
                : [
                    { label: "Edit", onclick: () => (editing = { ...row.student }) },
                    { label: "Remove…", danger: true, onclick: () => (removing = row.student) },
                  ]}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<p class="muted small">Removed students keep their history in Reports, and you can bring them back.</p>

<dialog bind:this={addDialog} onclose={() => (adding = false)}>
  <form class="stack" onsubmit={add}>
    <h2>Add students</h2>
    <RosterInput bind:value={roster} />
    <div class="row">
      <span class="spacer"></span>
      <button type="button" class="btn btn-quiet" onclick={() => (adding = false)}>Cancel</button>
      <button class="btn btn-primary" disabled={parseRoster(roster).length === 0}>Add</button>
    </div>
  </form>
</dialog>

<dialog bind:this={editDialog} onclose={() => (editing = null)}>
  {#if editing}
    <form class="stack" onsubmit={save}>
      <h2>Edit student</h2>
      <label>First name <input bind:value={editing.firstName} /></label>
      <label>Last name <input bind:value={editing.lastName} /></label>
      <div class="row">
        <span class="spacer"></span>
        <button type="button" class="btn btn-quiet" onclick={() => (editing = null)}>Cancel</button>
        <button class="btn btn-primary">Save</button>
      </div>
    </form>
  {/if}
</dialog>

<ConfirmDialog
  open={!!removing}
  title="Remove {removing?.firstName ?? ''}?"
  message="They'll disappear from the class, but their taps stay in Reports. You can bring them back."
  confirm="Remove"
  danger
  onconfirm={() => removing && store.removeStudent(cls.id, removing.id)}
  onclose={() => (removing = null)}
/>

<style>
  /* The card's own edge closes the table; a rule here too would double it. */
  tbody tr:last-child td {
    border-bottom: 0;
  }

  .former td {
    color: var(--muted);
  }

  .badge {
    margin-left: 0.4rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: var(--surface-sunk);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .actions {
    width: 1%;
    text-align: right;
    white-space: nowrap;
  }

  /* Wide weeks scroll sideways inside the card rather than pushing the page. */
  .scroll {
    overflow-x: auto;
  }

  .key {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1rem;
    margin: -0.25rem 0 0;
    color: var(--muted);
  }

  .name {
    white-space: nowrap;
  }

  th.day,
  th.week {
    white-space: nowrap;
  }

  .date {
    color: var(--faint);
    font-weight: 600;
  }

  /* Today's column, lightly washed top to bottom. */
  .today {
    background: var(--accent-wash);
  }

  th.today,
  th.today .date {
    color: var(--accent);
  }

  .ahead {
    background: repeating-linear-gradient(135deg, transparent 0 6px, var(--surface-sunk) 6px 7px);
  }

  .week {
    border-left: 1px solid var(--border);
  }

  .chips {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .chip b {
    font-size: 0.78rem;
    font-weight: 800;
  }

  .absent,
  .absent-days {
    display: inline-block;
    padding: 0.1rem 0.5rem;
    border: 1px dashed var(--border-strong);
    border-radius: 999px;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .absent-days {
    margin-top: 0.25rem;
    border: 0;
    padding: 0;
  }

  .none {
    color: var(--border-strong);
  }
</style>
