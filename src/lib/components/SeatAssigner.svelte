<!--
  Who sits where, for a Class in a Room Layout. Students without a desk wait in the list
  on the left; drag one onto a desk to seat them (whoever was there swaps places), or drag
  a seated student back to the list. Auto-assign seats everyone A–Z, front row first.
-->
<script lang="ts">
  import { autoSeat, seatStudent, shuffleSeat, unseat } from "$lib/domain/room";
  import { orderStudents } from "$lib/domain/students";
  import type { Id, RoomLayout, Student } from "$lib/domain/types";
  import { dropTarget, placedStyle, uprightStyle } from "$lib/stage";
  import Icon from "./Icon.svelte";
  import RoomStage from "./RoomStage.svelte";
  import { cropOf } from "$lib/domain/room";
  import StudentTile from "./StudentTile.svelte";

  let {
    layout,
    students,
    seating = $bindable(),
    reserve = 220,
  }: { layout: RoomLayout; students: Student[]; seating: Record<Id, Id>; reserve?: number } =
    $props();

  const byId = $derived(new Map(students.map((s) => [s.id, s])));
  const seated = $derived(new Set(Object.values(seating)));
  const waiting = $derived(orderStudents(students.filter((s) => !seated.has(s.id)), "first-asc"));

  /** The student being dragged, drawn as a floating copy that follows the pointer. */
  let dragging = $state<{ id: Id; x: number; y: number } | null>(null);
  const draggedStudent = $derived(dragging ? byId.get(dragging.id) : undefined);

  function start(event: PointerEvent, id: Id) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging = { id, x: event.clientX, y: event.clientY };
  }

  function move(event: PointerEvent) {
    if (!dragging) return;
    dragging.x = event.clientX;
    dragging.y = event.clientY;
  }

  function end(event: PointerEvent) {
    if (!dragging) return;
    const target = dropTarget(event, "drop");
    if (target?.dataset.drop === "list") seating = unseat(seating, dragging.id);
    else if (target) seating = seatStudent(seating, dragging.id, target.dataset.drop!);
    dragging = null;
  }

</script>

<div class="assigner">
  <aside class="list" data-drop="list">
    <div class="list-head">
      <h2>Waiting for a desk</h2>
      <span class="count">{waiting.length}</span>
    </div>
    <div class="actions">
      <button type="button" class="btn btn-small" onclick={() => (seating = autoSeat(students, layout.seats))}>
        Auto-assign
      </button>
      <button type="button" class="btn btn-small" onclick={() => (seating = shuffleSeat(students, layout.seats))}>
        <Icon name="shuffle" size={15} /> Shuffle
      </button>
      <button type="button" class="btn btn-small btn-quiet" onclick={() => (seating = {})}>Clear</button>
    </div>
    <ul>
      {#each waiting as student (student.id)}
        <li
          class="waiting"
          class:dragging={dragging?.id === student.id}
          onpointerdown={(e) => start(e, student.id)}
          onpointermove={move}
          onpointerup={end}
        >
          <span class="initials">{student.firstName[0]}{student.lastName[0] ?? ""}</span>
          {student.firstName}
          {student.lastName}
        </li>
      {:else}
        <li class="done muted small">Everyone has a desk.</li>
      {/each}
    </ul>
    <p class="hint muted small">Drag a student onto a desk. Drop them on someone to swap.</p>
  </aside>

  <RoomStage {reserve} crop={cropOf(layout.seats)}>
    {#each layout.seats as seat (seat.id)}
      {@const student = byId.get(seating[seat.id])}
      <div class="box desk" class:taken={!!student} data-drop={seat.id} style={placedStyle(seat)}>
        {#if student}
          <div
            class="mover"
            style={uprightStyle(seat)}
            class:dragging={dragging?.id === student.id}
            onpointerdown={(e) => start(e, student.id)}
            onpointermove={move}
            onpointerup={end}
            role="button"
            tabindex="-1"
          >
            <StudentTile {student} compact />
          </div>
        {/if}
      </div>
    {/each}
  </RoomStage>
</div>

{#if dragging && draggedStudent}
  <div class="ghost" style="left: {dragging.x}px; top: {dragging.y}px">
    <StudentTile student={draggedStudent} compact />
  </div>
{/if}

<style>
  .assigner {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 1.25rem;
    align-items: start;
    width: 100%;
  }

  .list {
    display: grid;
    gap: 0.75rem;
    max-height: calc(100dvh - 180px);
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: var(--shadow);
    overflow: hidden;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
  }

  .list-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .list-head h2 {
    flex: 1;
    margin: 0;
    font-size: 1rem;
  }

  .count {
    padding: 0.05rem 0.6rem;
    border-radius: 999px;
    background: var(--accent-wash);
    color: var(--accent-deep);
    font-weight: 800;
    font-size: 0.85rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
    display: grid;
    gap: 0.35rem;
    align-content: start;
  }

  .waiting {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    font-weight: 700;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .initials {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 1px solid #c9a985;
    border-radius: 2px;
    background: #f3e2cb;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .dragging {
    opacity: 0.35;
  }

  .ghost {
    position: fixed;
    z-index: 50;
    width: 64px;
    height: 64px;
    margin: -32px 0 0 -32px;
    pointer-events: none;
    box-shadow: var(--shadow);
  }

  .done {
    padding: 0.5rem;
  }

  .hint {
    margin: 0;
  }

  /* An empty desk's dashed edge sits centred on its edge, so neighbours share one line;
     a filled desk shows only its student's tile. */
  .desk {
    outline: 1px dashed #c9a985;
    outline-offset: -0.5px;
    background: #faf1e4;
  }

  .desk.taken {
    outline: 0;
  }

  .mover {
    width: 100%;
    height: 100%;
    cursor: grab;
    touch-action: none;
  }
</style>
