import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/shared/components/Icon';

import { type Tab, tabs } from './tabs';

export function BottomTabs({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <SafeAreaView edges={['bottom']} className="border-t border-line bg-canvas">
      <View className="flex-row px-4 pb-1 pt-2">
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            aria-selected={tab === item.key}
            className="min-h-[60px] flex-1 items-center justify-center gap-1 active:opacity-60">
            <View
              className={`h-8 w-14 items-center justify-center rounded-full ${tab === item.key ? 'bg-accent' : ''}`}>
              <Icon name={item.icon} size={20} color={tab === item.key ? '#253D32' : '#7A8177'} />
            </View>
            <Text
              className={`text-[10px] ${tab === item.key ? 'font-semibold text-forest' : 'text-[#656D62]'}`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
