<!--
  Choose the Grid View's order: by first or last name in either direction, or by hand.
  Dragging a tile switches to "My own order", starting from whatever order was showing.
-->
<script lang="ts">
  import { moveBefore, orderStudents } from "$lib/domain/students";
  import type { Class, GridOrder, Id } from "$lib/domain/types";
  import { dropTarget } from "$lib/stage";
  import Icon from "./Icon.svelte";
  import StudentTile from "./StudentTile.svelte";

  let {
    cls,
    order = $bindable(),
    customOrder = $bindable(),
  }: { cls: Class; order: GridOrder; customOrder: Id[] } = $props();

  const OPTIONS: { value: GridOrder; label: string }[] = [
    { value: "first-asc", label: "First name A–Z" },
    { value: "first-desc", label: "First name Z–A" },
    { value: "last-asc", label: "Last name A–Z" },
    { value: "last-desc", label: "Last name Z–A" },
    { value: "custom", label: "My own order" },
  ];

  const students = $derived(
    orderStudents(cls.students.filter((s) => !s.former), order, customOrder),
  );

  let dragging = $state<{ id: Id; dx: number; dy: number; x: number; y: number } | null>(null);

  function choose(value: GridOrder) {
    if (value === "custom" && order !== "custom") customOrder = students.map((s) => s.id);
    order = value;
  }

  function start(event: PointerEvent, id: Id) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging = { id, dx: 0, dy: 0, x: event.clientX, y: event.clientY };
  }

  function move(event: PointerEvent) {
    if (!dragging) return;
    dragging.dx = event.clientX - dragging.x;
    dragging.dy = event.clientY - dragging.y;
  }

  function end(event: PointerEvent) {
    if (!dragging) return;
    const target = dropTarget(event, "student")?.dataset.student;
    if (target && target !== dragging.id) {
      customOrder = moveBefore(students.map((s) => s.id), dragging.id, target);
      order = "custom";
    }
    dragging = null;
  }
</script>

<div class="options" role="radiogroup" aria-label="Order">
  {#each OPTIONS as option}
    <button
      type="button"
      role="radio"
      aria-checked={order === option.value}
      class="chip"
      class:on={order === option.value}
      onclick={() => choose(option.value)}>{option.label}</button
    >
  {/each}
</div>
<p class="muted small">Drag a tile onto another to put it just before that one.</p>

<div class="grid">
  {#each students as student (student.id)}
    <div
      class="cell"
      class:dragging={dragging?.id === student.id}
      data-student={student.id}
      role="button"
      tabindex="-1"
      aria-label="Move {student.firstName}"
      style={dragging?.id === student.id ? `transform: translate(${dragging.dx}px, ${dragging.dy}px)` : ""}
      onpointerdown={(e) => start(e, student.id)}
      onpointermove={move}
      onpointerup={end}
      onpointercancel={() => (dragging = null)}
    >
      {#if order === "custom"}<span class="grip"><Icon name="grip" size={18} weight={4} /></span>{/if}
      <StudentTile {student} />
    </div>
  {/each}
</div>

<style>
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    min-height: 38px;
    padding: 0.3rem 0.9rem;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    font-weight: 600;
  }

  .chip.on {
    border-color: var(--accent);
    background: var(--accent-wash);
    color: var(--accent-deep);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
    gap: 0.75rem;
  }

  .cell {
    position: relative;
    touch-action: none;
    cursor: grab;
  }

  /* Shown once the order is the teacher's own: these tiles can be dragged. */
  .grip {
    position: absolute;
    top: 6px;
    left: 5px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    color: var(--faint);
  }

  .cell:hover .grip {
    color: var(--accent);
    background: var(--accent-wash);
  }

  .cell.dragging {
    position: relative;
    z-index: 5;
    cursor: grabbing;
    opacity: 0.85;
  }
</style>
