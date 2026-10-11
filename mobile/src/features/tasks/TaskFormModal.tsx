import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { type Task, type TaskInput } from '@/shared/api/types';
import { Icon } from '@/shared/components/Icon';

const categories = ['Робота', 'Особисте'] as const;
const durations = [10, 15, 25, 45];

export function TaskFormModal({
  visible,
  task,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  task: Task | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: TaskInput) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [category, setCategory] = useState<Task['category']>(task?.category ?? 'Робота');
  const [minutes, setMinutes] = useState(task?.minutes ?? 25);
  const empty = !title.trim();

  function submit() {
    if (empty) return;
    onSubmit({ title: title.trim(), category, minutes, completed: task?.completed ?? false });
  }

  return (
    <Modal
      accessibilityLabel={task ? 'Редагувати завдання' : 'Нове завдання'}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/40">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow items-center justify-center px-5 py-12"
          keyboardShouldPersistTaps="handled">
          <View
            accessibilityViewIsModal
            className="w-full max-w-[440px] rounded-[28px] bg-canvas p-6">
            <View className="mb-6 flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-[24px] font-semibold tracking-[-0.7px] text-forest">
                {task ? 'Редагувати завдання' : 'Новий маленький крок'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Закрити"
                onPress={onClose}
                className="h-11 w-11 items-center justify-center rounded-full bg-white">
                <Icon name="close" size={20} />
              </Pressable>
            </View>
            {!!error && (
              <Text accessibilityRole="alert" className="mb-4 text-sm text-[#A23C30]">
                {error}
              </Text>
            )}
            <Text className="mb-2 text-xs font-medium text-[#656D62]">Що хочеш зробити?</Text>
            <TextInput
              autoFocus
              editable={!busy}
              accessibilityLabel="Назва завдання"
              placeholder="Наприклад, знайти нову ідею"
              placeholderTextColor="#7A8177"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              onSubmitEditing={submit}
              returnKeyType="done"
              className="min-h-14 rounded-2xl border border-line bg-white px-4 text-sm text-ink"
            />
            <Text className="mb-3 mt-5 text-xs font-medium text-[#656D62]">Для чого цей час?</Text>
            <View className="flex-row gap-2">
              {categories.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  aria-selected={category === item}
                  onPress={() => setCategory(item)}
                  className={`min-h-11 flex-1 items-center justify-center rounded-xl ${category === item ? 'bg-accent' : 'bg-white'}`}>
                  <Text className="text-sm text-forest">{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="mb-3 mt-5 text-xs font-medium text-[#656D62]">
              Скільки часу виділимо?
            </Text>
            <View className="flex-row gap-2">
              {durations.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  aria-selected={minutes === item}
                  onPress={() => setMinutes(item)}
                  className={`min-h-11 flex-1 items-center justify-center rounded-xl ${minutes === item ? 'bg-accent' : 'bg-white'}`}>
                  <Text className="text-sm text-forest">{item} хв</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              aria-disabled={empty}
              disabled={empty || busy}
              onPress={submit}
              className={`mt-7 min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-forest active:opacity-80 ${empty ? 'opacity-40' : ''}`}>
              <Icon name="plus" size={18} color="#DDF69A" />
              <Text className="font-semibold text-accent">
                {busy ? 'Зберігаємо…' : task ? 'Зберегти завдання' : 'Додати до мого дня'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
