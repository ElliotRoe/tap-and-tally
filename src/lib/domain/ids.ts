/** A short random id. Short ids keep the saved data small, since every Tap carries two. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
