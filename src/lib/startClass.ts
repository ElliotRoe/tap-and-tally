import { goto } from "$app/navigation";
import type { Id } from "$lib/domain/types";
import { ui } from "$lib/ui.svelte";

/** Start class: fill the screen (the browser's own bars too, where allowed) and open Live Mode. */
export async function startClass(classId: Id) {
  await ui.enterFullscreen();
  await goto(`/live/${classId}`);
}
