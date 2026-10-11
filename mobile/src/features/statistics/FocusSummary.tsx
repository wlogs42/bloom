import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/shared/components/Icon';

export function FocusSummary({
  focusMinutes,
  completedSessions,
  onOpenFocus,
}: {
  focusMinutes: number;
  completedSessions: number;
  onOpenFocus: () => void;
}) {
  return (
    <View className="rounded-[28px] border border-line bg-white p-6">
      <View className="mb-5 h-12 w-12 items-center justify-center rounded-2xl bg-accent">
        <Icon name="sun" size={25} />
      </View>
      <Text className="text-[23px] font-semibold tracking-[-0.6px] text-forest">
        {completedSessions ? 'Твоя увага дає плоди.' : 'Перший крок — просто почати.'}
      </Text>
      <Text className="mb-5 mt-3 text-sm leading-6 text-[#656D62]">
        {completedSessions
          ? `Завершені сесії: ${completedSessions}. Час у фокусі: ${focusMinutes} хв. Дозволь собі маленьку перерву.`
          : 'Заверши першу сесію фокусу — тут з’явиться твій результат. Без перегонів і порівнянь.'}
      </Text>
      <Pressable
        onPress={onOpenFocus}
        accessibilityRole="button"
        className="min-h-12 flex-row items-center justify-between rounded-2xl bg-canvas px-4 active:bg-accent">
        <Text className="text-sm font-medium text-forest">До мого фокусу</Text>
        <Icon name="arrow" size={20} />
      </Pressable>
    </View>
  );
}
