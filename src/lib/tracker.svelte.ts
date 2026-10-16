import { dayKey } from "$lib/domain/days";
import { afterTap, withoutLatest } from "$lib/domain/taps";
import type { Absence, Id, Menu, Tap } from "$lib/domain/types";
import { store } from "$lib/store.svelte";

/** What Live Mode records into: the real store, or a practice run that is thrown away. */
export interface Tracker {
  readonly taps: Tap[];
  readonly absences: Absence[];
  tap(student: Id, behavior: Id): void;
  minusOne(student: Id, behavior: Id): void;
  markAbsent(student: Id): void;
  markPresent(student: Id): void;
}

/** Everything recorded for real, saved on this laptop. */
export const liveTracker: Tracker = {
  get taps() {
    return store.data.taps;
  },
  get absences() {
    return store.data.absences;
  },
  tap: (student, behavior) => store.tap(student, behavior),
  minusOne: (student, behavior) => store.minusOne(student, behavior),
  markAbsent: (student) => store.markAbsent(student),
  markPresent: (student) => store.markPresent(student),
};

/** The setup's practice run: it behaves exactly like class, and none of it is kept. */
export class PracticeTracker implements Tracker {
  taps = $state<Tap[]>([]);
  absences = $state<Absence[]>([]);

  constructor(private menu: () => Menu | undefined) {}

  tap(student: Id, behavior: Id) {
    const mode =
      this.menu()?.behaviors.find((b) => b.id === behavior)?.mode ?? "count";
    this.taps = afterTap(this.taps, student, behavior, mode, Date.now());
  }

  minusOne(student: Id, behavior: Id) {
    this.taps = withoutLatest(this.taps, student, behavior, dayKey());
  }

  markAbsent(student: Id) {
    this.absences = [...this.absences, { student, day: dayKey() }];
  }

  markPresent(student: Id) {
    const today = dayKey();
    this.absences = this.absences.filter(
      (a) => !(a.student === student && a.day === today),
    );
  }
}
