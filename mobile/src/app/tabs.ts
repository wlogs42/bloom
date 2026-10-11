import { type IconName } from '@/shared/components/Icon';

export type Tab = 'today' | 'tasks' | 'progress' | 'profile';

export const tabs: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'today', label: 'Сьогодні', icon: 'home' },
  { key: 'tasks', label: 'Завдання', icon: 'tasks' },
  { key: 'progress', label: 'Мій ритм', icon: 'chart' },
  { key: 'profile', label: 'Профіль', icon: 'user' },
];

export const headings: Record<Tab, { title: string; subtitle: string }> = {
  today: {
    title: 'Менше шуму.\nБільше фокусу.',
    subtitle: 'Хороший день починається з однієї справи.',
  },
  tasks: {
    title: 'Місце для\nважливого.',
    subtitle: 'Збери думки. Обери наступний маленький крок.',
  },
  progress: {
    title: 'Зростай у\nсвоєму темпі.',
    subtitle: 'Кожна хвилина уваги до себе має значення.',
  },
  profile: {
    title: 'Твій простір.\nТвої правила.',
    subtitle: 'Твої дані, налаштування та досягнення.',
  },
};
