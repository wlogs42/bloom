import { Platform } from 'react-native';

export const ITSTEP_API_URL = 'https://webpd411.itstep.click';

export type RemoteField =
  'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'photo';
export type RemoteTaskField = 'title' | 'description' | 'dueDate' | 'statusId' | 'priorityId';
export type RemoteErrors = Partial<Record<RemoteField | RemoteTaskField, string>>;
export type RemoteFailure = { ok: false; message: string; status?: number; fields?: RemoteErrors };

const serverFields: Record<string, RemoteField | RemoteTaskField> = {
  title: 'title',
  description: 'description',
  duedate: 'dueDate',
  statusid: 'statusId',
  priorityid: 'priorityId',
  firstname: 'firstName',
  lastname: 'lastName',
  email: 'email',
  password: 'password',
  confirmpassword: 'confirmPassword',
  imagefile: 'photo',
};

function translate(message: string) {
  const length = message.match(/at least (\d+) characters/i);
  if (length) return `Пароль має містити щонайменше ${length[1]} символів.`;
  const different = message.match(/at least (\d+) different characters/i);
  if (different) return `Пароль має містити щонайменше ${different[1]} різних символів.`;
  if (/field is required/i.test(message)) return 'Заповни це поле.';
  if (/non alphanumeric/i.test(message)) return 'Пароль має містити спеціальний символ.';
  if (/one digit/i.test(message)) return 'Пароль має містити цифру.';
  if (/one uppercase/i.test(message)) return 'Пароль має містити велику літеру.';
  if (/one lowercase/i.test(message)) return 'Пароль має містити малу літеру.';
  if (/not a valid e-?mail/i.test(message)) return 'Вкажи коректну адресу електронної пошти.';
  if (/do not match/i.test(message)) return 'Паролі мають збігатися.';
  return message;
}

function fieldOf(message: string): RemoteField | RemoteTaskField | undefined {
  if (/статус/i.test(message)) return 'statusId';
  if (/пріоритет/i.test(message)) return 'priorityId';
  if (/пошт|e-?mail/i.test(message)) return 'email';
  if (/парол|password/i.test(message)) return 'password';
  if (/фото|зображен|image|file/i.test(message)) return 'photo';
}

function failure(status: number, body: unknown, text: string): RemoteFailure {
  const fields: RemoteErrors = {};
  let message = '';
  if (body && typeof body === 'object') {
    if ('errors' in body && body.errors && typeof body.errors === 'object') {
      for (const [key, value] of Object.entries(body.errors)) {
        const first = Array.isArray(value) ? value[0] : value;
        if (typeof first !== 'string') continue;
        const field = serverFields[key.toLowerCase()];
        if (field) fields[field] ??= translate(first);
        else message ||= translate(first);
      }
    }
    const single =
      'error' in body && typeof body.error === 'string'
        ? body.error
        : 'message' in body && typeof body.message === 'string'
          ? body.message
          : '';
    if (single) {
      const field = fieldOf(single);
      if (field) fields[field] ??= translate(single);
      else message ||= translate(single);
    }
  } else if (text && !text.trimStart().startsWith('<')) message = text.trim();

  const rejected = Object.values(fields);
  const hasFields = rejected.length > 0;
  if (!message && rejected.length === 1) message = rejected[0];
  const fallback: Record<number, string> = {
    400: 'Сервер відхилив дані. Перевір заповнення полів.',
    401: 'Неправильна пошта або пароль.',
    413: 'Фото завелике для сервера. Обери менший файл.',
    415: 'Сервер не прийняв формат запиту.',
    429: 'Забагато спроб. Зачекай хвилину і спробуй ще раз.',
  };
  if (status === 413) fields.photo = fallback[413];
  return {
    ok: false,
    status,
    message:
      (status === 401 ? fallback[401] : message) ||
      (hasFields ? 'Виправ позначені поля.' : '') ||
      fallback[status] ||
      (status >= 500
        ? `Сервер тимчасово не працює (${status}). Спробуй пізніше.`
        : `Сервер повернув помилку ${status}.`),
    ...(hasFields || status === 413 ? { fields } : {}),
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function send<T extends { ok: true }>(
  path: string,
  init: RequestInit,
  read: (body: unknown) => T | null,
  signal?: AbortSignal
): Promise<T | RemoteFailure> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(cancel, init.body instanceof FormData ? 30_000 : 10_000);
  try {
    const response = await fetch(`${ITSTEP_API_URL}/api/${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
      signal: controller.signal,
    });
    const text = await response.text();
    const body = parseJson(text);
    if (!response.ok) return failure(response.status, body, text);
    return read(body) ?? { ok: false, message: 'Сервер повернув неочікувану відповідь.' };
  } catch {
    if (signal?.aborted) throw new Error('aborted');
    if (controller.signal.aborted)
      return { ok: false, message: 'Сервер не відповів вчасно. Спробуй ще раз.' };
    return {
      ok: false,
      message:
        Platform.OS === 'web'
          ? 'Браузер заблокував запит: сервер не дозволяє CORS. Відкрий застосунок в Expo Go або емуляторі.'
          : 'Не вдалося з’єднатися з сервером. Перевір підключення до інтернету.',
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}

export async function authorized<T extends { ok: true }>(
  token: string,
  path: string,
  init: RequestInit,
  read: (body: unknown) => T | null,
  signal?: AbortSignal
): Promise<T | RemoteFailure> {
  const result = await send(
    path,
    { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } },
    read,
    signal
  );
  return !result.ok && result.status === 401
    ? { ...result, message: 'Сесія завершилася. Увійди знову.' }
    : result;
}
