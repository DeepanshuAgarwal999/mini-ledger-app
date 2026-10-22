import { Image, type ImageContentFit } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';
import { apiUrl, authHeaders } from '@/lib/api-client';

/** Loads a receipt from the API; receipts are private so the request carries the auth header. */
export function ReceiptImage({ path, style, contentFit = 'cover' }: {
  path: string;
  style: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
}) {
  return (
    <Image
      source={{ uri: apiUrl(path), headers: authHeaders() }}
      style={style}
      contentFit={contentFit}
      transition={150}
      accessibilityLabel="Receipt photo"
    />
  );
}
