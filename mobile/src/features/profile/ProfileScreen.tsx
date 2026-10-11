import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

import { photoUrl } from '@/shared/api/client';
import { type UserProfile } from '@/shared/api/types';
import { Icon } from '@/shared/components/Icon';

import { changePassword, updateProfile } from './api';

export function ProfileScreen({
  profile,
  onProfileChange,
  onSignOut,
  totalTasks,
  totalMinutes,
}: {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onSignOut: () => Promise<void>;
  totalTasks: number;
  totalMinutes: number;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fieldClass =
    'mt-2 min-h-14 rounded-2xl border border-line bg-canvas px-4 text-[15px] text-ink';

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не вдалося зберегти зміни.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-4 rounded-[28px] bg-forest p-6">
        {profile.photo ? (
          <Image
            source={{ uri: photoUrl(profile)! }}
            accessibilityLabel="Фото профілю"
            accessibilityIgnoresInvertColors
            className="h-16 w-16 rounded-full bg-accent"
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Icon name="user" size={32} />
          </View>
        )}
        <View className="min-w-0 flex-1">
          <Text className="text-[23px] font-semibold text-white">{profile.name}</Text>
          <Text className="mt-1 text-sm text-[#C4D0BE]">{profile.email}</Text>
        </View>
      </View>
      <View className="flex-row gap-4">
        <View className="flex-1 rounded-2xl border border-line bg-white p-5">
          <Text className="text-3xl font-semibold text-forest">{totalTasks}</Text>
          <Text className="mt-2 text-xs text-[#656D62]">виконаних завдань</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-line bg-white p-5">
          <Text className="text-3xl font-semibold text-forest">{totalMinutes}</Text>
          <Text className="mt-2 text-xs text-[#656D62]">хвилин фокусу загалом</Text>
        </View>
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          className="rounded-2xl bg-[#F9E7E2] p-4 text-sm text-[#A23C30]">
          {error}
        </Text>
      )}
      {!!message && (
        <Text
          accessibilityLiveRegion="polite"
          className="rounded-2xl bg-accent p-4 text-sm text-forest">
          {message}
        </Text>
      )}
      <View className="rounded-[28px] border border-line bg-white p-6">
        <Text className="mb-5 text-xl font-semibold text-forest">Особисті дані</Text>
        <Text className="text-xs font-medium text-[#656D62]">Ім’я</Text>
        <TextInput
          accessibilityLabel="Ім’я профілю"
          value={name}
          onChangeText={setName}
          maxLength={60}
          editable={!busy}
          autoComplete="name"
          className={fieldClass}
        />
        <Text className="mt-5 text-xs font-medium text-[#656D62]">Електронна пошта</Text>
        <TextInput
          accessibilityLabel="Пошта профілю"
          value={email}
          onChangeText={setEmail}
          maxLength={254}
          editable={!busy}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          className={fieldClass}
        />
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          onPress={() =>
            void run(async () => {
              if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                throw new Error('Вкажи ім’я від 2 символів і коректну пошту.');
              onProfileChange(await updateProfile(name, email));
              setMessage('Профіль збережено.');
            })
          }
          className="mt-6 min-h-14 items-center justify-center rounded-2xl bg-forest px-4 disabled:opacity-50">
          <Text className="font-semibold text-accent">Зберегти профіль</Text>
        </Pressable>
      </View>
      <View className="rounded-[28px] border border-line bg-white p-6">
        <Text className="mb-5 text-xl font-semibold text-forest">Змінити пароль</Text>
        <TextInput
          accessibilityLabel="Поточний пароль"
          placeholder="Поточний пароль"
          placeholderTextColor="#7A8177"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          editable={!busy}
          autoCapitalize="none"
          autoComplete="current-password"
          maxLength={128}
          className={fieldClass}
        />
        <TextInput
          accessibilityLabel="Новий пароль"
          placeholder="Новий пароль — від 8 символів"
          placeholderTextColor="#7A8177"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!busy}
          autoCapitalize="none"
          autoComplete="new-password"
          maxLength={128}
          className={fieldClass}
        />
        <TextInput
          accessibilityLabel="Підтвердження нового пароля"
          placeholder="Повтори новий пароль"
          placeholderTextColor="#7A8177"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          editable={!busy}
          autoCapitalize="none"
          autoComplete="new-password"
          maxLength={128}
          className={fieldClass}
        />
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          onPress={() =>
            void run(async () => {
              if (!currentPassword || newPassword.trim().length < 8 || newPassword !== confirm)
                throw new Error('Вкажи поточний пароль і два однакові нові паролі від 8 символів.');
              await changePassword(currentPassword, newPassword);
              setCurrentPassword('');
              setNewPassword('');
              setConfirm('');
              setMessage('Пароль змінено. Інші сесії завершено.');
            })
          }
          className="mt-6 min-h-14 items-center justify-center rounded-2xl bg-canvas px-4 disabled:opacity-50">
          <Text className="font-semibold text-forest">Оновити пароль</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void run(onSignOut)}
        className="min-h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-[#DFC5BD] px-4">
        <Icon name="logout" color="#A23C30" size={20} />
        <Text className="font-medium text-[#A23C30]">Вийти з профілю</Text>
      </Pressable>
    </View>
  );
}
