import { describe, expect, it } from "vitest";
import {
  autoSeat,
  boxesIn,
  copiesOf,
  cropOf,
  moveBoxes,
  resizeBoxes,
  frontToBack,
  moveBox,
  place,
  resizeBox,
  rotateBox,
  seatStudent,
  shuffleSeat,
  startingRoom,
  STARTING_SHAPES,
} from "./room";
import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  SEAT_HEIGHT,
  type Placed,
  type Student,
} from "./types";

const student = (id: string, firstName: string): Student => ({
  id,
  firstName,
  lastName: "",
});
const box = (over: Partial<Placed> = {}): Placed => ({
  id: "b",
  x: 100,
  y: 100,
  w: 100,
  h: 50,
  rotation: 0,
  ...over,
});

describe("startingRoom", () => {
  for (const { value } of STARTING_SHAPES) {
    it(`${value}: one desk per student, all on the stage`, () => {
      const room = startingRoom(30, value);
      expect(room.name).toBe("My Classroom");
      expect(room.seats).toHaveLength(30);
      for (const seat of room.seats) {
        expect(seat.x).toBeGreaterThanOrEqual(0);
        expect(seat.y).toBeGreaterThanOrEqual(0);
        expect(seat.x + seat.w).toBeLessThanOrEqual(STAGE_WIDTH);
        expect(seat.y + seat.h).toBeLessThanOrEqual(STAGE_HEIGHT);
      }
    });
  }

  it("never stacks two desks on the same spot", () => {
    for (const { value } of STARTING_SHAPES) {
      const spots = startingRoom(28, value).seats.map((s) => `${s.x},${s.y}`);
      expect(new Set(spots).size).toBe(spots.length);
    }
  });
});

describe("place", () => {
  it("snaps to the grid and keeps the box on the stage", () => {
    expect(place(14, 26)).toEqual({ x: 10, y: 30 });
    expect(place(-50, 9999)).toEqual({ x: 0, y: STAGE_HEIGHT - SEAT_HEIGHT });
  });
});

describe("moveBox", () => {
  it("snaps the corner of an upright box to the grid", () => {
    expect(moveBox(box(), 13, 27)).toMatchObject({ x: 110, y: 130 });
  });
});

describe("resizeBox", () => {
  it("keeps the opposite edge fixed when dragging the right edge", () => {
    const after = resizeBox(box(), 1, 0, 40, 999);
    expect(after).toMatchObject({ x: 100, y: 100, w: 140, h: 50 });
  });

  it("keeps the right edge fixed when dragging the left edge", () => {
    const after = resizeBox(box(), -1, 0, 30, 0);
    expect(after.x + after.w).toBe(200);
    expect(after.w).toBe(70);
  });

  it("never shrinks below a usable size", () => {
    expect(resizeBox(box(), 1, 1, -500, -500)).toMatchObject({ w: 20, h: 20 });
  });
});

describe("rotateBox", () => {
  it("turns to face the pointer in 15° steps", () => {
    const b = box();
    // Straight above the centre is 0°; straight to the right is 90°.
    expect(rotateBox(b, 150, 0).rotation).toBe(0);
    expect(rotateBox(b, 400, 128).rotation).toBe(90);
    expect(rotateBox(b, 400, 30).rotation).toBe(75);
  });
});

describe("autoSeat", () => {
  it("seats alphabetically, front row first, leaving extras unseated", () => {
    const room = startingRoom(2, "rows");
    const seating = autoSeat(
      [student("z", "Zed"), student("a", "Ana"), student("m", "Mo")],
      room.seats,
    );
    const [first, second] = frontToBack(room.seats);
    expect(seating).toEqual({ [first.id]: "a", [second.id]: "m" });
  });
});

describe("seatStudent", () => {
  it("swaps two seated students", () => {
    expect(seatStudent({ s1: "a", s2: "b" }, "a", "s2")).toEqual({
      s1: "b",
      s2: "a",
    });
  });

  it("bumps the occupant to the list when the student comes from the list", () => {
    expect(seatStudent({ s1: "a" }, "b", "s1")).toEqual({ s1: "b" });
  });
});

describe("several desks at once", () => {
  const pair = [
    box({ id: "a", x: 100, y: 100, w: 70, h: 70 }),
    box({ id: "b", x: 170, y: 100, w: 70, h: 70 }),
  ];

  it("selects the desks a dragged rectangle touches", () => {
    expect(boxesIn({ x: 150, y: 90, w: 10, h: 20 }, pair)).toEqual(["a"]);
    expect(boxesIn({ x: 0, y: 0, w: 500, h: 500 }, pair)).toEqual(["a", "b"]);
    expect(boxesIn({ x: 300, y: 300, w: 10, h: 10 }, pair)).toEqual([]);
  });

  it("moves them together, snapped and kept on the stage", () => {
    expect(moveBoxes(pair, 13, 0).map((b) => b.x)).toEqual([110, 180]);
    const pushed = moveBoxes(pair, 5000, 0);
    expect(pushed[1].x + pushed[1].w).toBe(STAGE_WIDTH);
    expect(pushed[1].x - pushed[0].x).toBe(70);
  });

  it("stretches them as one so touching desks keep touching", () => {
    const [a, b] = resizeBoxes(pair, 1, 0, 70, 0);
    expect(a).toMatchObject({ x: 100, w: 105 });
    expect(b.x).toBe(a.x + a.w);
    expect(b.x + b.w).toBe(310);
  });
});

describe("shuffleSeat", () => {
  it("uses every desk, not just the first ones, when there are spare desks", () => {
    const room = startingRoom(4, "rows");
    const used = new Set<string>();
    for (let i = 0; i < 200; i++) {
      Object.keys(
        shuffleSeat(
          [student("a", "Ana"), student("b", "Bo"), student("c", "Cy")],
          room.seats,
        ),
      ).forEach((seat) => used.add(seat));
    }
    expect(used.size).toBe(4);
  });
});

describe("cropOf", () => {
  it("frames the desks with a little floor round them", () => {
    const desks = [
      box({ id: "a", x: 100, y: 100, w: 200, h: 200 }),
      box({ id: "b", x: 400, y: 300, w: 100, h: 100 }),
    ];
    expect(cropOf(desks)).toEqual({ x: 70, y: 70, w: 460, h: 360 });
  });

  it("keeps a few desks from filling the screen", () => {
    const crop = cropOf([box({ id: "a", x: 100, y: 100, w: 70, h: 70 })]);
    expect(crop.w).toBe(320);
    expect(crop.x + crop.w / 2).toBe(135);
  });

  it("allows for turned desks", () => {
    const turned = cropOf(
      [box({ id: "a", x: 0, y: 0, w: 400, h: 100, rotation: 90 })],
      0,
      { w: 0, h: 0 },
    );
    expect(turned.w).toBeCloseTo(100);
    expect(turned.h).toBeCloseTo(400);
  });
});

describe("copiesOf", () => {
  it("makes new desks, shifted together, leaving the originals alone", () => {
    const pair = [
      box({ id: "a", x: 100, y: 100 }),
      box({ id: "b", x: 200, y: 100 }),
    ];
    const copies = copiesOf(pair, 20, 20);
    expect(copies.map((c) => [c.x, c.y])).toEqual([
      [120, 120],
      [220, 120],
    ]);
    expect(copies.map((c) => c.id)).not.toContain("a");
    expect(new Set(copies.map((c) => c.id)).size).toBe(2);
    expect(pair[0].x).toBe(100);
  });
});
