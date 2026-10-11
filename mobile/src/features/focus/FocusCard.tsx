import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/shared/components/Icon';

type FocusCardProps = {
  disabled?: boolean;
  hasStarted?: boolean;
  remainingSeconds: number;
  durationMinutes: number;
  isRunning: boolean;
  startPause: () => void;
  reset: () => void;
  setDuration: (minutes: number) => void;
};

export function FocusCard({
  disabled = false,
  hasStarted = false,
  remainingSeconds,
  durationMinutes,
  isRunning,
  startPause,
  reset,
  setDuration,
}: FocusCardProps) {
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  const circumference = 2 * Math.PI * 84;
  const progress = remainingSeconds / (durationMinutes * 60);

  return (
    <View className="flex-1 overflow-hidden rounded-[28px] bg-forest p-6">
      <View className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-[#405748]" />
      <View className="absolute -right-4 -top-16 h-48 w-48 rounded-full border border-[#405748]" />
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-accent" />
          <Text className="text-[10px] font-bold tracking-[2px] text-accent">ТВІЙ ЧАС ФОКУСУ</Text>
        </View>
        <Icon name="sun" size={23} color="#DDF69A" />
      </View>
      <Text className="mt-4 text-[25px] font-semibold tracking-[-0.7px] text-white">
        Одна справа. Повна увага.
      </Text>
      <View className="my-3 items-center">
        <View
          className="h-[190px] w-[190px] items-center justify-center"
          accessibilityLabel={`Залишилось ${minutes} хвилин ${seconds} секунд`}>
          <View className="absolute inset-0">
            <Svg width={190} height={190} viewBox="0 0 190 190">
              <Circle cx={95} cy={95} r={84} stroke="#49604E" strokeWidth={2} fill="none" />
              <Circle
                cx={95}
                cy={95}
                r={84}
                stroke="#DDF69A"
                strokeWidth={3}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                transform="rotate(-90 95 95)"
              />
            </Svg>
          </View>
          <Text
            className="text-[49px] font-light tracking-[-2px] text-white"
            style={{ fontVariant: ['tabular-nums'] }}>
            {minutes}:{seconds}
          </Text>
          <Text className="mt-1 text-[11px] tracking-[1px] text-[#C0CFBB]">
            {remainingSeconds === 0
              ? 'ЧУДОВА РОБОТА!'
              : isRunning
                ? 'ТИ У ПОТОЦІ'
                : 'БЕЗ ЗАЙВОГО ШУМУ'}
          </Text>
        </View>
      </View>
      <View className="mb-5 flex-row justify-center gap-2">
        {[15, 25, 45].map((duration) => (
          <Pressable
            disabled={disabled}
            key={duration}
            accessibilityRole="button"
            accessibilityLabel={`Тривалість ${duration} хвилин`}
            aria-selected={durationMinutes === duration}
            onPress={() => setDuration(duration)}
            className={`min-h-10 min-w-16 items-center justify-center rounded-full px-3 active:opacity-70 ${durationMinutes === duration ? 'bg-[#4A604E]' : 'bg-transparent'}`}>
            <Text
              className={`text-xs ${durationMinutes === duration ? 'font-semibold text-white' : 'text-[#C0CFBB]'}`}>
              {duration} хв
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-3">
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          onPress={startPause}
          className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-accent px-3 active:opacity-80">
          <Icon name={isRunning ? 'pause' : 'play'} size={18} />
          <Text className="text-[14px] font-semibold text-forest">
            {isRunning
              ? 'Зробити паузу'
              : remainingSeconds === 0
                ? 'Ще один підхід'
                : hasStarted
                  ? 'Продовжити'
                  : 'Почати фокус'}
          </Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Скинути таймер"
          onPress={reset}
          className="h-14 w-14 items-center justify-center rounded-2xl border border-[#63745C] active:bg-[#405748]">
          <Icon name="reset" size={21} color="#DDF69A" />
        </Pressable>
      </View>
    </View>
  );
}
