// The web app's Tailwind palette, lifted verbatim out of index.html so all
// three versions stay visually identical. Names match the Tailwind tokens
// ("ink.soft" here is `bg-ink-soft` there) to keep the port easy to follow.
//
// Everything in this file is shared. The two things that genuinely can't
// be — the system type faces, and how each platform draws a shadow — live
// in theme.platform.ios.js / theme.platform.android.js and are re-exported
// below, so screens keep importing all of it from one place.
export { cardShadow, fonts } from './theme.platform';

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

export const radius = {
  md: 6,
  lg: 8,
  xl: 12,
  xl2: 20,
  full: 999,
};
