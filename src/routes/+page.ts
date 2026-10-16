import { redirect } from "@sveltejs/kit";
import { store } from "$lib/store.svelte";

// Once there is a class, the welcome page has done its job: go straight to teaching.
export function load() {
  const first = store.data.classes[0];
  if (first) redirect(307, `/class/${first.id}`);
}
