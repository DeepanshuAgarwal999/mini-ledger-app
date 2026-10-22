import { File } from 'expo-file-system';

/**
 * Turns a local file URI into something FormData can upload.
 * Expo's fetch rejects React Native's legacy `{ uri, name, type }` objects; an
 * expo-file-system File implements Blob (name and MIME type come from the path).
 */
export async function toFormFile(uri: string): Promise<Blob> {
  return new File(uri);
}
