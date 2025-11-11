import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

export const ControlButton = ({
  icon,
  onPress,
  size = 'normal',
}: {
  icon: string;
  onPress: () => void;
  size?: 'normal' | 'large';
}) => (
  <TouchableOpacity
    style={[
      styles.controlButton,
      size === 'large' && styles.controlButtonLarge,
    ]}
    onPress={onPress}
  >
    <Text
      style={[styles.controlIcon, size === 'large' && styles.controlIconLarge]}
    >
      {icon}
    </Text>
  </TouchableOpacity>
);

export const SwitchControl = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.switchControl}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#e1e1e1', true: '#007aff' }}
      thumbColor={value ? '#ffffff' : '#f4f3f4'}
    />
  </View>
);

export const ToggleButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.toggleButton, active && styles.toggleButtonActive]}
    onPress={onPress}
  >
    <Text
      style={[styles.toggleButtonText, active && styles.toggleButtonTextActive]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const ActionButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
);
