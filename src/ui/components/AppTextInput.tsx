import { forwardRef } from 'react';
import { TextInput as NativeTextInput, type TextInputProps, type TextStyle } from 'react-native';

import { useLocale } from '@/localization/LocaleProvider';
import { fonts } from '@/ui/theme';

const arabicPattern = /[\u0600-\u06ff]/u;

export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput(
  {
    accessibilityHint,
    accessibilityLabel,
    placeholder,
    style,
    value,
    defaultValue,
    multiline,
    ...props
  },
  ref,
) {
  const { isRTL, t } = useLocale();
  const translatedPlaceholder = typeof placeholder === 'string' ? t(placeholder) : placeholder;
  const visibleText = value ?? defaultValue ?? translatedPlaceholder ?? '';
  const usesArabic = arabicPattern.test(visibleText);
  const usesArabicMetrics = isRTL || usesArabic;
  const localeStyle: TextStyle | null =
    isRTL || usesArabic
      ? {
          textAlign: 'right',
          writingDirection: usesArabic ? 'rtl' : 'ltr',
        }
      : null;

  return (
    <NativeTextInput
      {...props}
      ref={ref}
      multiline={multiline}
      allowFontScaling
      maxFontSizeMultiplier={2.5}
      accessibilityHint={
        typeof accessibilityHint === 'string' ? t(accessibilityHint) : accessibilityHint
      }
      accessibilityLabel={
        typeof accessibilityLabel === 'string' ? t(accessibilityLabel) : accessibilityLabel
      }
      placeholder={translatedPlaceholder}
      value={value}
      defaultValue={defaultValue}
      style={[
        style,
        localeStyle,
        usesArabicMetrics
          ? {
              fontFamily: fonts.arabic,
              letterSpacing: 0,
              lineHeight: 30,
              paddingTop: 12,
              paddingBottom: 14,
              textAlignVertical: multiline ? 'top' : 'center',
            }
          : null,
      ]}
    />
  );
});
