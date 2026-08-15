// The five tab icons from the web app's screens.js, redrawn with the same
// path data on react-native-svg.
import Svg, { Circle, G, Path } from 'react-native-svg';

const SIZE = 24;

export function SunIcon({ color, active }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.7" fill={active ? color : 'none'} />
      <G stroke={color} strokeWidth="1.7" strokeLinecap="round">
        <Path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
      </G>
    </Svg>
  );
}

export function VialIcon({ color, active }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 2.5h6M10 2.5v3.2c0 .5-.15.95-.45 1.35L7 10.8c-.4.5-.6 1.1-.6 1.75v6.45A2.5 2.5 0 0 0 8.9 21.5h6.2a2.5 2.5 0 0 0 2.5-2.5v-6.45c0-.65-.2-1.25-.6-1.75l-2.55-3.75A2.3 2.3 0 0 1 14 5.7V2.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <Path d="M7.3 14h9.4" stroke={color} strokeWidth="1.7" fill={active ? color : 'none'} />
    </Svg>
  );
}

export function LeafIcon({ color, active }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 4c0 8-6 14-14 14H4c0-8 6-14 14-14h2Z"
        stroke={color}
        strokeWidth="1.7"
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.15 : 0}
        strokeLinejoin="round"
      />
      <Path d="M6 18C10 13 14 10 19 5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function ClockIcon({ color, active }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="1.7"
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <Path d="M12 7.5V12l3.2 2" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon({ color, active }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="3.2"
        stroke={color}
        strokeWidth="1.7"
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <Path
        d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-12Z"
        stroke={color}
        strokeWidth="1.7"
      />
      <Path d="M4.5 9.5h15M8.5 3.5v3M15.5 3.5v3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronIcon({ color, direction = 'left' }) {
  const d = direction === 'left' ? 'M14.5 5.5 8.5 12l6 6.5' : 'M9.5 5.5 15.5 12l-6 6.5';
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
