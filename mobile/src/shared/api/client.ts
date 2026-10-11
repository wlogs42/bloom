import { Platform } from 'react-native';

import { readToken, writeToken } from '@/shared/utils/tokenStorage';

import { type UserProfile } from './types';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050')
).replace(/\/+$/, '');

export const photoUrl = (profile: UserProfile) =>
  profile.photo ? `${API_BASE_URL}${profile.photo}` : null;

const storageKey = 'bloom.session';
let token: string | null = null;
let onExpired: (() => void) | undefined;

export function setSessionExpiredHandler(handler?: () => void) {
  onExpired = handler;
}

export async function saveToken(value: string | null) {
  await writeToken(storageKey, value);
  token = value;
}

export async function loadToken() {
  token = await readToken(storageKey);
  return token;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const requestToken = token;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) controller.abort();
  const form = body instanceof FormData;
  const timeout = setTimeout(cancel, form ? 30_000 : 10_000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !form ? { 'Content-Type': 'application/json' } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
      },
      ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 && path.startsWith('me') && requestToken === token) {
        await saveToken(null);
        onExpired?.();
      }
      const messages: Record<number, string> = {
        400: 'Перевір заповнення полів.',
        401: path.startsWith('auth')
          ? 'Неправильна пошта або пароль.'
          : 'Сесія завершилася. Увійди знову.',
        403: 'Поточний пароль неправильний.',
        404: 'Запис більше не існує. Онови список.',
        409: 'Ця пошта вже використовується.',
        413: 'Фото завелике. Обери файл до 5 МБ.',
      };
      const detail: unknown =
        response.status === 400 && path === 'auth/register'
          ? await response.json().catch(() => null)
          : null;
      const serverMessage =
        detail && typeof detail === 'object' && 'message' in detail ? detail.message : null;
      throw new ApiError(
        (typeof serverMessage === 'string' && serverMessage) ||
          messages[response.status] ||
          'Помилка сервера. Спробуй ще раз пізніше.',
        response.status
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError('Сервер не відповів вчасно. Спробуй ще раз.');
    throw new ApiError('Не вдалося з’єднатися з сервером. Перевір підключення та запусти API.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
