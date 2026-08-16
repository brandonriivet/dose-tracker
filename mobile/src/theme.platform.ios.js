// The two roles that can't be shared across platforms. Metro picks this
// file over theme.platform.android.js by the `.ios` extension, so
// `import { fonts } from './theme.platform'` resolves per build.

// The web build pulls Sora / Inter / JetBrains Mono off Google Fonts.
// Rather than ship three families in the bundle for a personal app, each
// role maps onto the closest iOS system face — San Francisco for text and
// SF Mono's public alias for the tabular numbers.
export const fonts = {
  display: 'System',
  body: 'System',
  mono: 'Menlo',
};

// Matches Tailwind's `shadow-card` closely enough on iOS, which only has a
// single drop shadow (no inset) to work with.
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
};
