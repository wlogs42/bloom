import { request } from '@/shared/api/client';
import { type UserProfile } from '@/shared/api/types';

export const updateProfile = (name: string, email: string) =>
  request<UserProfile>('me', 'PUT', { name: name.trim(), email: email.trim().toLowerCase() });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<void>('me/password', 'PUT', { currentPassword, newPassword });
