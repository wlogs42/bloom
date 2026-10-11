import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthScreen } from '@/features/auth/AuthScreen';
import { loadRemoteToken } from '@/features/itstep/api/account';
import { RemoteLoginScreen } from '@/features/itstep/RemoteLoginScreen';
import { SessionProvider, useSession } from '@/providers/SessionProvider';

import { HomeScreen } from './HomeScreen';

function Root() {
  const { profile, restoring, restoreError, setProfile, restore } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteLogin, setRemoteLogin] = useState(false);
  const [remoteToken, setRemoteToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadRemoteToken()
      .catch(() => null)
      .then((token) => {
        if (!active) return;
        if (token) {
          setRemoteToken(token);
          setRemoteLogin(true);
        }
        setRemoteReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (restoring || !remoteReady)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas px-6">
        <ActivityIndicator color="#253D32" />
      </SafeAreaView>
    );

  if (restoreError)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-center text-sm text-forest">{restoreError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void restore()}
          className="mt-5 rounded-2xl bg-accent px-6 py-4">
          <Text className="text-forest">Відновити з’єднання</Text>
        </Pressable>
      </SafeAreaView>
    );

  if (profile) return <HomeScreen key={profile.id} profile={profile} />;

  if (remoteLogin)
    return <RemoteLoginScreen initialToken={remoteToken} onBack={() => setRemoteLogin(false)} />;

  return <AuthScreen onAuthenticated={setProfile} onOpenRemoteLogin={() => setRemoteLogin(true)} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Root />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
