import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Scrollable screen body that keeps inputs visible above the keyboard. */
export function FormScreen({ children, padTop = false }: { children: ReactNode; padTop?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        gap: 20,
        paddingTop: padTop ? insets.top + 20 : 20,
        paddingBottom: insets.bottom + 24,
      }}
    >
      {children}
    </ScrollView>
  );
}
