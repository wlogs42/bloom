import { Text, View } from 'react-native';

import { Icon } from './Icon';

export function Brand() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-9 w-9 items-center justify-center rounded-[13px] bg-accent">
        <Icon name="leaf" size={24} />
      </View>
      <Text className="text-[27px] font-semibold tracking-[-1.5px] text-forest">
        bloom<Text className="text-[#7A9461]">.</Text>
      </Text>
    </View>
  );
}
