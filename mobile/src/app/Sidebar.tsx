import { Pressable, Text, View } from 'react-native';

import { type UserProfile } from '@/shared/api/types';
import { Brand } from '@/shared/components/Brand';
import { Icon } from '@/shared/components/Icon';

import { type Tab, tabs } from './tabs';

export function Sidebar({
  tab,
  profile,
  onChange,
}: {
  tab: Tab;
  profile: UserProfile;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View className="w-[228px] border-r border-line px-6 pb-8 pt-9">
      <Brand />
      <Text className="mb-9 mt-2 text-[11px] tracking-[0.5px] text-[#656D62]">
        Трохи більше простору для себе.
      </Text>
      <View className="gap-2">
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            aria-selected={tab === item.key}
            onPress={() => onChange(item.key)}
            className={`min-h-12 flex-row items-center gap-3 rounded-2xl px-4 active:opacity-70 ${tab === item.key ? 'bg-accent' : ''}`}>
            <Icon name={item.icon} size={20} color={tab === item.key ? '#253D32' : '#7A8177'} />
            <Text
              className={`text-[13px] ${tab === item.key ? 'font-semibold text-forest' : 'text-[#656D62]'}`}>
              {item.label}
            </Text>
            {tab === item.key && <View className="ml-auto h-1.5 w-1.5 rounded-full bg-forest" />}
          </Pressable>
        ))}
      </View>
      <View className="mt-auto rounded-2xl border border-line p-4">
        <Icon name="leaf" size={25} />
        <Text className="mt-3 text-[16px] font-medium leading-6 text-forest">
          Твій простір.{`\n`}Твій темп.
        </Text>
        <Text className="mt-2 text-[11px] leading-4 text-[#656D62]">
          Залишай місце для того,{`\n`}що надихає.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Відкрити профіль"
        onPress={() => onChange('profile')}
        className="mt-6 flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E4EAD9]">
          <Text className="font-semibold text-forest">{profile.name[0]?.toUpperCase()}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-xs font-medium text-ink">
            {profile.name}
          </Text>
          <Text className="mt-0.5 text-[10px] text-[#656D62]">Профіль</Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full">
          <Icon name="user" size={20} />
        </View>
      </Pressable>
    </View>
  );
}
