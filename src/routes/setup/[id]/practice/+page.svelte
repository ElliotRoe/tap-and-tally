<!--
  Setup's last step, a practice tap: one student, drawn the way the class will look (a
  grid tile, or at their desk), to tap and track something on. Nothing tapped here is
  kept. Once they've tracked something, they're good to go to their class.
-->
<script lang="ts">
  import { page } from "$app/state";
  import SetupFrame from "$lib/components/SetupFrame.svelte";
  import StudentTile from "$lib/components/StudentTile.svelte";
  import TapBox from "$lib/components/TapBox.svelte";
  import { dayKey } from "$lib/domain/days";
  import { activeBehaviors } from "$lib/domain/menus";
  import { shortName } from "$lib/domain/students";
  import type { Student } from "$lib/domain/types";
  import { hold } from "$lib/hold";
  import { drawsRoom, firstClass, setupExit, setupSteps } from "$lib/setup";
  import { store } from "$lib/store.svelte";
  import { PracticeTracker } from "$lib/tracker.svelte";

  const cls = $derived(store.findClass(page.params.id!)!);
  const first = $derived(firstClass(store.data.classes, cls.id));
  const menu = $derived(store.findMenu(cls.menuId));
  const steps = $derived(setupSteps(cls.lastShown.view, drawsRoom(store.data.classes, cls)));
  const atDesk = $derived(cls.lastShown.view === "room");
  const student = $derived(cls.students.find((s) => !s.former)!);

  const practice = new PracticeTracker(() => store.findMenu(store.findClass(page.params.id!)!.menuId));
  const today = dayKey();
  const todayTaps = $derived(practice.taps.filter((t) => dayKey(t.at) === today));
  const absent = $derived(practice.absences.some((a) => a.student === student?.id));

  let tapping = $state<Student | null>(null);
  let opened = $state(false);
  let markedAbsent = $state(false);
  /** What the speech bubble beside the box says: on/off items only get a word if there are any. */
  const hint = $derived.by(() => {
    const switches = activeBehaviors(menu).filter((b) => b.mode === "toggle");
    const tapWhat = `Tap what ${student.firstName} did.`;
    if (!switches.length) return tapWhat;
    const names = switches.map((b) => `${b.emoji} ${b.name}`).join(" and ");
    return `${tapWhat} ${names} ${switches.length === 1 ? "stays" : "stay"} on for the rest of the day; tap again to turn it off.`;
  });
  let flash = $state("");
  /** Done once something has been tracked and the box is closed again. */
  const tracked = $derived(practice.taps.length > 0);
  const done = $derived(tracked && !tapping);

  function toggleAbsent() {
    if (absent) practice.markPresent(student.id);
    else {
      practice.markAbsent(student.id);
      markedAbsent = true;
    }
    flash = absent ? "✓ Here" : "✓ Marked absent";
    setTimeout(() => (flash = ""), 1200);
  }
</script>

<SetupFrame
  {steps}
  current={steps.indexOf("Practice")}
  title={done ? "You're good to go" : "Let's practice"}
  back="/setup/{cls.id}/menu"
  exit={setupExit(store.data.classes, cls.id)}
  onboarding={first}
>
  <p class="intro">
    {#if done}
      That's all there is to it. In class you'll see everyone like this. Nothing you did here is kept.
    {:else}
      This is how {shortName(student)} will look in class. Give it a try; nothing here is kept.
    {/if}
  </p>

  <ol class="checklist">
    <li class:ticked={opened}>Tap {shortName(student)}</li>
    <li class:ticked={tracked}>Tap what they did</li>
    <li class:ticked={markedAbsent} class="optional">
      Hold {shortName(student)} to mark them absent <span class="muted">(hold again to undo)</span>
    </li>
  </ol>

  {#snippet actions()}
    {#if done}
      <a class="btn btn-primary" href="/class/{cls.id}">Go to {cls.name} →</a>
    {:else}
      <a class="btn btn-quiet" href="/class/{cls.id}">Skip</a>
    {/if}
  {/snippet}

  {#snippet aside()}
    <div class="stage">
      {#if !opened}<span class="bubble" aria-hidden="true">Tap me</span>{/if}
      <button
        class="practice"
        class:desk={atDesk}
        use:hold={{
          onTap: () => {
            opened = true;
            tapping = student;
          },
          onHold: toggleAbsent,
        }}
        aria-label="{shortName(student)}{absent ? ', absent' : ''}"
      >
        <StudentTile
          {student}
          total={todayTaps.filter((t) => t.student === student.id).length}
          {absent}
          {flash}
          compact={atDesk}
        />
      </button>
    </div>
  {/snippet}
</SetupFrame>

<TapBox
  bind:student={tapping}
  {menu}
  tracker={practice}
  {todayTaps}
  hint={tracked ? "" : hint}
  onabsent={() => !absent && toggleAbsent()}
/>

<style>
  .checklist {
    display: grid;
    gap: 0.6rem;
    margin: 0.25rem 0 0.5rem;
    padding: 0;
    list-style: none;
    font-weight: 700;
  }

  .checklist li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  /* An empty circle that fills with a tick once that part is done. */
  .checklist li::before {
    content: "";
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex: none;
    border: 2px solid var(--border-strong);
    border-radius: 50%;
    font-size: 0.8rem;
    color: #fff;
    transition: background 0.2s;
  }

  .checklist li.ticked::before {
    content: "✓";
    border-color: var(--accent);
    background: var(--accent);
  }

  .checklist li.optional:not(.ticked)::before {
    border-style: dashed;
  }

  .checklist .muted {
    font-weight: 600;
  }

  .stage {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 320px;
  }

  .practice {
    width: 220px;
    height: 220px;
    padding: 0;
    border: 0;
    background: none;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .practice :global(.tile) {
    font-size: 1.4rem;
  }

  /* At a desk: the square, flat desk colour the room view uses. */
  .practice.desk {
    padding: 0;
    background: #f3e2cb;
  }

  .practice :global(.compact .letters) {
    font-size: 2.6rem;
  }

  .bubble {
    position: absolute;
    top: calc(50% - 160px);
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-weight: 800;
    animation: bob 1.4s ease-in-out infinite;
  }

  .bubble::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -6px;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    background: var(--accent);
    rotate: 45deg;
  }

  @keyframes bob {
    50% {
      translate: 0 -5px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bubble {
      animation: none;
    }
  }
</style>
