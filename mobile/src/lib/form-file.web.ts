/** On web, picked images are blob:/data: URIs, so fetch them into a Blob. */
export async function toFormFile(uri: string): Promise<Blob> {
  return (await fetch(uri)).blob();
}
