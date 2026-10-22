import { Stack } from 'expo-router';
import { Button } from '@/components/ui/button';
import { confirm } from '@/lib/dialogs';
import { useSession } from '@/providers/session-provider';

function SignOutButton() {
  const { signOut } = useSession();
  return (
    <Button
      title="Sign out"
      variant="ghost"
      size="sm"
      onPress={async () => {
        if (await confirm({ title: 'Sign out?', message: 'You can sign back in with your phone number.', confirmText: 'Sign out' })) {
          await signOut();
        }
      }}
    />
  );
}

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f8fafc' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        headerTintColor: '#0f172a',
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'MiniLedger', headerRight: () => <SignOutButton /> }} />
      <Stack.Screen name="add-loan" options={{ title: 'New loan', presentation: 'modal' }} />
      <Stack.Screen name="receipt/[id]" options={{ title: 'Receipt', presentation: 'modal' }} />
    </Stack>
  );
}
