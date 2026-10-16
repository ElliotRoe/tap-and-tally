import { describe, expect, it } from "vitest";
import { emptyData, backupDue } from "./backup";
import { buildReport, buildWeek, everythingCsv, reportCsv } from "./reports";
import { withoutLatest, countOn } from "./taps";
import type { Class, Data } from "./types";

const at = (day: string, hour = 9) =>
  new Date(`${day}T${String(hour).padStart(2, "0")}:00:00`).getTime();

function setup(): { cls: Class; data: Data } {
  const cls: Class = {
    id: "c",
    name: "Period 2",
    students: [
      { id: "a", firstName: "Ana", lastName: "Lopez" },
      { id: "b", firstName: "Ben", lastName: "Ng", former: true },
      { id: "z", firstName: "Zoe", lastName: "Kim", former: true },
    ],
    menuId: "m",
    lastShown: {
      view: "grid",
      gridOrder: "first-asc",
      customOrder: [],
      roomLayoutId: null,
    },
    seatings: {},
  };
  const data: Data = {
    ...emptyData(),
    classes: [cls],
    menus: [
      {
        id: "m",
        name: "Participation",
        behaviors: [
          {
            id: "p",
            name: "Participation",
            emoji: "🙋",
            color: "",
            mode: "count",
          },
          {
            id: "r",
            name: "Redirect",
            emoji: "🔁",
            color: "",
            mode: "count",
            removed: true,
          },
        ],
      },
    ],
    taps: [
      { student: "a", behavior: "p", at: at("2026-10-12") },
      { student: "a", behavior: "p", at: at("2026-10-14") },
      { student: "b", behavior: "r", at: at("2026-10-14") },
      { student: "a", behavior: "p", at: at("2026-09-01") },
    ],
    absences: [{ student: "a", day: "2026-10-13" }],
  };
  return { cls, data };
}

describe("buildReport", () => {
  it("counts taps since the start, keeps removed behaviors and students who left", () => {
    const { cls, data } = setup();
    const report = buildReport(cls, data, at("2026-10-12", 0));
    expect(report.columns.map((c) => c.label)).toEqual([
      "Participation",
      "Redirect (removed)",
    ]);
    expect(report.rows).toEqual([
      { name: "Ana Lopez", left: false, counts: [2, 0], absent: 1 },
      { name: "Ben Ng", left: true, counts: [0, 1], absent: 0 },
    ]);
  });

  it("writes a spreadsheet with a Days absent column", () => {
    const { cls, data } = setup();
    const csv = reportCsv(buildReport(cls, data, at("2026-10-12", 0)));
    expect(csv).toBe(
      "Student,Participation,Redirect (removed),Days absent\nAna Lopez,2,0,1\nBen Ng (left),0,1,0\n",
    );
  });
});

describe("withoutLatest", () => {
  it("removes only the most recent matching tap that day", () => {
    const { data } = setup();
    const taps = [
      ...data.taps,
      { student: "a", behavior: "p", at: at("2026-10-14", 10) },
    ];
    const after = withoutLatest(taps, "a", "p", "2026-10-14");
    expect(countOn(after, "a", "p", "2026-10-14")).toBe(1);
    expect(after.some((t) => t.at === at("2026-10-14", 10))).toBe(false);
  });
});

describe("backupDue", () => {
  it("waits for taps, then nudges a week after the last backup", () => {
    const data = emptyData();
    expect(backupDue(data)).toBe(false);
    data.taps.push({ student: "a", behavior: "p", at: at("2026-10-01") });
    data.lastBackupAt = at("2026-10-10");
    expect(backupDue(data, at("2026-10-16"))).toBe(false);
    expect(backupDue(data, at("2026-10-17", 10))).toBe(true);
  });
});

describe("buildWeek", () => {
  // Thursday 15 October 2026: the week runs Monday 12th to Sunday 18th.
  const now = new Date("2026-10-15T10:00:00");

  it("gives each weekday a column, marking today and the days still to come", () => {
    const { cls, data } = setup();
    const week = buildWeek(cls, data, now);
    expect(week.days.map((d) => d.date)).toEqual([12, 13, 14, 15, 16]);
    expect(week.days.find((d) => d.today)?.date).toBe(15);
    expect(week.days.filter((d) => d.ahead).map((d) => d.date)).toEqual([16]);
  });

  it("shows a weekend day only when something happened on it", () => {
    const { cls, data } = setup();
    data.taps.push({ student: "a", behavior: "p", at: at("2026-10-17") });
    expect(
      buildWeek(cls, data, new Date("2026-10-18T10:00:00")).days.map(
        (d) => d.date,
      ),
    ).toEqual([12, 13, 14, 15, 16, 17]);
  });

  it("counts each day, marks absences and totals the week", () => {
    const { cls, data } = setup();
    const week = buildWeek(cls, data, now);
    expect(week.behaviors.map((b) => b.id)).toEqual(["p", "r"]);
    const ana = week.rows.find((r) => r.student.id === "a")!;
    expect(ana.days.map((d) => d.counts[0])).toEqual([1, 0, 1, 0, 0]);
    expect(ana.days[1].absent).toBe(true);
    expect(ana.total).toEqual([2, 0]);
    expect(ana.absent).toBe(1);
  });

  it("lists students who left after the rest", () => {
    const { cls, data } = setup();
    expect(buildWeek(cls, data, now).rows.map((r) => r.student.id)).toEqual([
      "a",
      "b",
      "z",
    ]);
  });
});

describe("everythingCsv", () => {
  it("lists every tap and absence, oldest first, with the class and student", () => {
    const { data } = setup();
    const lines = everythingCsv(data).trim().split("\n");
    expect(lines[0]).toBe("Date,Time,Class,Student,What");
    expect(lines[1]).toBe("2026-09-01,09:00,Period 2,Ana Lopez,Participation");
    expect(lines).toContain("2026-10-13,,Period 2,Ana Lopez,Absent");
    expect(lines).toContain("2026-10-14,09:00,Period 2,Ben Ng (left),Redirect");
    expect(lines).toHaveLength(6);
  });
});
