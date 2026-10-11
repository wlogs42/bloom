import { Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

function PlantIllustration() {
  return (
    <Svg width={112} height={136} viewBox="0 0 112 136" fill="none">
      <Ellipse cx={61} cy={126} rx={37} ry={5} fill="#E3C5AC" />
      <Path
        d="M60 99c0-26-3-47 8-78M61 71C45 67 34 56 25 44M61 83c14-11 23-17 32-20"
        stroke="#385A41"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path d="M66 48C42 35 54 10 78 9c8 17 2 33-12 39Z" fill="#466A46" />
      <Path d="M50 67C26 74 11 60 13 38c24-3 37 8 37 29Z" fill="#718C53" />
      <Path d="M65 83c-1-25 16-35 38-31 0 22-16 36-38 31Z" fill="#9CAF6E" />
      <Path d="m37 96 7 29h34l7-29Z" fill="#FBF3E6" />
      <Path d="M37 96h48" stroke="#385A41" strokeWidth={2} strokeLinecap="round" />
      <Path
        d="m67 45 5-25M48 64 26 49m44 30 22-18"
        stroke="#D7E0AD"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function NoteCard() {
  return (
    <View className="min-h-[166px] grow flex-row items-center overflow-hidden rounded-[28px] bg-peach px-6 py-4">
      <View className="flex-1">
        <Text className="mb-2 text-[9px] font-bold tracking-[1.8px] text-[#755B45]">
          НАГАДУВАННЯ ДЛЯ ТЕБЕ
        </Text>
        <Text className="text-[21px] font-medium leading-7 tracking-[-0.6px] text-[#493F31]">
          Не поспішай.{`\n`}Ти вже ростеш.
        </Text>
        <Text className="mt-2 text-[11px] leading-4 text-[#755B45]">Власний темп — теж темп.</Text>
      </View>
      <View className="-mr-2">
        <PlantIllustration />
      </View>
    </View>
  );
}
