import { Text, View } from 'react-native';

import { type FocusSession } from '@/shared/api/types';
import { localDay } from '@/shared/utils/date';

export function ProgressHistory({ sessions, now }: { sessions: FocusSession[]; now: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - 6 + i);
    return {
      date,
      minutes: sessions
        .filter((s) => localDay(s.completedAt) === localDay(date))
        .reduce((sum, s) => sum + s.minutes, 0),
    };
  });
  const max = Math.max(1, ...days.map((day) => day.minutes));

  return (
    <View className="gap-5">
      <View className="rounded-[28px] border border-line bg-white p-6">
        <Text className="text-xl font-semibold text-forest">Твій тиждень</Text>
        <Text className="mt-2 text-xs text-[#656D62]">Хвилини завершених сесій фокусу</Text>
        <View className="mt-6 flex-row items-end gap-2">
          {days.map((day) => (
            <View key={localDay(day.date)} className="flex-1 items-center gap-2">
              <Text className="text-xs text-forest">{day.minutes}</Text>
              <View className="h-24 w-full justify-end rounded-lg bg-canvas">
                <View
                  className="w-full rounded-lg bg-accent"
                  style={{ height: day.minutes ? Math.max(4, (day.minutes / max) * 96) : 0 }}
                />
              </View>
              <Text className="text-[10px] text-[#656D62]">
                {day.date.toLocaleDateString('uk-UA', { weekday: 'short' })}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View className="rounded-[28px] border border-line bg-white p-6">
        <Text className="mb-3 text-xl font-semibold text-forest">Історія фокусу</Text>
        {!sessions.length && (
          <Text className="py-4 text-sm leading-6 text-[#656D62]">
            Тут з’являться твої завершені сесії. Почни з одного підходу у вкладці «Сьогодні».
          </Text>
        )}
        {[...sessions]
          .reverse()
          .slice(0, 20)
          .map((session) => (
            <View
              key={session.id}
              className="flex-row items-center justify-between gap-3 border-b border-line py-4">
              <Text className="flex-1 text-xs text-[#656D62]">
                {new Date(session.completedAt).toLocaleString('uk-UA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text className="text-sm font-semibold text-forest">{session.minutes} хв</Text>
            </View>
          ))}
      </View>
    </View>
  );
}
