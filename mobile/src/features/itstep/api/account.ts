import { type PhotoInput } from '@/shared/api/types';
import { readToken, writeToken } from '@/shared/utils/tokenStorage';

import { authorized, ITSTEP_API_URL, send, type RemoteErrors, type RemoteFailure } from './client';

const tokenKey = 'itstep.token';

export const saveRemoteToken = (token: string | null) => writeToken(tokenKey, token);

function isExpired(token: string) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(globalThis.atob(payload)) as { exp?: number };
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export async function loadRemoteToken() {
  const token = await readToken(tokenKey);
  if (!token) return null;
  if (isExpired(token)) {
    await saveRemoteToken(null);
    return null;
  }
  return token;
}

export type RemoteProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
  roles: string[];
};
export type RemoteProfileResult = { ok: true; profile: RemoteProfile } | RemoteFailure;
export type RemoteRegistration = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  photo: PhotoInput | null;
};

const post = (path: string, init: RequestInit, signal?: AbortSignal) =>
  send<{ ok: true; token: string }>(
    path,
    { ...init, method: 'POST' },
    (body) =>
      body && typeof body === 'object' && 'token' in body && typeof body.token === 'string'
        ? { ok: true, token: body.token }
        : null,
    signal
  );

function readProfile(body: unknown): { ok: true; profile: RemoteProfile } | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (typeof value.email !== 'string') return null;
  const text = (field: unknown) => (typeof field === 'string' ? field : '');
  return {
    ok: true,
    profile: {
      id: typeof value.id === 'number' ? value.id : 0,
      email: value.email,
      firstName: text(value.firstName),
      lastName: text(value.lastName),
      image: text(value.image),
      roles: Array.isArray(value.roles)
        ? value.roles.filter((role) => typeof role === 'string')
        : [],
    },
  };
}

export const getRemoteProfile = (
  token: string,
  signal?: AbortSignal
): Promise<RemoteProfileResult> =>
  authorized(token, 'Account/Profile', { method: 'GET' }, readProfile, signal);

export const remotePhotoUrl = (image: string, size: 64 | 800 | 1280 = 800) =>
  image ? `${ITSTEP_API_URL}/images/${encodeURIComponent(image)}_${size}.webp` : null;

export const remoteLogin = (email: string, password: string, signal?: AbortSignal) =>
  post(
    'Account/Login',
    {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    },
    signal
  );

export function remoteRegister(values: RemoteRegistration, signal?: AbortSignal) {
  const form = new FormData();
  form.append('FirstName', values.firstName.trim());
  form.append('LastName', values.lastName.trim());
  form.append('Email', values.email.trim());
  form.append('Password', values.password);
  form.append('ConfirmPassword', values.confirmPassword);
  const photo = values.photo;
  if (photo?.file) form.append('ImageFile', photo.file, photo.name);
  else if (photo)
    form.append('ImageFile', { uri: photo.uri, name: photo.name, type: photo.type } as any);
  return post('Account/Register', { body: form }, signal);
}

export function validateRemoteRegistration(values: RemoteRegistration): RemoteErrors {
  const errors: RemoteErrors = {};
  if (!values.firstName.trim()) errors.firstName = 'Вкажи ім’я.';
  if (!values.lastName.trim()) errors.lastName = 'Вкажи прізвище.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Вкажи коректну адресу електронної пошти.';
  if (!values.password) errors.password = 'Введи пароль.';
  else if (values.password.length < 6)
    errors.password = 'Пароль має містити щонайменше 6 символів.';
  if (!values.confirmPassword || values.confirmPassword !== values.password)
    errors.confirmPassword = 'Паролі мають збігатися.';
  return errors;
}
