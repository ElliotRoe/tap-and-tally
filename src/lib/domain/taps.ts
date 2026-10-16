import { dayKey } from "./days";
import type { Absence, Id, Tap } from "./types";

/** How many times a Student got a Behavior on one Day. A toggle is 0 or 1. */
export function countOn(
  taps: Tap[],
  student: Id,
  behavior: Id,
  day: string,
): number {
  return taps.filter(
    (t) =>
      t.student === student && t.behavior === behavior && dayKey(t.at) === day,
  ).length;
}

/** Every Tap a Student got on one Day, whatever the Behavior. */
export function totalOn(taps: Tap[], student: Id, day: string): number {
  return taps.filter((t) => t.student === student && dayKey(t.at) === day)
    .length;
}

/** Drops the most recent Tap matching a Student and Behavior on one Day. */
export function withoutLatest(
  taps: Tap[],
  student: Id,
  behavior: Id,
  day: string,
): Tap[] {
  let latest = -1;
  taps.forEach((t, i) => {
    if (
      t.student !== student ||
      t.behavior !== behavior ||
      dayKey(t.at) !== day
    )
      return;
    if (latest === -1 || t.at >= taps[latest].at) latest = i;
  });
  return latest === -1 ? taps : taps.filter((_, i) => i !== latest);
}

export function isAbsent(
  absences: Absence[],
  student: Id,
  day: string,
): boolean {
  return absences.some((a) => a.student === student && a.day === day);
}

/**
 * The Taps after one more tap. A toggling Behavior that is already on today is turned
 * off instead of counted again.
 */
export function afterTap(
  taps: Tap[],
  student: Id,
  behavior: Id,
  mode: "count" | "toggle",
  now: number,
): Tap[] {
  const today = dayKey(now);
  if (mode === "toggle" && countOn(taps, student, behavior, today) > 0) {
    return withoutLatest(taps, student, behavior, today);
  }
  return [...taps, { student, behavior, at: now }];
}
