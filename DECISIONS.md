# Tap & Tally Decisions

The bigger, harder-to-reverse decisions are ADRs in `docs/adr`. These are the smaller ones.

- The redesign is deliberately dirt simple: one tap box, one settings page per class, no
  tabs. Features earn their way back in.
- Setup is a hands-on wizard that builds the real first class, not a tour. Each step saves
  as it goes.
- A Menu holds at most eight Behaviors, so the tap box never needs scrolling mid-lesson.
- The −1 button is the only undo. It deletes the Tap rather than recording a correction.
- A tile's number is today's total across the whole Menu. Zero looks faded, so the
  students nobody has called on stand out.
- Absence is recorded by holding a tile until it fills; the fill completing is the
  confirmation, so there's no dialog. Holding again marks them present. The tap box also
  has a hold-to-mark-absent bar, so a stray tap can't do it.
- Practice taps in setup are never saved.
- Every new room starts with a Board and a Door, whatever its shape.
- Removing a student makes them a Former Student; only deleting the class or erasing
  everything deletes Taps.
- Removing a Behavior hides it from its Menu but keeps it, so old Taps still have a name
  in Reports.
- A Menu can't be deleted while a class uses it. Deleting a Room Layout deletes every
  class's seating in it.
- Desks and labels both resize and turn; turning snaps to 15°, and everything snaps to
  the grid dots. Students' tiles stay upright on turned desks.
- Students are seated A–Z by first name, front row first, the first time a class is
  shown in a room. Dragging swaps.
