import { newId } from "./ids";
import { orderStudents } from "./students";
import {
  SEAT_HEIGHT,
  SEAT_WIDTH,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  type Id,
  type Placed,
  type RoomLayout,
  type Seat,
  type Student,
} from "./types";

/** The grid the room snaps to: the dots on the editor's floor. */
export const GRID = 10;
const snap = (n: number) => Math.round(n / GRID) * GRID;

/** Keeps a box of the given size inside the stage, snapped to the grid. */
export function place(x: number, y: number, w = SEAT_WIDTH, h = SEAT_HEIGHT) {
  return {
    x: Math.min(Math.max(snap(x), 0), STAGE_WIDTH - w),
    y: Math.min(Math.max(snap(y), 0), STAGE_HEIGHT - h),
  };
}

export function newSeat(x: number, y: number): Seat {
  return {
    id: newId(),
    ...place(x, y),
    w: SEAT_WIDTH,
    h: SEAT_HEIGHT,
    rotation: 0,
  };
}

export type StartingShape = "groups" | "rows" | "pairs" | "horseshoe";

export const STARTING_SHAPES: {
  value: StartingShape;
  label: string;
  hint: string;
}[] = [
  {
    value: "groups",
    label: "Groups of four",
    hint: "Desks pushed together in fours",
  },
  {
    value: "rows",
    label: "Rows",
    hint: "Single desks in rows facing the front",
  },
  { value: "pairs", label: "Pairs", hint: "Desks in twos, side by side" },
  {
    value: "horseshoe",
    label: "U-shape",
    hint: "Desks round three sides, open at the front",
  },
];

/** Where each shape puts its desks: top-left corners, front of the room first. */
function deskSpots(shape: StartingShape, count: number): [number, number][] {
  const top = 50;
  const bottom = STAGE_HEIGHT - 50;
  const spots: [number, number][] = [];

  if (shape === "groups") {
    const groups = Math.ceil(count / 4);
    const columns = Math.min(
      Math.max(Math.ceil(Math.sqrt(groups * 1.6)), 1),
      5,
    );
    const rows = Math.ceil(groups / columns);
    const size = SEAT_WIDTH * 2;
    const columnStep = (STAGE_WIDTH - 40) / columns;
    const rowStep = Math.min(
      size + 50,
      (bottom - top - size) / Math.max(rows - 1, 1),
    );
    for (let i = 0; i < count; i++) {
      const g = Math.floor(i / 4);
      const left = 20 + (g % columns) * columnStep + (columnStep - size) / 2;
      const groupTop = top + Math.floor(g / columns) * rowStep;
      spots.push([
        left + (i % 2) * SEAT_WIDTH,
        groupTop + (Math.floor(i / 2) % 2) * SEAT_HEIGHT,
      ]);
    }
  } else if (shape === "rows" || shape === "pairs") {
    const perUnit = shape === "pairs" ? 2 : 1;
    const unitWidth = SEAT_WIDTH * perUnit;
    const unitsPerRow = Math.max(
      Math.floor((STAGE_WIDTH - 40) / (unitWidth + (perUnit === 2 ? 60 : 40))),
      1,
    );
    const perRow = unitsPerRow * perUnit;
    const rows = Math.ceil(count / perRow);
    const columnStep = (STAGE_WIDTH - 40) / unitsPerRow;
    const rowStep = Math.min(
      SEAT_HEIGHT + 50,
      (bottom - top - SEAT_HEIGHT) / Math.max(rows - 1, 1),
    );
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / perRow);
      const inRow = i % perRow;
      const unit = Math.floor(inRow / perUnit);
      const left = 20 + unit * columnStep + (columnStep - unitWidth) / 2;
      spots.push([left + (inRow % perUnit) * SEAT_WIDTH, top + row * rowStep]);
    }
  } else {
    // Round the two sides and the back, shared out evenly, then a smaller U inside if needed.
    let left = count;
    for (let ring = 0; left > 0 && ring < 4; ring++) {
      const inset = ring * (SEAT_WIDTH + 40);
      const x0 = 30 + inset;
      const x1 = STAGE_WIDTH - 30 - SEAT_WIDTH - inset;
      const back = bottom - SEAT_HEIGHT - ring * (SEAT_HEIGHT + 30);
      const sideTop = top + ring * 30;
      const sideRoom = Math.floor((back - sideTop) / SEAT_HEIGHT);
      const backRoom = Math.floor((x1 - x0) / SEAT_WIDTH) + 1;
      const side = Math.min(sideRoom, Math.ceil(left / 3));
      const across = Math.min(backRoom, left - side * 2);
      const backStart = x0 + ((backRoom - across) * SEAT_WIDTH) / 2;
      for (let i = 0; i < side; i++)
        spots.push([x0, back - (side - i) * SEAT_HEIGHT]);
      for (let i = 0; i < across; i++)
        spots.push([backStart + i * SEAT_WIDTH, back]);
      for (let i = 0; i < side; i++)
        spots.push([x1, back - (i + 1) * SEAT_HEIGHT]);
      left = count - spots.length;
    }
  }
  return shape === "horseshoe"
    ? spots.slice(0, count)
    : centredDown(spots.slice(0, count));
}

/** Moves a block of desks up or down so it sits in the middle of the room. */
function centredDown(spots: [number, number][]): [number, number][] {
  const ys = spots.map(([, y]) => y);
  const height = Math.max(...ys) + SEAT_HEIGHT - Math.min(...ys);
  const shift = snap((STAGE_HEIGHT - height) / 2 - Math.min(...ys));
  return spots.map(([x, y]) => [x, y + shift]);
}

/**
 * A starting Room Layout: one desk per student in the chosen shape. Every desk moves
 * afterwards.
 */
export function startingRoom(
  seatCount: number,
  shape: StartingShape = "groups",
  name = "My Classroom",
): RoomLayout {
  const count = Math.max(seatCount, 1);
  return {
    id: newId(),
    name,
    seats: deskSpots(shape, count).map(([x, y]) => newSeat(x, y)),
  };
}

/** Seats front row first (nearest the top), left to right. */
export function frontToBack(seats: Seat[]): Seat[] {
  return [...seats].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Fills Seats alphabetically by first name, front row first. Extra students stay Unseated. */
export function autoSeat(students: Student[], seats: Seat[]): Record<Id, Id> {
  const seating: Record<Id, Id> = {};
  const ordered = orderStudents(students, "first-asc");
  frontToBack(seats).forEach((seat, i) => {
    if (ordered[i]) seating[seat.id] = ordered[i].id;
  });
  return seating;
}

/**
 * A random seating, for the Shuffle button. Desks are shuffled as well as students, so
 * when there are more desks than students, which desks stay empty changes too.
 */
export function shuffleSeat(
  students: Student[],
  seats: Seat[],
): Record<Id, Id> {
  const desks = shuffled(seats);
  const seating: Record<Id, Id> = {};
  shuffled(students).forEach((student, i) => {
    if (desks[i]) seating[desks[i].id] = student.id;
  });
  return seating;
}

function shuffled<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Puts a Student in a Seat. Whoever sat there moves to the Student's old Seat, or
 * becomes Unseated if the Student came from the list.
 */
export function seatStudent(
  seating: Record<Id, Id>,
  student: Id,
  seat: Id,
): Record<Id, Id> {
  const next = { ...seating };
  const from = Object.keys(next).find((s) => next[s] === student);
  const occupant = next[seat];
  if (from) delete next[from];
  if (from && occupant && occupant !== student) next[from] = occupant;
  next[seat] = student;
  return next;
}

export function unseat(seating: Record<Id, Id>, student: Id): Record<Id, Id> {
  return Object.fromEntries(
    Object.entries(seating).filter(([, s]) => s !== student),
  );
}

// Moving, resizing and turning things in the editor.

const MIN_SIZE = 20;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const turn = (x: number, y: number, degrees: number): [number, number] => {
  const r = radians(degrees);
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};
const square = (degrees: number) => ((degrees % 90) + 90) % 90 === 0;

/** Moves a box by a pointer offset, snapping its corner (or, when turned, its centre) to the grid. */
export function moveBox<T extends Placed>(start: T, dx: number, dy: number): T {
  if (square(start.rotation))
    return { ...start, ...place(start.x + dx, start.y + dy, start.w, start.h) };
  const cx = snap(start.x + start.w / 2 + dx);
  const cy = snap(start.y + start.h / 2 + dy);
  return { ...start, x: cx - start.w / 2, y: cy - start.h / 2 };
}

/**
 * Resizes a box by dragging one of its eight handles. `sx` and `sy` say which side the
 * handle is on (-1, 0 or 1). The opposite side stays put, even when the box is turned.
 */
export function resizeBox<T extends Placed>(
  start: T,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
): T {
  const [lx, ly] = turn(dx, dy, -start.rotation);
  let w = Math.max(MIN_SIZE, start.w + sx * lx);
  let h = Math.max(MIN_SIZE, start.h + sy * ly);
  if (square(start.rotation)) {
    w = Math.max(MIN_SIZE, snap(w));
    h = Math.max(MIN_SIZE, snap(h));
  }
  const [ox, oy] = turn(
    (sx * (w - start.w)) / 2,
    (sy * (h - start.h)) / 2,
    start.rotation,
  );
  const cx = start.x + start.w / 2 + ox;
  const cy = start.y + start.h / 2 + oy;
  return { ...start, w, h, x: cx - w / 2, y: cy - h / 2 };
}

/** Turns a box to face a pointer, snapping to 15° steps. */
export function rotateBox<T extends Placed>(
  start: T,
  px: number,
  py: number,
): T {
  const cx = start.x + start.w / 2;
  const cy = start.y + start.h / 2;
  const degrees = (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90;
  const snapped = Math.round(degrees / 15) * 15;
  return { ...start, rotation: ((snapped % 360) + 360) % 360 };
}

// Working on several desks at once.

export type Rect = { x: number; y: number; w: number; h: number };

/** The smallest upright box around every given box. */
export function boundsOf(boxes: Rect[]): Rect {
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** The ids of the boxes a dragged selection rectangle touches. */
export function boxesIn(area: Rect, boxes: Placed[]): Id[] {
  return boxes
    .filter(
      (b) =>
        b.x < area.x + area.w &&
        b.x + b.w > area.x &&
        b.y < area.y + area.h &&
        b.y + b.h > area.y,
    )
    .map((b) => b.id);
}

/**
 * Moves several boxes together. The group's corner snaps to the grid and the group stays
 * on the stage, so the desks keep their places relative to each other.
 */
export function moveBoxes<T extends Placed>(
  starts: T[],
  dx: number,
  dy: number,
): T[] {
  const group = boundsOf(starts);
  const to = place(group.x + dx, group.y + dy, group.w, group.h);
  return starts.map((s) => ({
    ...s,
    x: s.x + to.x - group.x,
    y: s.y + to.y - group.y,
  }));
}

/**
 * Resizes several boxes as one, by a handle on the box around them all: the opposite side
 * stays put and everything stretches with it, so desks pushed together stay together.
 */
export function resizeBoxes<T extends Placed>(
  starts: T[],
  sx: number,
  sy: number,
  dx: number,
  dy: number,
): T[] {
  const group = boundsOf(starts);
  const smallest = Math.min(...starts.map((s) => Math.min(s.w, s.h)));
  const least = MIN_SIZE / smallest;
  const fx = sx ? Math.max(least, snap(group.w + sx * dx) / group.w) : 1;
  const fy = sy ? Math.max(least, snap(group.h + sy * dy) / group.h) : 1;
  const fixedX = sx === -1 ? group.x + group.w : group.x;
  const fixedY = sy === -1 ? group.y + group.h : group.y;
  return starts.map((s) => {
    const w = s.w * fx;
    const h = s.h * fy;
    const cx = fixedX + (s.x + s.w / 2 - fixedX) * fx;
    const cy = fixedY + (s.y + s.h / 2 - fixedY) * fy;
    return { ...s, w, h, x: cx - w / 2, y: cy - h / 2 };
  });
}

/**
 * The part of the room worth showing once it's set: the smallest box round every desk
 * (turned desks included), with a little floor around it. A handful of desks still
 * shows a bit of room, so they don't fill the screen edge to edge.
 */
export function cropOf(
  seats: Placed[],
  pad = 30,
  least = { w: 320, h: 224 },
): Rect {
  if (!seats.length) return { x: 0, y: 0, w: STAGE_WIDTH, h: STAGE_HEIGHT };
  const extents = seats.map((s) => {
    const r = radians(s.rotation);
    const halfW =
      (s.w * Math.abs(Math.cos(r)) + s.h * Math.abs(Math.sin(r))) / 2;
    const halfH =
      (s.w * Math.abs(Math.sin(r)) + s.h * Math.abs(Math.cos(r))) / 2;
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    return { x: cx - halfW, y: cy - halfH, w: halfW * 2, h: halfH * 2 };
  });
  const box = boundsOf(extents);
  const w = Math.max(box.w + pad * 2, least.w);
  const h = Math.max(box.h + pad * 2, least.h);
  return { x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h };
}

/** Copies of some boxes with ids of their own, shifted together (snapped, on the stage). */
export function copiesOf<T extends Placed>(boxes: T[], dx = 0, dy = 0): T[] {
  return moveBoxes(boxes, dx, dy).map((b) => ({ ...b, id: newId() }));
}
