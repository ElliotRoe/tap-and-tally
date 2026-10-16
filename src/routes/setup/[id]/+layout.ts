import { redirect } from "@sveltejs/kit";
import { store } from "$lib/store.svelte";

export function load({ params }) {
  if (!store.findClass(params.id)) redirect(307, "/");
}
