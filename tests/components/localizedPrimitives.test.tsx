import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { AppText } from '@/ui/components/AppText';
import { AppTextInput } from '@/ui/components/AppTextInput';
import { fonts } from '@/ui/theme';

let mockLanguage: 'en' | 'ar' = 'ar';

jest.mock('@/localization/LocaleProvider', () => {
  const { translateCopy } = jest.requireActual(
    '@/localization/copy',
  ) as typeof import('@/localization/copy');
  return {
    useLocale: () => ({
      language: mockLanguage,
      isRTL: mockLanguage === 'ar',
      setLanguage: jest.fn(),
      t: (value: string) => translateCopy(value, mockLanguage),
    }),
  };
});

describe('localized native primitives', () => {
  afterEach(() => {
    mockLanguage = 'ar';
  });

  it('translates static interface copy and applies Arabic typography and direction', async () => {
    const screen = await render(<AppText>Today</AppText>);
    const text = screen.getByText('اليوم');
    const style = StyleSheet.flatten(text.props.style) as {
      fontFamily?: string;
      writingDirection?: string;
      textAlign?: string;
    };
    expect(style).toMatchObject({
      fontFamily: fonts.arabic,
      writingDirection: 'rtl',
      textAlign: 'right',
    });
  });

  it('translates string fragments when a label contains nested styled text', async () => {
    const screen = await render(
      <AppText>
        Brand on the package <AppText>(optional)</AppText>
      </AppText>,
    );
    expect(JSON.stringify(screen.toJSON())).toContain('العلامة على العبوة');
    expect(JSON.stringify(screen.toJSON())).toContain('(اختياري)');
  });

  it('translates adjacent primitive children as one dynamic sentence', async () => {
    const screen = await render(
      <AppText>
        {'Review '}
        {43}
        {' due drugs'}
      </AppText>,
    );
    expect(screen.getByText('راجع 43 من الأدوية المستحقة')).toBeTruthy();
  });

  it('localizes input semantics while keeping Latin medicine names readable in RTL', async () => {
    const screen = await render(
      <AppTextInput accessibilityLabel="Search" placeholder="Search" value="Furosemide" />,
    );
    const input = screen.getByLabelText('بحث');
    expect(input.props.placeholder).toBe('بحث');
    expect(StyleSheet.flatten(input.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'ltr',
    });
  });

  it('uses Arabic input direction and font whenever the content itself is Arabic', async () => {
    mockLanguage = 'en';
    const screen = await render(<AppTextInput accessibilityLabel="Notes" value="ملاحظة عربية" />);
    const input = screen.getByLabelText('Notes');
    expect(StyleSheet.flatten(input.props.style)).toMatchObject({
      fontFamily: fonts.arabic,
      writingDirection: 'rtl',
      textAlign: 'right',
    });
  });
});
