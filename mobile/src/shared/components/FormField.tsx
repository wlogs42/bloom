import { useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

import { Icon, type IconName } from './Icon';

type FormFieldProps = TextInputProps & {
  label: string;
  icon: IconName;
  error?: string;
  inputRef?: React.Ref<TextInput>;
  password?: boolean;
};

export function FormField({
  label,
  icon,
  error,
  inputRef,
  password = false,
  ...props
}: FormFieldProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-2">
      <Text className="text-[13px] font-medium text-forest">{label}</Text>
      <View
        className={`min-h-14 flex-row items-center gap-3 rounded-2xl border bg-white pl-4 ${error ? 'border-[#B64A3B]' : focused ? 'border-forest' : 'border-line'}`}>
        <Icon name={icon} size={19} color={error ? '#B64A3B' : '#7A8177'} />
        <TextInput
          {...props}
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.nativeID}-error` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={password && !visible}
          placeholderTextColor="#8B9185"
          selectionColor="#8BA67C"
          className="min-h-14 min-w-0 flex-1 py-3 pr-3 text-[15px] text-ink"
        />
        {password && (
          <Pressable
            onPress={() => setVisible((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={`${visible ? 'Приховати' : 'Показати'} ${label.toLowerCase()}`}
            className="mr-1 h-12 w-11 items-center justify-center rounded-xl active:bg-canvas">
            <Icon name={visible ? 'eye-off' : 'eye'} size={20} color="#656D62" />
          </Pressable>
        )}
      </View>
      {error && (
        <Text
          nativeID={`${props.nativeID}-error`}
          accessibilityLiveRegion="polite"
          className="text-xs leading-4 text-[#A23C30]">
          {error}
        </Text>
      )}
    </View>
  );
}
