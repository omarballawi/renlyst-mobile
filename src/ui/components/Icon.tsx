import type { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolView } from 'expo-symbols';
import {
  Platform,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

const iconMap = {
  today: { ios: 'house.fill', android: 'home' },
  library: { ios: 'books.vertical.fill', android: 'book_2' },
  practice: { ios: 'brain.head.profile.fill', android: 'school' },
  training: { ios: 'cross.case.fill', android: 'medical_services' },
  profile: { ios: 'person.crop.circle.fill', android: 'person' },
  add: { ios: 'plus', android: 'add' },
  camera: { ios: 'camera.fill', android: 'camera' },
  photos: { ios: 'photo.on.rectangle.angled', android: 'photo_library' },
  search: { ios: 'magnifyingglass', android: 'search' },
  arrow: { ios: 'arrow.right', android: 'arrow_forward' },
  check: { ios: 'checkmark', android: 'check' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  image: { ios: 'photo.fill', android: 'image' },
  database: { ios: 'externaldrive.fill', android: 'database' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
} as const;

export type AppIconName = keyof typeof iconMap;
type WebIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const webIconMap: Record<AppIconName, WebIconName> = {
  today: 'home-variant',
  library: 'bookshelf',
  practice: 'brain',
  training: 'medical-bag',
  profile: 'account-circle',
  add: 'plus',
  camera: 'camera',
  photos: 'image-multiple',
  search: 'magnify',
  arrow: 'arrow-right',
  check: 'check',
  clock: 'clock',
  warning: 'alert',
  image: 'image',
  database: 'database',
  chevron: 'chevron-right',
};

type IconProps = {
  name: AppIconName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color, style }: IconProps) {
  if (Platform.OS === 'web') {
    return (
      <MaterialCommunityIcons
        accessible={false}
        aria-hidden
        name={webIconMap[name]}
        size={size}
        color={String(color)}
        style={style as StyleProp<TextStyle>}
      />
    );
  }

  return (
    <SymbolView
      accessible={false}
      name={iconMap[name]}
      size={size}
      tintColor={color}
      weight="semibold"
      resizeMode="scaleAspectFit"
      style={style}
    />
  );
}
