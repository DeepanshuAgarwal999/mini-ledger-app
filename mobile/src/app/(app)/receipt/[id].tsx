import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ReceiptImage } from '@/components/loans/receipt-image';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-slate-900 p-4">
      <ReceiptImage path={`/api/loans/${id}/receipt`} style={{ flex: 1 }} contentFit="contain" />
    </View>
  );
}
