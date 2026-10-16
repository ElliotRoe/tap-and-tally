---
status: accepted
---

# Everything stays in the browser

ADR 0001 chose PocketBase and teacher accounts so that a term of Taps would survive a
cleared cache and be readable from a second device. We are reversing it: the redesigned
app has no accounts and no server, and keeps every Class, Room Layout, Behavior and Tap in
the browser it was recorded in. Asking a teacher to make an account before they can try
the tool cost more than it bought, and "your data never leaves your laptop" is a promise
a teacher can believe without reading a privacy policy.

## Consequences

Durability becomes the teacher's job. A Backup file, which the teacher downloads and can
restore, is the only way to move to a new computer or recover from cleared browser
data, so the app should prompt for one now and then rather than wait to be asked. There is no
second-device access: a tablet and a laptop are two separate Tap & Tally installs.
The redesign is new code with no path from the account-based app. What happens to that
app and its teachers is decided outside this repo.
