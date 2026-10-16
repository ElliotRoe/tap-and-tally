import { SEAT_HEIGHT, SEAT_WIDTH, type Class, type Data } from "./types";

export function emptyData(): Data {
  return {
    classes: [],
    roomLayouts: [],
    menus: [],
    taps: [],
    absences: [],
    lastBackupAt: null,
    lastClassId: null,
  };
}

/** Reads saved or restored data, filling in anything missing. Returns null if it isn't ours. */
export function readData(text: string): Data | null {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.classes))
      return null;
    return upgrade({ ...emptyData(), ...parsed });
  } catch {
    return null;
  }
}

/**
 * Brings data saved by earlier versions up to date: Classes that stored their own View
 * and a single seating, desks with no size or rotation of their own, and rooms that
 * still carry a board and a door (rooms are desks only now).
 */
function upgrade(data: any): Data {
  for (const layout of data.roomLayouts) {
    for (const seat of layout.seats) {
      seat.w ??= SEAT_WIDTH;
      seat.h ??= SEAT_HEIGHT;
      seat.rotation ??= 0;
    }
    delete layout.anchors;
  }
  data.classes = data.classes.map((old: Record<string, unknown>): Class => {
    if (old.lastShown) return old as unknown as Class;
    const roomLayoutId = (old.roomLayoutId as string | null) ?? null;
    return {
      id: old.id as string,
      name: old.name as string,
      students: old.students as Class["students"],
      menuId: old.menuId as string,
      lastShown: {
        view: (old.view as "grid" | "room") ?? "grid",
        gridOrder:
          (old.gridOrder as Class["lastShown"]["gridOrder"]) ?? "first-asc",
        customOrder: (old.customOrder as string[]) ?? [],
        roomLayoutId,
      },
      seatings: roomLayoutId
        ? { [roomLayoutId]: (old.seating as Record<string, string>) ?? {} }
        : {},
    };
  });
  return data as Data;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Time to nudge for a Backup: there are Taps, and a week has passed since the last one. */
export function backupDue(data: Data, now = Date.now()): boolean {
  if (data.taps.length === 0) return false;
  // Taps are saved in the order they happen, so the first is the oldest.
  const since = data.lastBackupAt ?? data.taps[0].at;
  return now - since >= WEEK;
}
