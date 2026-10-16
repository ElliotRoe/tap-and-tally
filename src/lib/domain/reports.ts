import { dayKey, rangeStart } from "./days";
import { orderStudents, fullName } from "./students";
import type { Behavior, Class, Data, Id, Student } from "./types";

export type ReportColumn = { behavior: Behavior; label: string };
export type ReportRow = {
  name: string;
  left: boolean;
  counts: number[];
  absent: number;
};
export type Report = { columns: ReportColumn[]; rows: ReportRow[] };

/**
 * One Class's table for everything since `since`: a row per Student, a column per
 * Behavior. Behaviors no longer on the Class's Menu still get a column when they have
 * Taps in range, and Former Students still get a row when they have any history.
 */
export function buildReport(cls: Class, data: Data, since: number): Report {
  const studentIds = new Set(cls.students.map((s) => s.id));
  const taps = data.taps.filter(
    (t) => studentIds.has(t.student) && t.at >= since,
  );
  const sinceDay = new Date(since);
  const absences = data.absences.filter(
    (a) =>
      studentIds.has(a.student) && new Date(a.day + "T23:59:59") >= sinceDay,
  );

  const menu = data.menus.find((m) => m.id === cls.menuId);
  const allBehaviors = new Map(
    data.menus.flatMap((m) => m.behaviors).map((b) => [b.id, b]),
  );
  const shown = (menu?.behaviors ?? []).filter((b) => !b.removed);
  const shownIds = new Set(shown.map((b) => b.id));
  const extraIds = [...new Set(taps.map((t) => t.behavior))].filter(
    (id) => !shownIds.has(id),
  );

  const columns: ReportColumn[] = [
    ...shown.map((behavior) => ({ behavior, label: behavior.name })),
    ...extraIds.map((id) => {
      const behavior = allBehaviors.get(id) ?? deletedBehavior(id);
      return { behavior, label: `${behavior.name} (removed)` };
    }),
  ];

  const count = (student: Id, behavior: Id) =>
    taps.filter((t) => t.student === student && t.behavior === behavior).length;
  const hasHistory = (student: Id) =>
    taps.some((t) => t.student === student) ||
    absences.some((a) => a.student === student);

  const rows = orderStudents(cls.students, "first-asc")
    .filter((s) => !s.former || hasHistory(s.id))
    .map((s) => ({
      name: fullName(s),
      left: !!s.former,
      counts: columns.map((c) => count(s.id, c.behavior.id)),
      absent: absences.filter((a) => a.student === s.id).length,
    }));

  return { columns, rows };
}

function deletedBehavior(id: Id): Behavior {
  return {
    id,
    name: "Deleted behavior",
    emoji: "•",
    color: "#e8dcc6",
    mode: "count",
  };
}

/** Rows of cells as a spreadsheet file's text, quoting any cell that needs it. */
function toCsv(lines: (string | number)[][]): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return lines.map((line) => line.map(cell).join(",")).join("\n") + "\n";
}

/** The Report as a spreadsheet file's text. */
export function reportCsv(report: Report): string {
  const header = [
    "Student",
    ...report.columns.map((c) => c.label),
    "Days absent",
  ];
  const lines = report.rows.map((r) => [
    r.left ? `${r.name} (left)` : r.name,
    ...r.counts,
    r.absent,
  ]);
  return toCsv([header, ...lines]);
}

export type WeekDay = {
  key: string;
  label: string;
  date: number;
  today: boolean;
  ahead: boolean;
};
export type WeekCell = { absent: boolean; counts: number[] };
export type WeekRow = {
  student: Student;
  days: WeekCell[];
  total: number[];
  absent: number;
};
export type Week = { days: WeekDay[]; behaviors: Behavior[]; rows: WeekRow[] };

/**
 * One Class's week at a glance, Monday first: for each Student, what they got each day
 * (a count per Behavior) or that they were absent, and the week's totals. Weekdays are
 * always shown; Saturday and Sunday only when something happened on them. Behaviors
 * taken off the Menu still show when they were tapped this week. Students who left come
 * last.
 */
export function buildWeek(
  cls: Class,
  data: Data,
  now: Date = new Date(),
): Week {
  const start = new Date(rangeStart("week", now));
  const todayKey = dayKey(now);
  const studentIds = new Set(cls.students.map((s) => s.id));
  const taps = data.taps.filter(
    (t) => studentIds.has(t.student) && t.at >= start.getTime(),
  );
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i,
    );
    const key = dayKey(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      date: date.getDate(),
      today: key === todayKey,
      ahead: key > todayKey,
    };
  });
  const absences = data.absences.filter(
    (a) => studentIds.has(a.student) && allDays.some((d) => d.key === a.day),
  );
  const used = (key: string) =>
    taps.some((t) => dayKey(t.at) === key) ||
    absences.some((a) => a.day === key);
  const days = allDays.filter((d, i) => i < 5 || used(d.key));

  const menu = data.menus.find((m) => m.id === cls.menuId);
  const onMenu = (menu?.behaviors ?? []).filter((b) => !b.removed);
  const allBehaviors = new Map(
    data.menus.flatMap((m) => m.behaviors).map((b) => [b.id, b]),
  );
  const extra = [...new Set(taps.map((t) => t.behavior))]
    .filter((id) => !onMenu.some((b) => b.id === id))
    .map((id) => allBehaviors.get(id) ?? deletedBehavior(id));
  const behaviors = [...onMenu, ...extra];

  const rows = orderStudents(cls.students, "first-asc")
    .sort((a, b) => Number(!!a.former) - Number(!!b.former))
    .map((student) => {
      const cells = days.map((d) => ({
        absent: absences.some(
          (a) => a.student === student.id && a.day === d.key,
        ),
        counts: behaviors.map(
          (b) =>
            taps.filter(
              (t) =>
                t.student === student.id &&
                t.behavior === b.id &&
                dayKey(t.at) === d.key,
            ).length,
        ),
      }));
      return {
        student,
        days: cells,
        total: behaviors.map((_, i) =>
          cells.reduce((n, c) => n + c.counts[i], 0),
        ),
        absent: cells.filter((c) => c.absent).length,
      };
    });

  return { days, behaviors, rows };
}

/**
 * Everything ever recorded, as a spreadsheet: a row per Tap or Absence, oldest first,
 * with the date, time, Class, Student and what it was. One shape for every Class, however
 * different their Menus.
 */
export function everythingCsv(data: Data): string {
  const behaviors = new Map(
    data.menus.flatMap((m) => m.behaviors).map((b) => [b.id, b]),
  );
  const people = new Map(
    data.classes.flatMap((cls) =>
      cls.students.map((s) => [
        s.id,
        { cls: cls.name, name: fullName(s) + (s.former ? " (left)" : "") },
      ]),
    ),
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  const rows: { at: number; line: (string | number)[] }[] = [];
  for (const tap of data.taps) {
    const who = people.get(tap.student);
    if (!who) continue;
    const when = new Date(tap.at);
    rows.push({
      at: tap.at,
      line: [
        dayKey(when),
        `${pad(when.getHours())}:${pad(when.getMinutes())}`,
        who.cls,
        who.name,
        behaviors.get(tap.behavior)?.name ?? "Deleted behavior",
      ],
    });
  }
  for (const absence of data.absences) {
    const who = people.get(absence.student);
    if (!who) continue;
    rows.push({
      at: new Date(absence.day + "T00:00:00").getTime(),
      line: [absence.day, "", who.cls, who.name, "Absent"],
    });
  }
  rows.sort((a, b) => a.at - b.at);
  return toCsv([
    ["Date", "Time", "Class", "Student", "What"],
    ...rows.map((r) => r.line),
  ]);
}
