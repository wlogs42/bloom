import { ApiError, loadToken, request, saveToken } from '@/shared/api/client';
import { type PhotoInput, type UserProfile } from '@/shared/api/types';

function isProfile(value: unknown): value is UserProfile {
  return (
    !!value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'email' in value &&
    typeof value.email === 'string'
  );
}

async function authenticate(path: string, body: unknown, signal?: AbortSignal) {
  const result = await request<{ user: UserProfile; token: string }>(path, 'POST', body, signal);
  if (!isProfile(result.user) || typeof result.token !== 'string' || !result.token)
    throw new ApiError('Сервер повернув некоректну сесію.');
  await saveToken(result.token);
  return result.user;
}

export const login = (email: string, password: string, signal?: AbortSignal) =>
  authenticate('auth/login', { email: email.trim().toLowerCase(), password }, signal);

export async function register(
  name: string,
  email: string,
  password: string,
  photo: PhotoInput,
  signal?: AbortSignal
) {
  const form = new FormData();
  form.append('name', name.trim());
  form.append('email', email.trim().toLowerCase());
  form.append('password', password);
  if (photo.file) form.append('photo', photo.file, photo.name);
  else form.append('photo', { uri: photo.uri, name: photo.name, type: photo.type } as any);
  return authenticate('auth/register', form, signal);
}

export async function restoreSession() {
  if (!(await loadToken())) return null;
  try {
    return await request<UserProfile>('me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function logout() {
  await request<void>('me/logout', 'POST');
  await saveToken(null);
}
