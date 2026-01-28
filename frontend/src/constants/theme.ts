/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1E3A8A'; // miFACU Navy
const tintColorDark = '#FFFFFF';

export const mifacuNavy = '#1E3A8A';
export const mifacuGold = '#B48B40';
export const mifacuBackground = '#F8FAFC';

export const Colors = {
  light: {
    text: '#0F172A', // Slate 900 para mejor legibilidad académica
    background: mifacuBackground,
    backgroundSecondary: '#FFFFFF',
    card: '#FFFFFF',
    tint: mifacuNavy,
    icon: '#64748B', // Slate 500
    tabIconDefault: '#94A3B8', // Slate 400
    tabIconSelected: mifacuNavy,
    separator: '#E2E8F0', // Slate 200
    blue: mifacuNavy,
    orange: mifacuGold,
    green: '#10B981', // Emerald 500
    red: '#EF4444', // Red 500
    slate: '#64748B',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000', // SystemBackground
    backgroundSecondary: '#1C1C1E', // SecondarySystemBackground
    card: '#1C1C1E',
    tint: '#0A84FF', // SystemBlue (Dark variant)
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0A84FF',
    separator: '#38383A',
    blue: '#0A84FF',
    orange: '#FF9F0A',
    green: '#30D158',
    red: '#FF453A',
    slate: '#8E8E93',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
