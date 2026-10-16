/** Hands the teacher a file to save. */
export function downloadFile(
  name: string,
  text: string,
  type = "application/json",
) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Asks the teacher to choose a file, and reads it as text. Null if they cancel. */
export function chooseFile(
  accept = ".json,application/json",
): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () =>
      resolve((await input.files?.[0]?.text()) ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** A file name from something a teacher typed: "Room 204" → "room-204". */
export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "untitled"
  );
}
