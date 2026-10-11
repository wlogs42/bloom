import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View } from 'react-native';

import { type PhotoInput } from '@/shared/api/types';

import { Icon } from './Icon';

const maxPhotoBytes = 5 * 1024 * 1024;

export function PhotoField({
  photo,
  error,
  disabled,
  hint = 'JPEG, PNG або WebP до 5 МБ',
  onChange,
}: {
  photo: PhotoInput | null;
  error?: string;
  disabled?: boolean;
  hint?: string;
  onChange: (photo: PhotoInput | null, error: string) => void;
}) {
  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.fileSize ?? asset.file?.size ?? 0) > maxPhotoBytes) {
      onChange(photo, 'Фото завелике. Обери файл до 5 МБ.');
      return;
    }
    onChange(
      {
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
        file: asset.file,
      },
      ''
    );
  }

  return (
    <View className="gap-2">
      <Pressable
        onPress={pickPhoto}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={photo ? 'Змінити фото профілю' : 'Додати фото профілю'}
        accessibilityHint={error || undefined}
        className={`min-h-[76px] flex-row items-center gap-4 rounded-2xl border bg-white p-3 active:bg-canvas ${error ? 'border-[#B64A3B]' : 'border-line'}`}>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            accessibilityIgnoresInvertColors
            className="h-[52px] w-[52px] rounded-full bg-canvas"
          />
        ) : (
          <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-[#ECEFE5]">
            <Icon name="user" size={24} color={error ? '#B64A3B' : '#7A8177'} />
          </View>
        )}
        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-semibold text-forest">
            {photo ? 'Фото додано' : 'Фото профілю'}
          </Text>
          <Text className="mt-0.5 text-xs text-[#656D62]">
            {photo ? 'Натисни, щоб обрати інше' : hint}
          </Text>
        </View>
        <Icon name={photo ? 'edit' : 'plus'} size={19} color="#253D32" />
      </Pressable>
      {!!error && (
        <Text accessibilityLiveRegion="polite" className="text-xs leading-4 text-[#A23C30]">
          {error}
        </Text>
      )}
    </View>
  );
}
