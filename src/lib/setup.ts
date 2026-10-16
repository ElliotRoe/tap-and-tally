import type { Class, Id, LastShown } from "$lib/domain/types";

/**
 * The setup steps a Class goes through, which depend on the View it starts in. A Class
 * that sits in a room another Class already uses skips drawing one, and only the very
 * first Class ends by choosing what to track and a practice run.
 */
export function setupSteps(
  view: LastShown["view"] | null,
  drawRoom = true,
  practice = true,
): string[] {
  const room =
    view !== "room"
      ? []
      : drawRoom
        ? ["Room shape", "Draw your room", "Seats"]
        : ["Seats"];
  // Only the very first class ends by choosing what to track, then a practice tap.
  return [
    "Name & roster",
    "View",
    ...room,
    ...(practice ? ["What you track", "Practice"] : []),
  ];
}

/** True while setting up the teacher's very first Class: the one that gets a practice run. */
export function firstClass(classes: Class[], current?: string): boolean {
  return !setupExit(classes, current);
}

/** Where Cancel goes: the first other Class, if this isn't the teacher's only one. */
export function setupExit(
  classes: Class[],
  current?: string,
): string | undefined {
  const other = classes.find((c) => c.id !== current);
  return other ? `/class/${other.id}` : undefined;
}

/** A room another Class already uses, for a new Class to sit in too. */
export function sharedRoom(
  classes: Class[],
  current: string,
  roomExists: (id: Id) => boolean,
): Id | undefined {
  return classes
    .filter((c) => c.id !== current)
    .map((c) => c.lastShown.roomLayoutId)
    .find((id): id is Id => !!id && roomExists(id));
}

/** True while the Class's room is its own, drawn during this setup. */
export function drawsRoom(classes: Class[], cls: Class): boolean {
  const room = cls.lastShown.roomLayoutId;
  return !classes.some(
    (c) => c.id !== cls.id && room && c.lastShown.roomLayoutId === room,
  );
}
