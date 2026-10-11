import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { type PhotoInput, type UserProfile } from '@/shared/api/types';
import { Brand } from '@/shared/components/Brand';
import { FormField } from '@/shared/components/FormField';
import { Icon } from '@/shared/components/Icon';
import { PhotoField } from '@/shared/components/PhotoField';

import { login, register as registerUser } from './api';
import { type AuthErrors, type AuthMode, type AuthValues, validateAuthForm } from './validation';

function GrowthArtwork() {
  return (
    <View className="my-8 items-center">
      <Svg width={280} height={258} viewBox="0 0 280 258" fill="none">
        <Circle cx={140} cy={128} r={113} stroke="#53684D" />
        <Circle cx={140} cy={128} r={87} stroke="#53684D" strokeDasharray="3 8" />
        <Path
          d="M140 233V101m0 72c-8-28-34-45-62-48m62 81c13-32 34-46 61-53"
          stroke="#DDF69A"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path d="M140 127C91 91 118 42 155 29c25 36 20 76-15 98Z" fill="#DDF69A" />
        <Path d="M137 183C83 192 49 156 53 114c50-2 83 23 84 69Z" fill="#98B777" />
        <Path d="M144 211c-3-48 30-80 79-75-1 47-28 78-79 75Z" fill="#BBD68A" />
        <Path
          d="m142 112 6-61m-20 119-53-38m77 67 50-45"
          stroke="#253D32"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path d="M105 238h70" stroke="#DDF69A" strokeWidth={3} strokeLinecap="round" />
        <Circle cx={239} cy={54} r={7} fill="#F6DAC4" />
        <Path d="M45 59v16m-8-8h16" stroke="#DDF69A" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const emptyValues: AuthValues = { name: '', email: '', password: '', confirmPassword: '' };

export function AuthScreen({
  onAuthenticated,
  onOpenRemoteLogin,
}: {
  onAuthenticated: (profile: UserProfile) => void;
  onOpenRemoteLogin: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [mode, setMode] = useState<AuthMode>('login');
  const [values, setValues] = useState<AuthValues>(emptyValues);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [photo, setPhoto] = useState<PhotoInput | null>(null);
  const [photoError, setPhotoError] = useState('');
  const pendingRequest = useRef<AbortController | null>(null);
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const register = mode === 'register';

  useEffect(() => () => pendingRequest.current?.abort(), []);

  function changeMode(next: AuthMode) {
    if (next === mode || pendingRequest.current) return;
    Keyboard.dismiss();
    setMode(next);
    setValues((current) => ({ ...emptyValues, email: current.email }));
    setErrors({});
    setPhotoError('');
    setSubmitted(false);
    setServerError('');
  }

  function update(field: keyof AuthValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setServerError('');
    if (submitted) setErrors(validateAuthForm(mode, next));
  }

  async function submit() {
    if (pendingRequest.current) return;
    const nextErrors = validateAuthForm(mode, values);
    setSubmitted(true);
    setErrors(nextErrors);
    const missingPhoto = register && !photo;
    setPhotoError(missingPhoto ? 'Додай фото профілю.' : '');
    const firstInvalid = (['name', 'email', 'password', 'confirmPassword'] as const).find(
      (field) => nextErrors[field]
    );
    if (firstInvalid) {
      ({ name: nameRef, email: emailRef, password: passwordRef, confirmPassword: confirmRef })[
        firstInvalid
      ].current?.focus();
      return;
    }
    if (missingPhoto) return;
    Keyboard.dismiss();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsSubmitting(true);
    setServerError('');
    try {
      const profile = register
        ? await registerUser(values.name, values.email, values.password, photo!, controller.signal)
        : await login(values.email, values.password, controller.signal);
      if (!controller.signal.aborted) {
        setValues(emptyValues);
        setPhoto(null);
        onAuthenticated(profile);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setServerError(error instanceof Error ? error.message : 'Не вдалося виконати вхід.');
      }
    } finally {
      pendingRequest.current = null;
      if (!controller.signal.aborted) setIsSubmitting(false);
    }
  }

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
          <View className={`w-full max-w-[1120px] ${wide ? 'flex-row gap-16' : 'max-w-[440px]'}`}>
            {wide && (
              <View className="flex-1 justify-between overflow-hidden rounded-[36px] bg-forest p-10">
                <View className="flex-row items-center gap-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <Text className="text-[10px] font-semibold tracking-[2px] text-accent">
                    МЕНШЕ ШУМУ. БІЛЬШЕ ТЕБЕ.
                  </Text>
                </View>
                <View>
                  <Text className="mt-10 text-[43px] font-semibold leading-[49px] tracking-[-1.7px] text-white">
                    Добрі звички{`\n`}починаються{`\n`}з простору.
                  </Text>
                  <Text className="mt-5 max-w-[290px] text-[14px] leading-6 text-[#C4D0BE]">
                    Для важливих справ, маленьких перемог і твого власного темпу.
                  </Text>
                </View>
                <GrowthArtwork />
                <View className="flex-row items-center gap-3 border-t border-[#49604E] pt-6">
                  <Icon name="leaf" size={20} color="#DDF69A" />
                  <Text className="flex-1 text-xs leading-5 text-[#C4D0BE]">
                    Крок за кроком — назустріч собі.
                  </Text>
                </View>
              </View>
            )}
            <View className={`w-full ${wide ? 'max-w-[440px] py-5' : 'py-3'}`}>
              <Brand />
              <View className="mb-8 mt-8 flex-row rounded-2xl border border-line bg-[#ECEFE5] p-1">
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
                  className={`${width < 360 ? 'text-[29px] leading-[35px]' : 'text-[35px] leading-[41px]'} font-semibold tracking-[-1.2px] text-forest`}>
                  {register ? 'Почни свою\nісторію зростання.' : 'Раді бачити\nтебе знову.'}
                </Text>
                <Text className="mt-3 text-[14px] leading-6 text-[#656D62]">
                  {register
                    ? 'Трохи знайомства — і твій простір готовий.'
                    : 'Твій фокус, плани й маленькі перемоги чекають.'}
                </Text>
              </View>
              <View key={mode} className="gap-4">
                {register && (
                  <PhotoField
                    photo={photo}
                    error={photoError}
                    disabled={isSubmitting}
                    onChange={(next, error) => {
                      setPhoto(next);
                      setPhotoError(error);
                      setServerError('');
                    }}
                  />
                )}
                {register && (
                  <FormField
                    editable={!isSubmitting}
                    nativeID="auth-name"
                    label="Твоє ім’я"
                    icon="user"
                    placeholder="Як до тебе звертатися?"
                    value={values.name}
                    onChangeText={(value) => update('name', value)}
                    error={errors.name}
                    inputRef={nameRef}
                    autoComplete="name"
                    textContentType="name"
                    maxLength={60}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                )}
                <FormField
                  editable={!isSubmitting}
                  nativeID="auth-email"
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
                  nativeID="auth-password"
                  label="Пароль"
                  icon="lock"
                  placeholder={register ? 'Щонайменше 8 символів' : 'Введи свій пароль'}
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
                    nativeID="auth-confirm"
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
              {!!serverError && (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  className="mt-5 rounded-2xl bg-[#F9E7E2] p-4 text-sm leading-5 text-[#A23C30]">
                  {serverError}
                </Text>
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
                      ? 'Створюємо профіль…'
                      : 'Входимо…'
                    : register
                      ? 'Створити профіль'
                      : 'Увійти'}
                </Text>
                {isSubmitting ? (
                  <ActivityIndicator color="#DDF69A" size="small" />
                ) : (
                  <Icon name="arrow" size={19} color="#DDF69A" />
                )}
              </Pressable>
              <View className="flex-row flex-wrap items-center justify-center">
                <Text className="text-[13px] text-[#656D62]">
                  {register ? 'Уже маєш профіль? ' : 'Ще не з нами? '}
                </Text>
                <Pressable
                  onPress={() => changeMode(register ? 'login' : 'register')}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  className="min-h-11 justify-center px-1">
                  <Text className="text-[13px] font-semibold text-forest underline">
                    {register ? 'Увійти' : 'Зареєструватися'}
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={onOpenRemoteLogin}
                disabled={isSubmitting}
                accessibilityRole="button"
                className="mt-2 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 active:bg-canvas">
                <Text className="text-[13px] font-semibold text-forest">
                  Увійти через сервер ITStep
                </Text>
                <Icon name="arrow" size={17} color="#253D32" />
              </Pressable>
              <View className="mt-5 flex-row items-start gap-3 rounded-2xl border border-line p-4">
                <Icon name="leaf" size={18} color="#7A8177" />
                <Text className="flex-1 text-[11px] leading-[17px] text-[#656D62]">
                  Твої завдання, фокус і прогрес зберігаються у твоєму профілі.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
