<!--
  Two cards, Grid View and Room View, each with a small drawing of that view made from
  the Class's own initials, so the teacher sees their own class either way.
-->
<script lang="ts">
  import { initials, orderStudents } from "$lib/domain/students";
  import type { Class, LastShown } from "$lib/domain/types";

  let { cls, value = $bindable() }: { cls: Class; value: LastShown["view"] } = $props();

  const letters = $derived(
    orderStudents(cls.students.filter((s) => !s.former), "first-asc").map(initials),
  );
  /** Pads short rosters so the drawings never look empty. */
  const sample = (n: number) => Array.from({ length: n }, (_, i) => letters[i] ?? "");
</script>

<div class="choices" role="radiogroup" aria-label="How students are shown">
  <button
    type="button"
    role="radio"
    aria-checked={value === "grid"}
    class="choice"
    class:on={value === "grid"}
    onclick={() => (value = "grid")}
  >
    <svg class="thumb" viewBox="0 0 280 168" aria-hidden="true">
      {#each sample(12) as text, i}
        {@const x = 16 + (i % 4) * 63}
        {@const y = 16 + Math.floor(i / 4) * 47}
        <rect {x} {y} width="55" height="39" rx="8" fill="#fffdf9" stroke={text ? "#d9bfa0" : "#ecdcc6"} />
        <text x={x + 27.5} y={y + 25} text-anchor="middle" class="initials">{text}</text>
      {/each}
    </svg>
    <span class="label"><span class="radio"></span>Grid</span>
    <span class="muted small">A tile for every student, in the order you choose.</span>
  </button>

  <button
    type="button"
    role="radio"
    aria-checked={value === "room"}
    class="choice"
    class:on={value === "room"}
    onclick={() => (value = "room")}
  >
    <svg class="thumb" viewBox="0 0 280 168" aria-hidden="true">
      <!-- Desks pushed together in groups of four, the way most classrooms run. -->
      {#each sample(24) as text, i}
        {@const pod = Math.floor(i / 4)}
        {@const seat = i % 4}
        {@const x = 34 + (pod % 3) * 80 + (seat % 2) * 24}
        {@const y = 29 + Math.floor(pod / 3) * 62 + Math.floor(seat / 2) * 24}
        <rect {x} {y} width="23" height="23" fill="#f3e2cb" stroke="#c9a985" />
        <text x={x + 11.5} y={y + 15} text-anchor="middle" class="initials desk-text">{text}</text>
      {/each}
    </svg>
    <span class="label"><span class="radio"></span>Room</span>
    <span class="muted small">Desks laid out like your real room, with each student in their seat.</span>
  </button>
</div>

<style>
  .choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .choice {
    display: grid;
    gap: 0.35rem;
    padding: 0.75rem 0.75rem 1rem;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow);
    transition: border-color 0.12s, box-shadow 0.12s;
  }

  .choice:hover {
    border-color: var(--border-strong);
  }

  .choice.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash), var(--shadow);
  }

  .thumb {
    display: block;
    width: 100%;
    height: auto;
    margin-bottom: 0.4rem;
    border-radius: 10px;
    background: var(--surface-sunk);
  }

  .initials {
    font: 800 15px var(--sans);
    fill: var(--text);
  }

  .desk-text {
    font-size: 8px;
  }


  .label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 800;
    font-size: 1.05rem;
  }

  .radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border-strong);
  }

  .on .radio {
    border: 5px solid var(--accent);
  }
</style>
