export type AuthMode = 'login' | 'register';
export type AuthValues = { name: string; email: string; password: string; confirmPassword: string };
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;

export function validateAuthForm(mode: AuthMode, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  if (mode === 'register' && values.name.trim().length < 2) {
    errors.name = 'Вкажи ім’я — щонайменше 2 символи.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.trim().length > 254) {
    errors.email = 'Вкажи коректну адресу електронної пошти.';
  }
  if (!values.password.trim()) {
    errors.password = 'Введи пароль.';
  } else if (mode === 'register' && values.password.length < 8) {
    errors.password = 'Пароль має містити щонайменше 8 символів.';
  }
  if (
    mode === 'register' &&
    (!values.confirmPassword || values.confirmPassword !== values.password)
  ) {
    errors.confirmPassword = 'Паролі мають збігатися.';
  }
  return errors;
}
