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
// each role onto the closest iOS system face — San Francisco for text and
// SF Mono's public alias for the tabular numbers.
export const fonts = {
  display: 'System',
  body: 'System',
  mono: 'Menlo',
};

export const radius = {
  md: 6,
  lg: 8,
  xl: 12,
  xl2: 20,
  full: 999,
};

// Matches Tailwind's `shadow-card` closely enough on iOS, which only has a
// single drop shadow (no inset) to work with.
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
};
