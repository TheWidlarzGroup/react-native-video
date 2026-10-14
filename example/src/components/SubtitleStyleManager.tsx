import React from 'react';
import { Text, View } from 'react-native';
import type { SubtitleEdgeType, SubtitleStyle } from 'react-native-video';
import { styles } from '../styles';
import { ToggleButton } from './Controls';

const FONT_SCALES = [1, 1.5, 2] as const;
const EDGE_TYPES: SubtitleEdgeType[] = [
  'none',
  'outline',
  'dropShadow',
  'raised',
  'depressed',
];

const COLOR_PRESETS: { label: string; foregroundColor: string }[] = [
  { label: 'Default', foregroundColor: '#FFFFFF' },
  { label: 'Yellow', foregroundColor: '#FFFF00' },
  { label: 'Red', foregroundColor: '#FF3B30' },
];

export const SubtitleStyleManager = ({
  style,
  onChange,
}: {
  style: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
}) => {
  return (
    <View>
      <Text style={styles.subSectionTitle}>Font Scale</Text>
      <View style={styles.buttonGroup}>
        {FONT_SCALES.map((fontScale) => (
          <ToggleButton
            key={fontScale}
            label={`${fontScale}x`}
            active={(style.fontScale ?? 1) === fontScale}
            onPress={() => onChange({ ...style, fontScale })}
          />
        ))}
      </View>

      <Text style={styles.subSectionTitle}>Text Color</Text>
      <View style={styles.buttonGroup}>
        {COLOR_PRESETS.map((preset) => (
          <ToggleButton
            key={preset.label}
            label={preset.label}
            active={
              (style.foregroundColor ?? '#FFFFFF') === preset.foregroundColor
            }
            onPress={() =>
              onChange({ ...style, foregroundColor: preset.foregroundColor })
            }
          />
        ))}
      </View>

      <Text style={styles.subSectionTitle}>Background</Text>
      <View style={styles.buttonGroup}>
        <ToggleButton
          label="Transparent"
          active={!style.backgroundColor}
          onPress={() => onChange({ ...style, backgroundColor: undefined })}
        />
        <ToggleButton
          label="Black box"
          active={style.backgroundColor === '#C0000000'}
          onPress={() => onChange({ ...style, backgroundColor: '#C0000000' })}
        />
      </View>

      <Text style={styles.subSectionTitle}>
        Edge Style (iOS: style only, Android: style + color)
      </Text>
      <View style={styles.buttonGroup}>
        {EDGE_TYPES.map((edgeType) => (
          <ToggleButton
            key={edgeType}
            label={edgeType}
            active={(style.edgeType ?? 'none') === edgeType}
            onPress={() =>
              onChange({
                ...style,
                edgeType,
                edgeColor: edgeType === 'none' ? undefined : '#FF000000',
              })
            }
          />
        ))}
      </View>

      <Text style={styles.subSectionTitle}>Window Color (Android only)</Text>
      <View style={styles.buttonGroup}>
        <ToggleButton
          label="None"
          active={!style.windowColor}
          onPress={() => onChange({ ...style, windowColor: undefined })}
        />
        <ToggleButton
          label="Dim gray"
          active={style.windowColor === '#80333333'}
          onPress={() => onChange({ ...style, windowColor: '#80333333' })}
        />
      </View>

      <Text style={styles.subSectionTitle}>
        Bottom Padding (Android: additive, iOS: pins position)
      </Text>
      <View style={styles.buttonGroup}>
        <ToggleButton
          label="Default"
          active={style.bottomPadding === undefined}
          onPress={() => onChange({ ...style, bottomPadding: undefined })}
        />
        <ToggleButton
          label="None"
          active={style.bottomPadding === 0}
          onPress={() => onChange({ ...style, bottomPadding: 0 })}
        />
        <ToggleButton
          label="Large (25%)"
          active={style.bottomPadding === 0.25}
          onPress={() => onChange({ ...style, bottomPadding: 0.25 })}
        />
      </View>

      <Text style={styles.subSectionTitle}>Reset</Text>
      <View style={styles.buttonGroup}>
        <ToggleButton
          label="Reset to defaults"
          active={false}
          onPress={() => onChange({})}
        />
      </View>
    </View>
  );
};

export default SubtitleStyleManager;
