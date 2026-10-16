// The shapes of everything Tap & Tally keeps. Words follow CONTEXT.md.

export type Id = string;

export type Student = {
  id: Id;
  firstName: string;
  lastName: string;
  /** A Former Student: hidden while teaching, kept in the history. */
  former?: boolean;
};

export type GridOrder =
  "first-asc" | "first-desc" | "last-asc" | "last-desc" | "custom";

/** How a Class was last shown in Live Mode, so it reopens the same way. Not a setting. */
export type LastShown = {
  view: "grid" | "room";
  gridOrder: GridOrder;
  /** Student ids in the order dragged by hand, used when gridOrder is "custom". */
  customOrder: Id[];
  roomLayoutId: Id | null;
};

export type Class = {
  id: Id;
  name: string;
  students: Student[];
  menuId: Id;
  lastShown: LastShown;
  /** Assignments: for each Room Layout this Class has been shown in, Seat id → Student id. */
  seatings: Record<Id, Record<Id, Id>>;
};

/**
 * Something placed in a Room Layout. Positions and sizes are in stage units (the stage is
 * STAGE_WIDTH × STAGE_HEIGHT); x and y are the top-left corner before rotation, and the
 * rotation, in degrees, turns it about its centre.
 */
export type Placed = {
  id: Id;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
};

export type Seat = Placed;

export type RoomLayout = {
  id: Id;
  name: string;
  seats: Seat[];
};

export type BehaviorMode = "count" | "toggle";

export type Behavior = {
  id: Id;
  name: string;
  emoji: string;
  color: string;
  mode: BehaviorMode;
  /** Removed from its Menu but kept so old Taps still have a name in Reports. */
  removed?: boolean;
};

export type Menu = { id: Id; name: string; behaviors: Behavior[] };

/** One Tap: which Student, which Behavior, and when (epoch milliseconds). */
export type Tap = { student: Id; behavior: Id; at: number };

/** One Absence: a Student not in the room on one Day ("YYYY-MM-DD"). */
export type Absence = { student: Id; day: string };

export type Data = {
  classes: Class[];
  roomLayouts: RoomLayout[];
  menus: Menu[];
  taps: Tap[];
  absences: Absence[];
  lastBackupAt: number | null;
  /** The Class Start class opens: the one most recently used. */
  lastClassId: Id | null;
};

export const STAGE_WIDTH = 1000;
export const STAGE_HEIGHT = 700;
export const SEAT_WIDTH = 70;
export const SEAT_HEIGHT = 70;
