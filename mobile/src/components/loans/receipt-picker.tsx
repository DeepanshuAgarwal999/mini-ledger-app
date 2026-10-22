import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import type { ReceiptAsset } from '@/api/loans';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-client';
import { showError } from '@/lib/dialogs';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
const MAX_RECEIPT_WIDTH = 1600;

/** Phone photos are often several MB (or HEIC); shrink to a small JPEG before uploading. */
async function compressReceipt({ uri, width }: ImagePicker.ImagePickerAsset): Promise<ReceiptAsset> {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_RECEIPT_WIDTH) context.resize({ width: MAX_RECEIPT_WIDTH, height: null });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  return { uri: result.uri, mimeType: 'image/jpeg', fileName: 'receipt.jpg' };
}

export function ReceiptPicker({ value, onChange }: { value: ReceiptAsset | null; onChange(asset: ReceiptAsset | null): void }) {
  const [processing, setProcessing] = useState(false);

  async function pick(source: 'library' | 'camera') {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showError('Allow camera access in Settings to photograph receipts.', 'Camera permission needed');
        return;
      }
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled) return;

    setProcessing(true);
    try {
      onChange(await compressReceipt(result.assets[0]));
    } catch (error) {
      showError(errorMessage(error), "Couldn't process the photo");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-slate-700">Receipt photo (optional)</Text>
      {value ? (
        <View className="flex-row items-center gap-3 rounded-xl border border-slate-300 bg-white p-2">
          <Image source={{ uri: value.uri }} style={{ width: 64, height: 64, borderRadius: 8 }} contentFit="cover" />
          <Text className="flex-1 text-sm text-slate-600" numberOfLines={1}>
            {value.fileName ?? 'Receipt attached'}
          </Text>
          <Button title="Remove" variant="ghost" size="sm" onPress={() => onChange(null)} />
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Button title="Choose photo" variant="outline" className="flex-1" loading={processing} onPress={() => pick('library')} />
          {Platform.OS !== 'web' ? (
            <Button title="Take photo" variant="outline" className="flex-1" disabled={processing} onPress={() => pick('camera')} />
          ) : null}
        </View>
      )}
    </View>
  );
}
