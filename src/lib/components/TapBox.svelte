<!--
  The box that opens when a student is tapped, sized for an iPad: the Class's Menu as
  big buttons, each with today's number and an icon for whether it counts every tap or
  is on or off for the day. Counts have a −1 for mistakes. Marking absent is a hold, so
  a stray tap can't do it. Tap outside or ✕ to close.
-->
<script lang="ts">
  import { activeBehaviors } from "$lib/domain/menus";
  import { fullName } from "$lib/domain/students";
  import type { Menu, Student, Tap } from "$lib/domain/types";
  import type { Tracker } from "$lib/tracker.svelte";
  import HoldButton from "./HoldButton.svelte";
  import Icon from "./Icon.svelte";

  let {
    student = $bindable(),
    menu,
    tracker,
    todayTaps,
    onabsent,
    hint = "",
    onclose,
  }: {
    student: Student | null;
    menu: Menu | undefined;
    tracker: Tracker;
    todayTaps: Tap[];
    onabsent: (student: Student) => void;
    /** A line of guidance under the name, for the practice run. */
    hint?: string;
    onclose?: () => void;
  } = $props();

  let dialog = $state<HTMLDialogElement>();
  const behaviors = $derived(activeBehaviors(menu));
  const count = (behavior: string) =>
    todayTaps.filter((t) => t.student === student?.id && t.behavior === behavior).length;

  $effect(() => {
    if (student && !dialog?.open) dialog?.showModal();
    if (!student && dialog?.open) dialog.close();
  });

  // A click on the backdrop lands on the dialog itself, outside its content.
  function outside(event: MouseEvent) {
    if (event.target === dialog) student = null;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  onclose={() => {
    student = null;
    onclose?.();
  }}
  onclick={outside}
>
  {#if student}
    <div class="head">
      <h2>{fullName(student)}</h2>
      <button class="btn btn-quiet close" aria-label="Close" onclick={() => (student = null)}><Icon name="close" size={22} /></button>
    </div>
    {#if hint}<p class="hint" role="note">{hint}</p>{/if}
    <div class="buttons">
      {#each behaviors as behavior (behavior.id)}
        {@const n = count(behavior.id)}
        {@const toggle = behavior.mode === "toggle"}
        <div class="item" style="--chip: {behavior.color}">
          <button class="tap" class:on={toggle && n > 0} onclick={() => tracker.tap(student!.id, behavior.id)}>
            <span class="emoji">{behavior.emoji}</span>
            <span class="label">
              {behavior.name}
              <span class="kind"><Icon name={toggle ? "toggle" : "count"} size={13} />{toggle ? "On or off today" : "Counts every tap"}</span>
            </span>
            <span class="n">{toggle ? (n > 0 ? "On" : "Off") : n}</span>
          </button>
          {#if !toggle && n > 0}
            <button class="minus" aria-label="Take one {behavior.name} back" onclick={() => tracker.minusOne(student!.id, behavior.id)}>−1</button>
          {/if}
        </div>
      {/each}
    </div>
    <div class="absent">
      <HoldButton
        onhold={() => {
          const who = student!;
          student = null;
          onabsent(who);
        }}>Hold to mark {student.firstName} absent</HoldButton
      >
    </div>
  {/if}
</dialog>

<style>
  dialog {
    max-width: min(640px, calc(100vw - 2rem));
    padding: 1.75rem;
    overflow: visible;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .head h2 {
    flex: 1;
    margin: 0;
    font-size: 1.6rem;
  }

  .close {
    width: 48px;
    height: 48px;
    padding: 0;
  }

  /* Guidance for the practice run: a speech bubble beside the box, pointing at it,
     rather than a line inside it. Under the box on a narrow screen. */
  .hint {
    position: absolute;
    left: calc(100% + 18px);
    top: 1.5rem;
    width: 220px;
    margin: 0;
    padding: 0.75rem 0.9rem;
    border-radius: 14px;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    line-height: 1.4;
    box-shadow: var(--shadow);
  }

  .hint::before {
    content: "";
    position: absolute;
    left: -7px;
    top: 1.1rem;
    width: 14px;
    height: 14px;
    background: var(--accent);
    rotate: 45deg;
  }

  @media (max-width: 1000px) {
    .hint {
      left: 1.75rem;
      right: 1.75rem;
      top: calc(100% + 14px);
      width: auto;
    }

    .hint::before {
      left: 1.5rem;
      top: -7px;
    }
  }

  .buttons {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .item {
    display: flex;
    gap: 0.6rem;
  }

  .tap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 84px;
    padding: 0.75rem 1.25rem;
    border: 0;
    border-radius: 14px;
    background: var(--chip);
    font-weight: 800;
    font-size: 1.25rem;
    text-align: left;
    transition: transform 0.08s;
  }

  .tap:active {
    transform: scale(0.98);
  }

  .tap.on {
    box-shadow: inset 0 0 0 3px var(--accent);
  }

  .emoji {
    font-size: 2.1rem;
  }

  .label {
    flex: 1;
    display: grid;
    gap: 0.15rem;
  }

  .kind {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: rgb(46 34 25 / 0.6);
  }

  .n {
    min-width: 3.25rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: var(--surface);
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .minus {
    width: 72px;
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    background: var(--surface);
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--muted);
  }

  .absent {
    margin-top: 1rem;
  }
</style>
