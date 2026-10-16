# Tap & Tally

A touch-first tool for recording what happens in a classroom as it happens: a teacher
taps a student on a seating chart and records a behavior, without breaking the flow of
the lesson.

## Language

### What the teacher taps on

**Live Mode**:
The full-screen screen a teacher uses during class to tap Students, opened with Start
class. The View, the Room Layout and the Grid View's order are all chosen here, and
each Class reopens the way it was last used.
_Avoid_: clicker mode, teaching mode, session, presentation

**View**:
How a Class is shown in Live Mode: a Grid View or a Room View. Not a setting of the
Class: the teacher switches between them at any time during class.
_Avoid_: mode, display, chart

**Grid View**:
A View that shows each Student as a tile of their initials, in an order chosen in Live
Mode: by first or last name, either direction, or dragged by hand.
_Avoid_: tiles, list

**Room View**:
A View that shows the Class seated in a Room Layout picked in Live Mode, so the screen
looks like the room.
_Avoid_: seating chart, map

### The room

**Room Layout**:
A named arrangement of Seats in a physical room, such as "My Classroom" or "Library".
Describes furniture, not people, and belongs to no Class: any Class can be shown in any
Room Layout, and changing one changes it everywhere it is used. See ADRs 0007 and 0008.
_Avoid_: layout, template, seating chart, chart

**Seat**:
One position in a Room Layout. May be empty.
_Avoid_: desk, spot

**Assignment**:
Which Student occupies which Seat, for one Class in one Room Layout. A Class has its own
Assignment in every Room Layout it has been shown in, and changing it never alters the
Room Layout.
_Avoid_: seating, placement

### The people and the meeting

**Class**:
A roster of Students that meets repeatedly. "Period 2 Algebra."
_Avoid_: section, period, course, roster

**Student**:
One learner on a Class roster, known by a first name and enough of a last name to tell
them apart from anyone else in the room.
_Avoid_: learner, kid, pupil

**Day**:
The scope a Tap is counted in on the chart. Counts and toggles cover the teacher's own
calendar day and start clean the next morning — there is nothing to open or close. See
ADR 0004.
_Avoid_: session, period, lesson

### The tracking

**Behavior**:
One thing a teacher tracks by tapping — participation, positive behavior, a redirect,
a question asked. Belongs to exactly one Menu, and has its own emoji and colour so it can
be told apart at a glance. Being absent is not a Behavior; see Absence.
_Avoid_: metric, thing, tag, action

**Menu**:
A named list of Behaviors, such as "Participation", that pops up when the teacher taps a
Student. Every Class uses exactly one Menu. Several Classes can share a Menu, and
changing it changes it for all of them, the same way a Room Layout works.
_Avoid_: tracker, set, preset, template, popup

**Absence**:
A Student marked as not in the room for one Day. Recorded by pressing and holding the
Student until the hold completes, not from a Menu, because it answers "were they
here?" rather than "what did they do?".
_Avoid_: attendance, absent behavior, away

**Tallies / Toggles**:
The two modes a Behavior can be set to. A tallying Behavior counts every tap, so three
taps mean it happened three times. A toggling Behavior is either on or off for the whole
day, so tapping it again turns it back off rather than counting again.
_Avoid_: cumulative, sticky, one-shot

**Tap**:
One recorded event: a Student, a Behavior, a moment in time. The unit of everything
stored and everything counted.
_Avoid_: mark, point, count, hit

**Former Student**:
A Student removed from a Class. They no longer appear when teaching, but every Tap they
received stays in the Class's history, and they can be brought back.
_Avoid_: deleted student, archived student, inactive student

**Unseated**:
A Student on a Class roster with no Seat. Still tappable, still counted — the room
running out of desks never stops a child being tracked.
_Avoid_: unplaced, floating

### Keeping it

**Backup**:
A single file holding everything this browser knows: Classes, Students, Room Layouts,
Behaviors and every Tap. Restoring one replaces everything in the browser. With no
accounts, it is the only copy that ever leaves the laptop. See ADR 0006.
_Avoid_: export, save file, sync
