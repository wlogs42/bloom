import { Modal, Pressable, Text, View } from 'react-native';

import { type Task } from '@/shared/api/types';

export function DeleteTaskModal({
  task,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  task: Task | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={!!task}
      transparent
      animationType="fade"
      accessibilityLabel="Видалити завдання"
      onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View className="w-full max-w-[440px] rounded-[28px] bg-canvas p-6">
          <Text className="text-xl font-semibold text-forest">Видалити завдання?</Text>
          <Text className="my-4 text-sm text-[#656D62]">{task?.title}</Text>
          {!!error && (
            <Text accessibilityRole="alert" className="mb-4 text-sm text-[#A23C30]">
              {error}
            </Text>
          )}
          <View className="flex-row gap-3">
            <Pressable
              disabled={busy}
              accessibilityRole="button"
              onPress={onCancel}
              className="min-h-12 flex-1 items-center justify-center rounded-xl bg-white">
              <Text className="text-forest">Скасувати</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              accessibilityRole="button"
              onPress={onConfirm}
              className="min-h-12 flex-1 items-center justify-center rounded-xl bg-[#A23C30]">
              <Text className="font-semibold text-white">Видалити</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
