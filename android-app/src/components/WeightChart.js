import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { formatFriendlyDate } from '../lib/dates';
import { colors, fonts } from '../theme';

// Same 30-day line chart as the web app, on react-native-svg instead of
// inline SVG. The viewBox math is unchanged.
export function WeightChart({ entries }) {
  if (entries.length < 2) {
    return <Text style={styles.empty}>Log a few more days to see your trend here.</Text>;
  }

  const width = 600;
  const height = 160;
  const padX = 10;
  const padY = 16;
  const weights = entries.map((e) => e.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = entries.map((e, i) => ({
    x: padX + (i / (entries.length - 1)) * (width - padX * 2),
    y: padY + (1 - (e.weight - min) / range) * (height - padY * 2),
    e,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;

  const first = entries[0];
  const last = entries[entries.length - 1];
  const delta = last.weight - first.weight;
  const deltaLabel = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${last.unit}`;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.current}>
          {last.weight.toFixed(1)} <Text style={styles.currentUnit}>{last.unit}</Text>
        </Text>
        <Text style={styles.delta}>
          {deltaLabel} over {entries.length} logged days
        </Text>
      </View>

      <Svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={160}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.amber} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={colors.amber} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#weightFill)" stroke="none" />
        <Path
          d={linePath}
          fill="none"
          stroke={colors.amber}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="3.5" fill={colors.ink} stroke={colors.amber} strokeWidth="2" />
        ))}
      </Svg>

      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{formatFriendlyDate(first.dateKey)}</Text>
        <Text style={styles.axisLabel}>{formatFriendlyDate(last.dateKey)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.paperFaint, fontSize: 14, paddingVertical: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  current: { color: colors.paper, fontFamily: fonts.display, fontSize: 24, fontWeight: '600' },
  currentUnit: { color: colors.paperDim, fontSize: 14, fontWeight: '400' },
  delta: { color: colors.paperDim, fontFamily: fonts.mono, fontSize: 12 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisLabel: { color: colors.paperFaint, fontSize: 10 },
});
