/**
 * Undo and redo for an editor: before each change, record how things were; undo swaps
 * the current state for the last one recorded, and redo swaps it back.
 */
export class History<T> {
  past = $state.raw<T[]>([]);
  future = $state.raw<T[]>([]);

  record(now: T) {
    this.past = [...this.past.slice(-99), now];
    this.future = [];
  }

  undo(now: T): T | undefined {
    const previous = this.past.at(-1);
    if (previous === undefined) return;
    this.past = this.past.slice(0, -1);
    this.future = [...this.future, now];
    return previous;
  }

  redo(now: T): T | undefined {
    const next = this.future.at(-1);
    if (next === undefined) return;
    this.future = this.future.slice(0, -1);
    this.past = [...this.past, now];
    return next;
  }
}
