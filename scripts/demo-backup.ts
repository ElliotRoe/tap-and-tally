// Builds a demo Backup: three full Classes, two Room Layouts, two Menus, and a month of Taps
// ending today. Restore it from Settings. Run: bun scripts/demo-backup.ts [output-file]
import { defaultMenu } from "../src/lib/domain/menus";
import { autoSeat, startingRoom } from "../src/lib/domain/room";
import { dayKey } from "../src/lib/domain/days";
import { newId } from "../src/lib/domain/ids";
import type {
  Absence,
  Behavior,
  Class,
  Data,
  Menu,
  Student,
  Tap,
} from "../src/lib/domain/types";

// A fixed seed so every run gives the same story.
let seed = 20261016;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const chance = (p: number) => random() < p;

function students(names: string): Student[] {
  return names
    .trim()
    .split("\n")
    .map((line) => {
      const [firstName, lastName] = line.trim().split(" ");
      return { id: newId(), firstName, lastName };
    });
}

const english = students(`
  Ava Martinez
  Liam Chen
  Sofia Okafor
  Noah Patel
  Mia Johnson
  Ethan Nguyen
  Isabella Rossi
  Lucas Williams
  Amara Diallo
  Mateo Garcia
  Chloe Kim
  Jayden Brooks
  Zoe Thompson
  Elijah Hernandez
  Priya Sharma
  Caleb Murphy
  Layla Hassan
  Owen Fischer
  Nora Lindqvist
  Gabriel Santos
  Harper Davis
  Malik Robinson
  Lily Nakamura
  Diego Morales
`);

const biology = students(`
  Aaliyah Carter
  Benjamin Lee
  Camila Reyes
  Daniel Park
  Emma Wilson
  Felix Andersson
  Grace Obi
  Henry Clarke
  Imani Jackson
  Jack O'Brien
  Kiara Singh
  Leo Moreau
  Maya Goldberg
  Nathan Wright
  Olivia Bennett
  Paolo Ricci
  Quinn Foster
  Rosa Delgado
  Samuel Adeyemi
  Tessa Novak
  Victor Alvarez
  Willow Grant
`);

const history = students(`
  Adriana Lopez
  Brandon Mitchell
  Carmen Vega
  Dante Russo
  Eliana Cohen
  Finn Gallagher
  Gianna Bianchi
  Hugo Laurent
  Iris Tanaka
  Jordan Hayes
  Kenji Watanabe
  Luna Castillo
  Marcus Bell
  Nadia Petrov
  Oscar Lindgren
  Penelope Hart
  Rafael Souza
  Sadie Cooper
  Theo Dubois
  Uma Krishnan
  Valentina Cruz
  Wesley Howard
  Ximena Ruiz
  Yusuf Ahmed
  Zara Whitfield
  Miles Jordan
`);
// Someone who changed schedules: hidden while teaching, still in the history.
history[history.length - 1].former = true;

const participation = defaultMenu();
const labSkills: Menu = {
  id: newId(),
  name: "Lab Skills",
  behaviors: [
    {
      id: newId(),
      name: "Asked a question",
      emoji: "❓",
      color: "#cfe1e6",
      mode: "count",
    },
    {
      id: newId(),
      name: "Helped a partner",
      emoji: "🤝",
      color: "#d6e3c1",
      mode: "count",
    },
    {
      id: newId(),
      name: "Safety reminder",
      emoji: "🔁",
      color: "#f5d3bd",
      mode: "count",
    },
    {
      id: newId(),
      name: "Goggles on",
      emoji: "🥽",
      color: "#f3e2a6",
      mode: "toggle",
    },
    {
      id: newId(),
      name: "Cleaned station",
      emoji: "🧹",
      color: "#e0d4ea",
      mode: "toggle",
    },
  ],
};

const groups = startingRoom(28, "groups", "Room 204 · Groups");
const rows = startingRoom(28, "rows", "Room 204 · Rows");
const horseshoe = startingRoom(26, "horseshoe", "Seminar U");

function makeClass(
  name: string,
  roster: Student[],
  menu: Menu,
  shown: Class["lastShown"],
  rooms: (typeof groups)[],
): Class {
  const current = roster.filter((s) => !s.former);
  return {
    id: newId(),
    name,
    students: roster,
    menuId: menu.id,
    lastShown: shown,
    seatings: Object.fromEntries(
      rooms.map((r) => [r.id, autoSeat(current, r.seats)]),
    ),
  };
}

const classes = [
  makeClass(
    "Period 1 · English 9",
    english,
    participation,
    {
      view: "room",
      gridOrder: "first-asc",
      customOrder: [],
      roomLayoutId: groups.id,
    },
    [groups, horseshoe],
  ),
  makeClass(
    "Period 3 · Biology",
    biology,
    labSkills,
    {
      view: "room",
      gridOrder: "last-asc",
      customOrder: [],
      roomLayoutId: rows.id,
    },
    [rows],
  ),
  makeClass(
    "Period 5 · World History",
    history,
    participation,
    {
      view: "grid",
      gridOrder: "first-asc",
      customOrder: [],
      roomLayoutId: groups.id,
    },
    [groups],
  ),
];

// How often each kind of Behavior happens in a lesson, per student.
function rate(behavior: Behavior): number {
  if (behavior.mode === "toggle") return 0.8;
  if (/redirect|safety/i.test(behavior.name)) return 0.12;
  return 0.45;
}

const now = new Date();
const taps: Tap[] = [];
const absences: Absence[] = [];

// The school days of the last four weeks, and today.
const days: Date[] = [];
for (let back = 28; back >= 0; back--) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  if (day.getDay() !== 0 && day.getDay() !== 6) days.push(day);
}

classes.forEach((cls, period) => {
  const menu = cls.menuId === labSkills.id ? labSkills : participation;
  // Some students are louder in the data than others, so Reports have a story to tell.
  const keenness = new Map(
    cls.students.map((s) => [s.id, 0.4 + random() * 1.4]),
  );

  for (const day of days) {
    const isToday = dayKey(day) === dayKey(now);
    const start = new Date(day);
    start.setHours(8 + period * 2, 10, 0, 0);
    // Today, only the lesson that has already happened (or half of one) has Taps.
    const length = isToday
      ? Math.min(Math.max((now.getTime() - start.getTime()) / 60000, 0), 50)
      : 50;
    if (length <= 0) continue;

    const lesson: Tap[] = [];
    for (const student of cls.students) {
      if (student.former && day.getTime() > now.getTime() - 10 * 86400000)
        continue;
      if (chance(0.05)) {
        absences.push({ student: student.id, day: dayKey(day) });
        continue;
      }
      const keen = keenness.get(student.id)!;
      for (const behavior of menu.behaviors) {
        const at = () =>
          start.getTime() + Math.floor(random() * length * 60000);
        if (behavior.mode === "toggle") {
          if (chance(rate(behavior)))
            lesson.push({
              student: student.id,
              behavior: behavior.id,
              at: at(),
            });
          continue;
        }
        // Redirects go the other way: keen students need fewer.
        const p = /redirect|safety/i.test(behavior.name)
          ? rate(behavior) / keen
          : rate(behavior) * keen;
        let times = 0;
        while (times < 4 && chance(Math.min(p, 0.85))) times++;
        for (let i = 0; i < times; i++)
          lesson.push({ student: student.id, behavior: behavior.id, at: at() });
      }
    }
    taps.push(...lesson);
  }
});

// Taps are saved in the order they happen.
taps.sort((a, b) => a.at - b.at);

const data: Data = {
  classes,
  roomLayouts: [groups, rows, horseshoe],
  menus: [participation, labSkills],
  taps,
  absences,
  lastBackupAt: now.getTime(),
  lastClassId: classes[0].id,
};

const out = process.argv[2] ?? `tap-and-tally-demo-${dayKey(now)}.json`;
await Bun.write(out, JSON.stringify(data));
console.log(
  `${out}: ${classes.length} classes, ${taps.length} taps, ${absences.length} absences`,
);
