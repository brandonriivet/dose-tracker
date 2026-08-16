// The two roles that can't be shared across platforms. Metro picks this
// file over the .ios / .android ones by the `.web` extension.

// The original web app pulled Sora / Inter / JetBrains Mono off Google
// Fonts. This build uses the browser's own stacks instead, for the same
// reason the native ones use the system faces: nothing to download before
// the first paint. Swap in the webfonts via an `app/+html.js` document if
// you want the original lettering back.
export const fonts = {
  display: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace',
};

// react-native-web translates the iOS-style shadow props into a CSS
// box-shadow, so the card keeps the same weight it has on iOS. Android's
// `elevation` has no meaning here and would be dropped.
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
};
