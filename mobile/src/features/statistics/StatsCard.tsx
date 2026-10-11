import { Text, View } from 'react-native';

import { Icon } from '@/shared/components/Icon';

export function StatsCard({
  focusMinutes,
  completedSessions,
  completedTasks,
  totalTasks,
}: {
  focusMinutes: number;
  completedSessions: number;
  completedTasks: number;
  totalTasks: number;
}) {
  const completion = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <View className="rounded-[28px] border border-line bg-white p-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-[17px] font-semibold tracking-[-0.3px] text-ink">Твій прогрес</Text>
        <Icon name="chart" size={19} color="#7A8177" />
      </View>
      <View className="mb-6 mt-7 flex-row">
        <View className="flex-1">
          <Text className="text-[32px] font-medium tracking-[-1.5px] text-forest">
            {focusMinutes}
            <Text className="text-[13px] font-normal tracking-normal text-[#656D62]"> хв</Text>
          </Text>
          <Text className="mt-1 text-[11px] text-[#656D62]">сьогодні у фокусі</Text>
        </View>
        <View className="flex-1 border-l border-line pl-5">
          <Text className="text-[32px] font-medium tracking-[-1.5px] text-forest">
            {completedTasks}
            <Text className="text-[17px] font-normal text-[#7A8177]">/{totalTasks}</Text>
          </Text>
          <Text className="mt-1 text-[11px] text-[#656D62]">завдань готово</Text>
        </View>
        <View className="flex-1 border-l border-line pl-5">
          <Text className="text-[32px] font-medium tracking-[-1.5px] text-forest">
            {completedSessions}
          </Text>
          <Text className="mt-1 text-[11px] text-[#656D62]">сесій сьогодні</Text>
        </View>
      </View>
      <View className="mb-2.5 flex-row items-center justify-between">
        <Text className="text-xs text-[#656D62]">Крок за кроком</Text>
        <Text className="text-xs font-semibold text-forest">{completion}%</Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full bg-canvas"
        accessibilityRole="progressbar"
        accessibilityLabel="Виконані завдання"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completion}>
        <View className="h-full rounded-full bg-[#A5BF7A]" style={{ width: `${completion}%` }} />
      </View>
    </View>
  );
}
