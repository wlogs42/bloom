import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AuthMode, validateAuthForm } from '@/features/auth/validation';
import { Brand } from '@/shared/components/Brand';
import { FormField } from '@/shared/components/FormField';
import { Icon } from '@/shared/components/Icon';
import { PhotoField } from '@/shared/components/PhotoField';

import {
  remoteLogin,
  remoteRegister,
  saveRemoteToken,
  type RemoteRegistration,
  validateRemoteRegistration,
} from './api/account';
import { ITSTEP_API_URL, type RemoteErrors, type RemoteField } from './api/client';
import { RemoteProfileScreen } from './RemoteProfileScreen';
import { RemoteTasksScreen } from './RemoteTasksScreen';

const emptyValues: RemoteRegistration = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  photo: null,
};
const fieldOrder = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'] as const;
type Outcome = { ok: boolean; title: string; message: string };
const tabs = [
  { key: 'tasks', label: 'Задачі', icon: 'tasks' },
  { key: 'profile', label: 'Профіль', icon: 'user' },
] as const;

export function RemoteLoginScreen({
  initialToken = null,
  onBack,
}: {
  initialToken?: string | null;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [values, setValues] = useState<RemoteRegistration>(emptyValues);
  const [errors, setErrors] = useState<RemoteErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [token, setToken] = useState<string | null>(initialToken);
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('tasks');
  const [welcome, setWelcome] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const pendingRequest = useRef<AbortController | null>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const register = mode === 'register';

  useEffect(() => () => pendingRequest.current?.abort(), []);

  function validate(next: RemoteRegistration): RemoteErrors {
    if (register) return validateRemoteRegistration(next);
    const { email, password } = validateAuthForm('login', { ...next, name: '' });
    return { ...(email ? { email } : {}), ...(password ? { password } : {}) };
  }

  function changeMode(next: AuthMode) {
    if (next === mode || pendingRequest.current) return;
    Keyboard.dismiss();
    setMode(next);
    setValues((current) => ({ ...emptyValues, email: current.email }));
    setErrors({});
    setSubmitted(false);
    setOutcome(null);
  }

  function update(field: Exclude<RemoteField, 'photo'>, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setOutcome(null);
    if (submitted) setErrors(validate(next));
  }

  function focusField(field: (typeof fieldOrder)[number]) {
    ({
      firstName: firstNameRef,
      lastName: lastNameRef,
      email: emailRef,
      password: passwordRef,
      confirmPassword: confirmRef,
    })[field].current?.focus();
  }

  async function submit() {
    if (pendingRequest.current) return;
    const nextErrors = validate(values);
    setSubmitted(true);
    setErrors(nextErrors);
    const firstInvalid = fieldOrder.find((field) => nextErrors[field]);
    if (firstInvalid) return focusField(firstInvalid);
    Keyboard.dismiss();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsSubmitting(true);
    setOutcome(null);
    try {
      const email = values.email.trim();
      const result = register
        ? await remoteRegister(values, controller.signal)
        : await remoteLogin(email, values.password, controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok) {
        setValues({ ...emptyValues, email });
        setSubmitted(false);
        await saveRemoteToken(result.token).catch(() => {});
        if (controller.signal.aborted) return;
        setWelcome(register ? 'Реєстрація успішна. Ласкаво просимо!' : 'Вхід успішний.');
        setTab('tasks');
        setMode('login');
        setToken(result.token);
      } else {
        if (result.fields) setErrors(result.fields);
        setOutcome({
          ok: false,
          title: register ? 'Реєстрація не вдалася' : 'Вхід не вдався',
          message: result.message,
        });
        const firstRejected = fieldOrder.find((field) => result.fields?.[field]);
        if (firstRejected) focusField(firstRejected);
      }
    } catch {
    } finally {
      pendingRequest.current = null;
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  }

  const signOut = useCallback((message?: string) => {
    void saveRemoteToken(null).catch(() => {});
    setToken(null);
    setWelcome(null);
    setOutcome(message ? { ok: false, title: 'Потрібен вхід', message } : null);
  }, []);

  if (token)
    return (
      <View className="flex-1 bg-canvas">
        {tab === 'tasks' ? (
          <RemoteTasksScreen token={token} welcome={welcome} onSignOut={signOut} />
        ) : (
          <RemoteProfileScreen token={token} onSignOut={signOut} />
        )}
        <View
          accessibilityRole="tablist"
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}
          className="flex-row border-t border-line bg-white px-4 pt-2">
          {tabs.map((item) => {
            const selected = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setTab(item.key);
                  setWelcome(null);
                }}
                accessibilityRole="tab"
                aria-selected={selected}
                className="min-h-12 flex-1 items-center justify-center gap-1">
                <View
                  className={`h-8 w-14 items-center justify-center rounded-full ${selected ? 'bg-accent' : ''}`}>
                  <Icon name={item.icon} size={20} color={selected ? '#253D32' : '#7A8177'} />
                </View>
                <Text
                  className={`text-[11px] ${selected ? 'font-semibold text-forest' : 'text-[#7A8177]'}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="grow items-center justify-center p-5 sm:p-8">
          <View className="w-full max-w-[440px] py-3">
            <View className="flex-row items-center justify-between">
              <Brand />
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Назад до входу в Bloom"
                className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-white active:bg-canvas">
                <Icon name="close" size={19} color="#253D32" />
              </Pressable>
            </View>
            <View className="mb-7 mt-8 flex-row rounded-2xl border border-line bg-[#ECEFE5] p-1">
              {(
                [
                  { key: 'login', label: 'Вхід' },
                  { key: 'register', label: 'Реєстрація' },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => changeMode(item.key)}
                  disabled={isSubmitting}
                  accessibilityRole="tab"
                  aria-selected={mode === item.key}
                  className={`min-h-12 flex-1 items-center justify-center rounded-xl ${mode === item.key ? 'bg-white' : ''}`}>
                  <Text
                    className={`text-sm ${mode === item.key ? 'font-semibold text-forest' : 'text-[#656D62]'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mb-7">
              <Text
                accessibilityRole="header"
                className="text-[35px] font-semibold leading-[41px] tracking-[-1.2px] text-forest">
                {register ? 'Реєстрація на\nсервері ITStep.' : 'Вхід через\nсервер ITStep.'}
              </Text>
              <Text className="mt-3 text-[14px] leading-6 text-[#656D62]">
                Запит надсилається на {ITSTEP_API_URL.replace('https://', '')}.
              </Text>
            </View>
            <View key={mode} className="gap-4">
              {register && (
                <>
                  <PhotoField
                    photo={values.photo}
                    error={errors.photo}
                    disabled={isSubmitting}
                    hint="Необов’язково. До 5 МБ"
                    onChange={(photo, error) => {
                      setValues((current) => ({ ...current, photo }));
                      setErrors((current) => ({ ...current, photo: error || undefined }));
                      setOutcome(null);
                    }}
                  />
                  <FormField
                    editable={!isSubmitting}
                    nativeID="remote-first-name"
                    label="Ім’я"
                    icon="user"
                    placeholder="Твоє ім’я"
                    value={values.firstName}
                    onChangeText={(value) => update('firstName', value)}
                    error={errors.firstName}
                    inputRef={firstNameRef}
                    autoComplete="given-name"
                    textContentType="givenName"
                    maxLength={60}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                  <FormField
                    editable={!isSubmitting}
                    nativeID="remote-last-name"
                    label="Прізвище"
                    icon="user"
                    placeholder="Твоє прізвище"
                    value={values.lastName}
                    onChangeText={(value) => update('lastName', value)}
                    error={errors.lastName}
                    inputRef={lastNameRef}
                    autoComplete="family-name"
                    textContentType="familyName"
                    maxLength={60}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </>
              )}
              <FormField
                editable={!isSubmitting}
                nativeID="remote-email"
                label="Електронна пошта"
                icon="mail"
                placeholder="you@example.com"
                value={values.email}
                onChangeText={(value) => update('email', value)}
                error={errors.email}
                inputRef={emailRef}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={254}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <FormField
                editable={!isSubmitting}
                nativeID="remote-password"
                label="Пароль"
                icon="lock"
                placeholder={register ? 'Щонайменше 6 символів' : 'Введи свій пароль'}
                value={values.password}
                onChangeText={(value) => update('password', value)}
                error={errors.password}
                inputRef={passwordRef}
                password
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={register ? 'new-password' : 'current-password'}
                textContentType={register ? 'newPassword' : 'password'}
                maxLength={128}
                returnKeyType={register ? 'next' : 'go'}
                submitBehavior={register ? 'submit' : 'blurAndSubmit'}
                onSubmitEditing={register ? () => confirmRef.current?.focus() : submit}
              />
              {register && (
                <FormField
                  editable={!isSubmitting}
                  nativeID="remote-confirm"
                  label="Повтори пароль"
                  icon="lock"
                  placeholder="Ще раз, щоб без помилок"
                  value={values.confirmPassword}
                  onChangeText={(value) => update('confirmPassword', value)}
                  error={errors.confirmPassword}
                  inputRef={confirmRef}
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  maxLength={128}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              )}
            </View>
            {outcome && (
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className={`mt-5 flex-row items-start gap-3 rounded-2xl p-4 ${outcome.ok ? 'bg-[#E4F2D2]' : 'bg-[#F9E7E2]'}`}>
                <Icon
                  name={outcome.ok ? 'check' : 'close'}
                  size={19}
                  color={outcome.ok ? '#2F6B3A' : '#A23C30'}
                />
                <View className="flex-1">
                  <Text
                    className={`text-sm font-semibold ${outcome.ok ? 'text-[#2F6B3A]' : 'text-[#A23C30]'}`}>
                    {outcome.title}
                  </Text>
                  <Text
                    className={`mt-1 text-sm leading-5 ${outcome.ok ? 'text-[#2F6B3A]' : 'text-[#A23C30]'}`}>
                    {outcome.message}
                  </Text>
                </View>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={`mb-5 mt-7 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-forest px-5 active:opacity-80 ${isSubmitting ? 'opacity-70' : ''}`}>
              <Text className="text-[15px] font-semibold text-accent">
                {isSubmitting
                  ? register
                    ? 'Реєструємо…'
                    : 'Входимо…'
                  : register
                    ? 'Зареєструватися'
                    : 'Увійти'}
              </Text>
              {isSubmitting ? (
                <ActivityIndicator color="#DDF69A" size="small" />
              ) : (
                <Icon name="arrow" size={19} color="#DDF69A" />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
