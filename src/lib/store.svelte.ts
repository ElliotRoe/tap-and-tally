import { browser } from "$app/environment";
import { emptyData, readData } from "$lib/domain/backup";
import { dayKey } from "$lib/domain/days";
import { newId } from "$lib/domain/ids";
import { defaultMenu } from "$lib/domain/menus";
import { autoSeat } from "$lib/domain/room";
import { parseRoster } from "$lib/domain/students";
import { afterTap, withoutLatest } from "$lib/domain/taps";
import type {
  Class,
  Data,
  Id,
  LastShown,
  Menu,
  RoomLayout,
  Student,
} from "$lib/domain/types";

const KEY = "tap-and-tally";

function load(): Data {
  if (!browser) return emptyData();
  try {
    return readData(localStorage.getItem(KEY) ?? "") ?? emptyData();
  } catch {
    return emptyData();
  }
}

/** Everything the app knows, kept in this browser. Every change saves straight away. */
class Store {
  data = $state<Data>(load());
  /** Set when the browser refuses to save, so the app can say so. */
  saveFailed = $state(false);

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(this.data)));
      this.saveFailed = false;
    } catch {
      this.saveFailed = true;
    }
  }

  // Classes

  findClass(id: Id): Class | undefined {
    return this.data.classes.find((c) => c.id === id);
  }

  /** Creates a Class from pasted names. It will open on a Grid View with the first Menu. */
  addClass(name: string, roster: string): Id {
    if (this.data.menus.length === 0) this.data.menus.push(defaultMenu());
    const cls: Class = {
      id: newId(),
      name: name.trim(),
      students: this.studentsFrom(roster),
      menuId: this.data.menus[0].id,
      lastShown: {
        view: "grid",
        gridOrder: "first-asc",
        customOrder: [],
        roomLayoutId: null,
      },
      seatings: {},
    };
    this.data.classes.push(cls);
    this.data.lastClassId = cls.id;
    this.save();
    return cls.id;
  }

  /** The Class Start class opens: the one most recently used, or the first. */
  get startClass(): Class | undefined {
    return this.findClass(this.data.lastClassId ?? "") ?? this.data.classes[0];
  }

  /** Remembers how a Class was shown in Live Mode, so it reopens the same way. */
  showClass(id: Id, change: Partial<LastShown> = {}) {
    const cls = this.findClass(id);
    if (!cls) return;
    Object.assign(cls.lastShown, change);
    this.data.lastClassId = id;
    this.save();
  }

  /**
   * Who sits where for a Class in a Room Layout. The first time a Class is shown in a
   * room, it is seated A–Z, front row first.
   */
  seatingFor(classId: Id, layoutId: Id): Record<Id, Id> {
    const cls = this.findClass(classId);
    const layout = this.findRoomLayout(layoutId);
    if (!cls || !layout) return {};
    if (!cls.seatings[layoutId]) {
      cls.seatings[layoutId] = autoSeat(
        cls.students.filter((s) => !s.former),
        layout.seats,
      );
      this.save();
    }
    return cls.seatings[layoutId];
  }

  setSeating(classId: Id, layoutId: Id, seating: Record<Id, Id>) {
    const cls = this.findClass(classId);
    if (!cls) return;
    cls.seatings[layoutId] = seating;
    this.save();
  }

  updateClass(id: Id, change: Partial<Class>) {
    const cls = this.findClass(id);
    if (!cls) return;
    Object.assign(cls, change);
    this.save();
  }

  /** Deletes a Class and every Tap and Absence of its Students. */
  deleteClass(id: Id) {
    const cls = this.findClass(id);
    if (!cls) return;
    const ids = new Set(cls.students.map((s) => s.id));
    this.data.classes = this.data.classes.filter((c) => c.id !== id);
    this.data.taps = this.data.taps.filter((t) => !ids.has(t.student));
    this.data.absences = this.data.absences.filter((a) => !ids.has(a.student));
    this.save();
  }

  // Students

  private studentsFrom(roster: string): Student[] {
    return parseRoster(roster).map((name) => ({ id: newId(), ...name }));
  }

  addStudents(classId: Id, roster: string) {
    const cls = this.findClass(classId);
    if (!cls) return;
    const added = this.studentsFrom(roster);
    cls.students.push(...added);
    if (cls.lastShown.gridOrder === "custom")
      cls.lastShown.customOrder.push(...added.map((s) => s.id));
    this.save();
  }

  /** Swaps in a fresh roster during setup, before anyone has been tapped. */
  replaceRoster(classId: Id, roster: string) {
    const cls = this.findClass(classId);
    if (!cls) return;
    cls.students = this.studentsFrom(roster);
    cls.lastShown.customOrder = [];
    cls.seatings = {};
    this.save();
  }

  updateStudent(classId: Id, studentId: Id, change: Partial<Student>) {
    const student = this.findClass(classId)?.students.find(
      (s) => s.id === studentId,
    );
    if (!student) return;
    Object.assign(student, change);
    this.save();
  }

  /** Makes a Former Student: off the Grid and out of their Seat, history kept. */
  removeStudent(classId: Id, studentId: Id) {
    const cls = this.findClass(classId);
    if (!cls) return;
    for (const [layout, seating] of Object.entries(cls.seatings)) {
      cls.seatings[layout] = Object.fromEntries(
        Object.entries(seating).filter(([, s]) => s !== studentId),
      );
    }
    this.updateStudent(classId, studentId, { former: true });
  }

  // Room Layouts

  findRoomLayout(id: Id | null): RoomLayout | undefined {
    return this.data.roomLayouts.find((r) => r.id === id);
  }

  addRoomLayout(layout: RoomLayout): Id {
    this.data.roomLayouts.push(layout);
    this.save();
    return layout.id;
  }

  updateRoomLayout(id: Id, change: Partial<RoomLayout>) {
    const layout = this.findRoomLayout(id);
    if (!layout) return;
    Object.assign(layout, change);
    // A Seat that is gone can't hold anyone, in any Class seated in this Room Layout.
    const seatIds = new Set(layout.seats.map((s) => s.id));
    for (const cls of this.classesSeatedIn(id)) {
      cls.seatings[id] = Object.fromEntries(
        Object.entries(cls.seatings[id]).filter(([seat]) => seatIds.has(seat)),
      );
    }
    this.save();
  }

  /** Deletes a Room Layout and every Class's seating in it. */
  deleteRoomLayout(id: Id) {
    this.data.roomLayouts = this.data.roomLayouts.filter((r) => r.id !== id);
    for (const cls of this.data.classes) {
      delete cls.seatings[id];
      if (cls.lastShown.roomLayoutId === id) {
        cls.lastShown.roomLayoutId = this.data.roomLayouts[0]?.id ?? null;
        if (!cls.lastShown.roomLayoutId) cls.lastShown.view = "grid";
      }
    }
    this.save();
  }

  /** The Classes that have a seating in a Room Layout. */
  classesSeatedIn(id: Id): Class[] {
    return this.data.classes.filter((c) => c.seatings[id]);
  }

  // Menus

  findMenu(id: Id): Menu | undefined {
    return this.data.menus.find((m) => m.id === id);
  }

  addMenu(menu: Menu): Id {
    this.data.menus.push(menu);
    this.save();
    return menu.id;
  }

  updateMenu(id: Id, change: Partial<Menu>) {
    const menu = this.findMenu(id);
    if (!menu) return;
    Object.assign(menu, change);
    this.save();
  }

  deleteMenu(id: Id) {
    if (this.classesUsingMenu(id).length) return;
    this.data.menus = this.data.menus.filter((m) => m.id !== id);
    this.save();
  }

  classesUsingMenu(id: Id): Class[] {
    return this.data.classes.filter((c) => c.menuId === id);
  }

  // Taps and Absences

  /** Records a Tap. A toggling Behavior that is already on today is turned off instead. */
  tap(student: Id, behavior: Id) {
    const mode =
      this.data.menus.flatMap((m) => m.behaviors).find((b) => b.id === behavior)
        ?.mode ?? "count";
    this.data.taps = afterTap(
      this.data.taps,
      student,
      behavior,
      mode,
      Date.now(),
    );
    this.save();
  }

  /** Takes back today's most recent Tap of one Behavior: the −1 button. */
  minusOne(student: Id, behavior: Id) {
    this.data.taps = withoutLatest(this.data.taps, student, behavior, dayKey());
    this.save();
  }

  markAbsent(student: Id) {
    this.data.absences.push({ student, day: dayKey() });
    this.save();
  }

  markPresent(student: Id) {
    const today = dayKey();
    this.data.absences = this.data.absences.filter(
      (a) => !(a.student === student && a.day === today),
    );
    this.save();
  }

  // Sharing a Room Layout or a Menu as a file

  exportText(kind: "room-layout" | "menu", id: Id): string | null {
    const item = kind === "menu" ? this.findMenu(id) : this.findRoomLayout(id);
    if (!item) return null;
    return JSON.stringify(
      { tapAndTally: kind, item: $state.snapshot(item) },
      null,
      1,
    );
  }

  /**
   * Adds a shared Room Layout or Menu as a new one of the teacher's own, with fresh ids so
   * importing it twice never collides. Returns what was added, or null if the file isn't one.
   */
  importText(text: string): { kind: "room-layout" | "menu"; id: Id } | null {
    try {
      const { tapAndTally: kind, item } = JSON.parse(text);
      if (kind === "room-layout" && Array.isArray(item?.seats)) {
        const fresh = <T extends object>(list: T[]) =>
          list.map((x) => ({ ...x, id: newId() }));
        // Older files may carry a board and a door; rooms are desks only now.
        const { anchors: _anchors, ...room } = item;
        return {
          kind,
          id: this.addRoomLayout({
            ...room,
            id: newId(),
            seats: fresh(item.seats),
          }),
        };
      }
      if (kind === "menu" && Array.isArray(item?.behaviors)) {
        const behaviors = item.behaviors.map((b: object) => ({
          ...b,
          id: newId(),
        }));
        return { kind, id: this.addMenu({ ...item, id: newId(), behaviors }) };
      }
    } catch {
      // Not JSON at all: fall through.
    }
    return null;
  }

  // Backup

  backupText(): string {
    this.data.lastBackupAt = Date.now();
    this.save();
    return JSON.stringify($state.snapshot(this.data), null, 1);
  }

  /** Replaces everything with a Backup. Returns false if the file isn't one. */
  restore(text: string): boolean {
    const restored = readData(text);
    if (!restored) return false;
    this.data = restored;
    this.save();
    return true;
  }

  eraseEverything() {
    this.data = emptyData();
    this.save();
  }
}

export const store = new Store();
