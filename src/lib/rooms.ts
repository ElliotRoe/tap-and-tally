import { startingRoom, type StartingShape } from "$lib/domain/room";
import type { Id } from "$lib/domain/types";
import { store } from "$lib/store.svelte";

/** "My Classroom", or "My Classroom 2" and so on if that name is taken. */
export function freshRoomName(): string {
  const taken = new Set(store.data.roomLayouts.map((r) => r.name));
  if (!taken.has("My Classroom")) return "My Classroom";
  let n = 2;
  while (taken.has(`My Classroom ${n}`)) n++;
  return `My Classroom ${n}`;
}

/** Makes a new Room Layout in a starting shape, sized for a class if there is one. */
export function createRoom(shape: StartingShape, classId?: Id | null): Id {
  const cls = classId ? store.findClass(classId) : undefined;
  const count = cls ? cls.students.filter((s) => !s.former).length : 24;
  const id = store.addRoomLayout(startingRoom(count, shape, freshRoomName()));
  if (cls) store.showClass(cls.id, { view: "room", roomLayoutId: id });
  return id;
}
