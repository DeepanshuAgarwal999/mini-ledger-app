import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from './button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="items-center gap-3 py-12">
      <ActivityIndicator color="#059669" />
      <Text className="text-slate-500">{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <View className="items-center gap-2 px-6 py-12">
      <Text className="text-lg font-semibold text-slate-800">{title}</Text>
      <Text className="text-center text-slate-500">{message}</Text>
      {action ? <View className="mt-3">{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="items-center gap-3 px-6 py-12">
      <Text className="text-lg font-semibold text-slate-800">Couldn&apos;t load data</Text>
      <Text className="text-center text-slate-500">{message}</Text>
      {onRetry ? <Button title="Try again" variant="outline" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}
