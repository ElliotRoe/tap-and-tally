import type { GridOrder, Id, Student } from "./types";

/** One student per line: the first word is the first name, the rest the last name. */
export function parseRoster(
  text: string,
): { firstName: string; lastName: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim().split(/\s+/).filter(Boolean))
    .filter((words) => words.length > 0)
    .map(([firstName, ...rest]) => ({ firstName, lastName: rest.join(" ") }));
}

/** First and last initial, or the first two letters when there is only one name. */
export function initials(
  student: Pick<Student, "firstName" | "lastName">,
): string {
  const last = student.lastName.split(/\s+/).filter(Boolean).at(-1);
  const letters = last
    ? [...student.firstName][0] + [...last][0]
    : [...student.firstName].slice(0, 2).join("");
  return letters.toUpperCase();
}

/** "Maria G." — small enough for a tile. */
export function shortName(
  student: Pick<Student, "firstName" | "lastName">,
): string {
  const last = student.lastName.trim();
  return last ? `${student.firstName} ${[...last][0]}.` : student.firstName;
}

export function fullName(
  student: Pick<Student, "firstName" | "lastName">,
): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

const byFirst = (a: Student, b: Student) =>
  a.firstName.localeCompare(b.firstName) ||
  a.lastName.localeCompare(b.lastName);
const byLast = (a: Student, b: Student) =>
  a.lastName.localeCompare(b.lastName) ||
  a.firstName.localeCompare(b.firstName);

/** The Grid View order. Students missing from a custom order go at the end. */
export function orderStudents(
  students: Student[],
  order: GridOrder,
  customOrder: Id[] = [],
): Student[] {
  const list = [...students];
  if (order === "first-asc") return list.sort(byFirst);
  if (order === "first-desc") return list.sort(byFirst).reverse();
  if (order === "last-asc") return list.sort(byLast);
  if (order === "last-desc") return list.sort(byLast).reverse();
  const position = (s: Student) => {
    const index = customOrder.indexOf(s.id);
    return index === -1 ? Infinity : index;
  };
  return list.sort((a, b) => position(a) - position(b));
}

/** Moves one id to sit just before another, for dragging tiles into a custom order. */
export function moveBefore(ids: Id[], moving: Id, target: Id): Id[] {
  if (moving === target) return ids;
  const without = ids.filter((id) => id !== moving);
  const at = without.indexOf(target);
  if (at === -1) return [...without, moving];
  return [...without.slice(0, at), moving, ...without.slice(at)];
}
