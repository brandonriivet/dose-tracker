// The web app's Tailwind palette, lifted verbatim out of index.html so the
// two versions stay visually identical. Names match the Tailwind tokens
// ("ink.soft" here is `bg-ink-soft` there) to keep the port easy to follow.
export const colors = {
  ink: '#0A0908',
  inkSoft: '#161311',
  inkRaised: '#201B17',
  inkLine: '#332B24',

  paper: '#F4EFE9',
  paperDim: '#A69B8F',
  paperFaint: '#6E6459',

  amber: '#F2760E',
  amberSoft: '#3D2410',
  amberBright: '#FF8F2E',

  teal: '#C25A0F',
  tealSoft: '#331C0C',
  tealBright: '#DD7420',

  coral: '#E5432C',
  coralSoft: '#3A1913',
};

// The web build pulls Sora / Inter / JetBrains Mono off Google Fonts. Rather
// than ship three font families in the bundle for a personal app, this maps
// each role onto the Android system faces — 'sans-serif' is Roboto and
// 'monospace' is Roboto Mono, the same two names the platform itself uses.
//
// The in-between weights the screens ask for ('500', '600') resolve to real
// Roboto Medium / SemiBold faces on Android 9+ and round to regular or bold
// on anything older, which is the same trade the iOS build makes.
export const fonts = {
  display: 'sans-serif',
  body: 'sans-serif',
  mono: 'monospace',
};

export const radius = {
  md: 6,
  lg: 8,
  xl: 12,
  xl2: 20,
  full: 999,
};

// Android draws shadows from `elevation`, not from the iOS shadow* props —
// offset/radius/opacity are ignored outside of shadowColor. Elevation 6 is
// about where a Material "raised card" sits, which is the closest match to
// Tailwind's `shadow-card`. The cards are barely lighter than the page
// behind them, so the shadow is doing real work here separating them.
export const cardShadow = {
  elevation: 6,
  shadowColor: '#000',
};
