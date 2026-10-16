---
status: accepted (amended by ADR-0008: Classes no longer point at one Room Layout)
---

# Room Layouts are shared, not copied

ADR 0002 gave the whole app one Layout. A teacher can now keep several named Room Layouts,
and each Class in a Room View points at one of them. A Class does not get its own copy.
Copying would have been the safer default, because editing one Class could never move
another's desks. We link instead for the reason ADR 0002 gave: furniture doesn't move
between periods. A teacher who nudges a desk in Room 204 expects that change in every
period that meets there.

## Consequences

Deleting or moving a Seat affects every Class using that Room Layout at once, so the
editor says which Classes share the Room Layout and warns with a count before it unseats
anyone. Assignments stay per Class. The Room Layout is the only thing shared.
