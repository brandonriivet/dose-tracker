// The two roles that can't be shared across platforms. Metro picks this
// file over theme.platform.ios.js by the `.android` extension, so
// `import { fonts } from './theme.platform'` resolves per build.

// The web build pulls Sora / Inter / JetBrains Mono off Google Fonts.
// Rather than ship three families in the bundle for a personal app, each
// role maps onto the Android system faces — 'sans-serif' is Roboto and
// 'monospace' is Roboto Mono, the same names the platform itself uses.
//
// The in-between weights the screens ask for ('500', '600') resolve to real
// Roboto Medium / SemiBold faces on Android 9+ and round to regular or bold
// on anything older, which is the same trade the iOS build makes.
export const fonts = {
  display: 'sans-serif',
  body: 'sans-serif',
  mono: 'monospace',
};

// Android draws shadows from `elevation`, not from the iOS shadow* props —
// offset/radius/opacity are ignored outside of shadowColor. Elevation 6 is
// about where a Material "raised card" sits, which is the closest match to
// Tailwind's `shadow-card`. The cards are barely lighter than the page
// behind them, so the shadow is doing real work separating them.
export const cardShadow = {
  elevation: 6,
  shadowColor: '#000',
};
