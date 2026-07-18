import { Children } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useLocale } from '@/localization/LocaleProvider';
import { translateCopy } from '@/localization/copy';
import { fonts } from '@/ui/theme';

export type TextVariant =
  'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

const variants: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.displaySemiBold, fontSize: 38, lineHeight: 42, letterSpacing: -0.7 },
  title: { fontFamily: fonts.displaySemiBold, fontSize: 30, lineHeight: 35, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.bodyBold, fontSize: 20, lineHeight: 27, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, letterSpacing: 0.5 },
};

const arabicPattern = /[\u0600-\u06ff]/u;

export function AppText({ variant = 'body', color, style, children, ...props }: AppTextProps) {
  const { isRTL, language } = useLocale();
  const childArray = Children.toArray(children);
  const primitiveCopy = childArray.every(
    (child) => typeof child === 'string' || typeof child === 'number',
  )
    ? childArray.join('')
    : null;
  const translatedContent =
    primitiveCopy === null
      ? Children.map(children, (child) =>
          typeof child === 'string' ? translateCopy(child, language) : child,
        )
      : translateCopy(primitiveCopy, language);
  const visibleText = Children.toArray(translatedContent)
    .filter(
      (child): child is string | number => typeof child === 'string' || typeof child === 'number',
    )
    .join('');
  const usesArabic = arabicPattern.test(visibleText);
  const variantStyle = variants[variant];
  const arabicWeight =
    variant === 'display' || variant === 'title' || variant === 'heading' || variant === 'label'
      ? fonts.arabicBold
      : variant === 'bodyStrong'
        ? fonts.arabicSemiBold
        : fonts.arabic;
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={2.5}
      {...props}
      style={[
        variantStyle,
        isRTL && { textAlign: 'right' },
        usesArabic && { fontFamily: arabicWeight, writingDirection: 'rtl', letterSpacing: 0 },
        color ? { color } : null,
        style,
      ]}
    >
      {translatedContent}
    </Text>
  );
}
