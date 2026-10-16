<!-- A new room: pick a starting shape, then draw it. Opened from Room Layouts or from class. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ShapePicker from "$lib/components/ShapePicker.svelte";
  import { createRoom } from "$lib/rooms";
  import { store } from "$lib/store.svelte";

  const classId = page.url.searchParams.get("class");
  const cls = classId ? store.findClass(classId) : undefined;
  const back = cls ? `/live/${cls.id}` : "/layouts";
  const seats = cls ? cls.students.filter((s) => !s.former).length : 24;
</script>

<svelte:head><title>New room · Tap &amp; Tally</title></svelte:head>

<div class="page stack">
  <div>
    <p class="eyebrow">New room</p>
    <h1>Start from a shape</h1>
    <p class="muted">Pick the closest one. Every desk moves afterwards.</p>
  </div>
  <ShapePicker {seats} onpick={(shape) => goto(`/room/${createRoom(shape, classId)}?back=${back}`)} />
  <div><a class="btn btn-quiet" href={back}>← Back</a></div>
</div>
