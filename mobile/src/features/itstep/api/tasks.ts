import { authorized, type RemoteErrors } from './client';

export type RemoteOption = { id: number; name: string };
export type RemoteTask = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  statusId: number;
  status: string;
  priorityId: number;
  priority: string;
};
export type RemoteTaskInput = {
  title: string;
  description: string;
  dueDate: string;
  statusId: number;
  priorityId: number;
};

function readTask(body: unknown): RemoteTask | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (typeof value.id !== 'number' || typeof value.title !== 'string') return null;
  const text = (field: unknown) => (typeof field === 'string' ? field : null);
  const id = (field: unknown) => (typeof field === 'number' ? field : 0);
  return {
    id: value.id,
    title: value.title,
    description: text(value.description),
    dueDate: text(value.dueDate),
    completedAt: text(value.completedAt),
    statusId: id(value.statusId),
    status: text(value.status) ?? '',
    priorityId: id(value.priorityId),
    priority: text(value.priority) ?? '',
  };
}

function readOptions(body: unknown): { ok: true; options: RemoteOption[] } | null {
  if (!Array.isArray(body)) return null;
  const options = body.filter(
    (item): item is RemoteOption =>
      !!item && typeof item.id === 'number' && typeof item.name === 'string'
  );
  return { ok: true, options };
}

export const getRemoteTasks = (token: string, signal?: AbortSignal) =>
  authorized(
    token,
    'Tasks',
    { method: 'GET' },
    (body) => {
      if (!Array.isArray(body)) return null;
      const tasks = body.map(readTask).filter((task): task is RemoteTask => !!task);
      return { ok: true as const, tasks };
    },
    signal
  );

export async function getRemoteTaskOptions(token: string, signal?: AbortSignal) {
  const [statuses, priorities] = await Promise.all([
    authorized(token, 'Tasks/statuses', { method: 'GET' }, readOptions, signal),
    authorized(token, 'Tasks/priorities', { method: 'GET' }, readOptions, signal),
  ]);
  if (!statuses.ok) return statuses;
  if (!priorities.ok) return priorities;
  return { ok: true as const, statuses: statuses.options, priorities: priorities.options };
}

export function parseDueDate(text: string): string | null | undefined {
  if (!text.trim()) return null;
  const match = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return undefined;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1) return undefined;
  return date.toISOString();
}

export function formatDueDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const two = (value: number) => String(value).padStart(2, '0');
  return `${two(date.getUTCDate())}.${two(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

export function validateRemoteTask(values: RemoteTaskInput): RemoteErrors {
  const errors: RemoteErrors = {};
  if (!values.title.trim()) errors.title = 'Вкажи назву задачі.';
  else if (values.title.trim().length > 200) errors.title = 'Назва має бути до 200 символів.';
  if (values.description.trim().length > 2000)
    errors.description = 'Опис має бути до 2000 символів.';
  if (parseDueDate(values.dueDate) === undefined)
    errors.dueDate = 'Вкажи дату у форматі ДД.ММ.РРРР.';
  if (!values.statusId) errors.statusId = 'Обери статус.';
  if (!values.priorityId) errors.priorityId = 'Обери пріоритет.';
  return errors;
}

export const saveRemoteTask = (
  token: string,
  id: number | null,
  values: RemoteTaskInput,
  signal?: AbortSignal
) =>
  authorized(
    token,
    id === null ? 'Tasks' : `Tasks/${id}`,
    {
      method: id === null ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: values.title.trim(),
        description: values.description.trim() || null,
        dueDate: parseDueDate(values.dueDate) ?? null,
        statusId: values.statusId,
        priorityId: values.priorityId,
      }),
    },
    (body) => {
      const task = readTask(body);
      return task ? { ok: true as const, task } : null;
    },
    signal
  );
