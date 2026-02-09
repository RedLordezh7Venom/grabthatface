/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6366f1';
const tintColorDark = '#818cf8';

export const Colors = {
  light: {
    text: '#1f2937',
    background: '#f8fafc',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#06b6d4',
    card: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(99, 102, 241, 0.1)',
  },
  dark: {
    text: '#f8fafc',
    background: '#020617',
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    primary: '#818cf8',
    secondary: '#c084fc',
    accent: '#22d3ee',
    card: 'rgba(15, 23, 42, 0.7)',
    border: 'rgba(129, 140, 248, 0.2)',
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
