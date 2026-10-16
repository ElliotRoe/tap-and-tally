<!--
  A Class as it looks in Live Mode: a Grid View or a Room View. Tap a student to open
  their Menu; hold to mark them absent (or present again). Records into whichever
  Tracker it is given, so the practice run can use it without keeping anything.
-->
<script lang="ts">
  import { dayKey } from "$lib/domain/days";
  import { orderStudents, shortName } from "$lib/domain/students";
  import type { Class, GridOrder, Id, Menu, RoomLayout, Student } from "$lib/domain/types";
  import { hold } from "$lib/hold";
  import { placedStyle, uprightStyle } from "$lib/stage";
  import type { Tracker } from "$lib/tracker.svelte";
  import RoomStage from "./RoomStage.svelte";
  import { cropOf } from "$lib/domain/room";
  import StudentTile from "./StudentTile.svelte";
  import TapBox from "./TapBox.svelte";

  let {
    cls,
    menu,
    tracker,
    view,
    order,
    customOrder,
    layout,
    seating,
    reserve = 200,
    pointTo = false,
    fill = false,
    ontap,
    tapHint = "",
    onboxclose,
  }: {
    cls: Class;
    menu: Menu | undefined;
    tracker: Tracker;
    view: "grid" | "room";
    order: GridOrder;
    customOrder: Id[];
    layout: RoomLayout | undefined;
    seating: Record<Id, Id>;
    /** Screen height kept free around the room, so it fits without scrolling. */
    reserve?: number;
    /** Point at the first student, for the practice run. */
    pointTo?: boolean;
    /** Make the room as large as the space around it allows. */
    fill?: boolean;
    ontap?: () => void;
    tapHint?: string;
    onboxclose?: () => void;
  } = $props();

  const students = $derived(cls.students.filter((s) => !s.former));
  const byId = $derived(new Map(students.map((s) => [s.id, s])));

  // "Today" moves on at midnight even if the screen stays open.
  let today = $state(dayKey());
  $effect(() => {
    const timer = setInterval(() => (today = dayKey()), 60_000);
    return () => clearInterval(timer);
  });
  const todayTaps = $derived(tracker.taps.filter((t) => dayKey(t.at) === today));
  const totals = $derived(
    todayTaps.reduce((map, t) => map.set(t.student, (map.get(t.student) ?? 0) + 1), new Map<Id, number>()),
  );
  const absentToday = $derived(
    new Set(tracker.absences.filter((a) => a.day === today).map((a) => a.student)),
  );

  const showRoom = $derived(view === "room" && !!layout);
  const ordered = $derived(orderStudents(students, order, customOrder));
  const seatedIds = $derived(new Set(Object.values(seating)));
  const unseated = $derived(
    showRoom ? orderStudents(students.filter((s) => !seatedIds.has(s.id)), "first-asc") : [],
  );
  const first = $derived(showRoom ? (byId.get(seating[layout!.seats[0]?.id]) ?? unseated[0]) : ordered[0]);

  let tapping = $state<Student | null>(null);
  let flashes = $state<Record<Id, string>>({});

  function flash(student: Student, text: string) {
    flashes = { ...flashes, [student.id]: text };
    setTimeout(() => {
      const { [student.id]: _, ...rest } = flashes;
      flashes = rest;
    }, 1200);
  }

  /** A completed hold: absent if they were here, here if they were absent. */
  function toggleAbsent(student: Student) {
    if (absentToday.has(student.id)) {
      tracker.markPresent(student.id);
      flash(student, "✓ Here");
    } else {
      tracker.markAbsent(student.id);
      flash(student, "✓ Marked absent");
    }
  }

  function handlers(student: Student) {
    return {
      onTap: () => {
        ontap?.();
        tapping = student;
      },
      onHold: () => toggleAbsent(student),
    };
  }
</script>

{#snippet tile(student: Student, compact = false)}
  <button
    class="tile-button"
    class:pointed={pointTo && student.id === first?.id}
    use:hold={handlers(student)}
    aria-label="{shortName(student)}{absentToday.has(student.id) ? ', absent' : ''}"
  >
    <StudentTile
      {student}
      total={totals.get(student.id) ?? 0}
      absent={absentToday.has(student.id)}
      flash={flashes[student.id]}
      {compact}
    />
    {#if pointTo && student.id === first?.id}
      <span class="pointer" aria-hidden="true">Tap a student to track something</span>
    {/if}
  </button>
{/snippet}

{#if showRoom && layout}
  <div class="room" class:fill>
    {#if unseated.length}
      <div class="unseated">
        <span class="small muted">Without a desk</span>
        {#each unseated as student (student.id)}
          <div class="unseated-tile">{@render tile(student, true)}</div>
        {/each}
      </div>
    {/if}
    <div class="room-area">
      <RoomStage {reserve} {fill} crop={cropOf(layout.seats)}>
      {#each layout.seats as seat (seat.id)}
        {@const student = byId.get(seating[seat.id])}
        <div class="box" style={placedStyle(seat)}>
          {#if student}
            <div style={uprightStyle(seat)}>{@render tile(student, true)}</div>
          {:else}<div class="empty-desk"></div>{/if}
        </div>
      {/each}
      </RoomStage>
    </div>
  </div>
{:else}
  <div class="grid">
    {#each ordered as student (student.id)}
      {@render tile(student)}
    {/each}
  </div>
{/if}

<TapBox
  bind:student={tapping}
  {menu}
  {tracker}
  {todayTaps}
  hint={tapHint}
  onclose={onboxclose}
  onabsent={(student) => {
    if (!absentToday.has(student.id)) toggleAbsent(student);
  }}
/>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .tile-button {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: none;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .tile-button:global([data-holding]) {
    transform: scale(0.97);
    transition: transform 0.15s;
  }

  .room {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    justify-content: center;
  }

  .room-area {
    flex: 1;
    display: grid;
    place-items: center;
  }

  /* Filling: the room takes every pixel the screen can spare, at the room's own shape. */
  .room.fill {
    height: 100%;
  }

  .fill .room-area {
    height: 100%;
    container-type: size;
  }

  /* Centred on the desk's edge, so empty desks pushed together share one dashed line. */
  .empty-desk {
    width: 100%;
    height: 100%;
    outline: 1px dashed var(--border-strong);
    outline-offset: -0.5px;
  }

  .unseated {
    display: grid;
    gap: 0.5rem;
    width: 96px;
    flex: none;
  }

  .unseated-tile {
    height: 64px;
  }

  /* The practice run's nudge: a pulsing ring and a label pointing at one student. */
  .pointed {
    z-index: 3;
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgb(180 83 42 / 0.45);
    }
    50% {
      box-shadow: 0 0 0 10px rgb(180 83 42 / 0);
    }
  }

  .pointer {
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-30%);
    z-index: 4;
    padding: 0.5rem 0.85rem;
    border-radius: 10px;
    background: var(--accent);
    color: #fffaf2;
    font-weight: 800;
    font-size: 0.9rem;
    white-space: nowrap;
    box-shadow: var(--shadow);
    pointer-events: none;
  }

  .pointer::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 30%;
    width: 12px;
    height: 12px;
    background: var(--accent);
    transform: rotate(45deg);
  }
</style>
