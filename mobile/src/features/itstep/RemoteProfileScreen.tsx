import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/shared/components/Brand';
import { Icon } from '@/shared/components/Icon';

import { getRemoteProfile, type RemoteProfile, remotePhotoUrl } from './api/account';
import { ITSTEP_API_URL } from './api/client';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: RemoteProfile };

export function RemoteProfileScreen({
  token,
  onSignOut,
}: {
  token: string;
  onSignOut: (message?: string) => void;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getRemoteProfile(token, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.ok) setState({ status: 'ready', profile: result.profile });
        else if (result.status === 401) onSignOut(result.message);
        else setState({ status: 'error', message: result.message });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [token, attempt, onSignOut]);

  const profile = state.status === 'ready' ? state.profile : null;
  const photo = profile && !photoFailed ? remotePhotoUrl(profile.image) : null;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="grow items-center justify-center p-5 sm:p-8">
        <View className="w-full max-w-[440px] py-3">
          <Brand />
          <Text
            accessibilityRole="header"
            className="mt-8 text-[35px] font-semibold leading-[41px] tracking-[-1.2px] text-forest">
            Профіль
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-[#656D62]">
            Дані з {ITSTEP_API_URL.replace('https://', '')}.
          </Text>

          {state.status === 'loading' && (
            <View className="mt-8 items-center rounded-[28px] border border-line bg-white p-10">
              <ActivityIndicator color="#253D32" />
              <Text className="mt-4 text-sm text-[#656D62]">Завантажуємо профіль…</Text>
            </View>
          )}

          {state.status === 'error' && (
            <View className="mt-8">
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className="rounded-2xl bg-[#F9E7E2] p-4 text-sm leading-5 text-[#A23C30]">
                {state.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setState({ status: 'loading' });
                  setAttempt((current) => current + 1);
                }}
                className="mt-4 min-h-14 items-center justify-center rounded-2xl bg-forest px-5 active:opacity-80">
                <Text className="text-[15px] font-semibold text-accent">Спробувати ще раз</Text>
              </Pressable>
            </View>
          )}

          {profile && (
            <View className="mt-8 items-center rounded-[28px] bg-forest p-8">
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  onError={() => setPhotoFailed(true)}
                  accessibilityLabel={`Фото профілю ${fullName || profile.email}`}
                  accessibilityIgnoresInvertColors
                  className="h-40 w-40 rounded-full bg-[#49604E]"
                />
              ) : (
                <View
                  accessibilityLabel={
                    profile.image ? 'Фото не вдалося завантажити' : 'Фото не додано'
                  }
                  className="h-40 w-40 items-center justify-center rounded-full bg-accent">
                  <Icon name="user" size={72} />
                </View>
              )}
              {!photo && (
                <Text className="mt-3 text-xs text-[#C4D0BE]">
                  {profile.image ? 'Фото не вдалося завантажити.' : 'Фото не додано.'}
                </Text>
              )}
              <Text className="mt-5 text-center text-[25px] font-semibold text-white">
                {fullName || 'Без імені'}
              </Text>
              <Text className="mt-1 text-center text-sm text-[#C4D0BE]">{profile.email}</Text>
              {profile.roles.length > 0 && (
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  {profile.roles.map((role) => (
                    <Text
                      key={role}
                      className="overflow-hidden rounded-full bg-[#49604E] px-3 py-1 text-xs text-accent">
                      {role}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => onSignOut()}
            className="mt-6 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-line bg-white px-5 active:bg-canvas">
            <Icon name="logout" size={19} color="#253D32" />
            <Text className="text-[15px] font-semibold text-forest">Вийти</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
