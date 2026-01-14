/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000000',
    background: '#F2F2F7', // SystemGroupedBackground
    backgroundSecondary: '#FFFFFF', // SecondarySystemGroupedBackground
    card: '#FFFFFF',
    tint: '#007AFF', // SystemBlue
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#007AFF',
    separator: '#C6C6C8',
    blue: '#007AFF',
    orange: '#FF9500',
    green: '#34C759',
    red: '#FF3B30',
    slate: '#8E8E93',
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
