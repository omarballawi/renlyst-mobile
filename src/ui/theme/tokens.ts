export type ThemeColors = {
  canvas: string;
  surface: string;
  surfaceStrong: string;
  ink: string;
  mutedInk: string;
  line: string;
  coral: string;
  coralPressed: string;
  coralText: string;
  aqua: string;
  aquaSoft: string;
  saffron: string;
  saffronSoft: string;
  success: string;
  danger: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  canvas: '#F7F3EC',
  surface: '#FCFAF6',
  surfaceStrong: '#EEE7DC',
  ink: '#142B46',
  mutedInk: '#536477',
  line: '#D8D3C9',
  coral: '#BF4533',
  coralPressed: '#A83829',
  coralText: '#FFF8F2',
  aqua: '#17797E',
  aquaSoft: '#D7EBE8',
  saffron: '#9B6712',
  saffronSoft: '#F4E4BD',
  success: '#237A54',
  danger: '#AA3945',
  shadow: 'rgba(20, 43, 70, 0.12)',
};

export const darkColors: ThemeColors = {
  canvas: '#101A24',
  surface: '#172432',
  surfaceStrong: '#203140',
  ink: '#EDF3F4',
  mutedInk: '#A9B7C0',
  line: '#2B3C49',
  coral: '#E36B58',
  coralPressed: '#F07C68',
  coralText: '#17212B',
  aqua: '#55B8B9',
  aquaSoft: '#183E45',
  saffron: '#E8B653',
  saffronSoft: '#49391F',
  success: '#52B788',
  danger: '#E86A76',
  shadow: 'rgba(3, 10, 17, 0.42)',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const fonts = {
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
  display: 'Newsreader_500Medium',
  displaySemiBold: 'Newsreader_600SemiBold',
  displayBold: 'Newsreader_700Bold',
  arabic: 'NotoSansArabic_400Regular',
  arabicSemiBold: 'NotoSansArabic_600SemiBold',
  arabicBold: 'NotoSansArabic_700Bold',
} as const;
