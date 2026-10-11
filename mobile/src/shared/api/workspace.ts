import { request } from './client';
import { type TaskInput, type Workspace } from './types';

export type TimerAction = 'start' | 'pause' | 'reset' | 'duration';

export const getWorkspace = () => request<Workspace>('me/workspace');

export const createTask = (task: TaskInput) => request<Workspace>('me/tasks', 'POST', task);

export const updateTask = (id: string, task: TaskInput) =>
  request<Workspace>(`me/tasks/${id}`, 'PUT', task);

export const deleteTask = (id: string) => request<Workspace>(`me/tasks/${id}`, 'DELETE');

export const updateTimer = (action: TimerAction, durationMinutes?: number) =>
  request<Workspace>('me/timer', 'POST', { action, durationMinutes });
