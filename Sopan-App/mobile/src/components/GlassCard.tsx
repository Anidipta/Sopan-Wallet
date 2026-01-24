import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'glow';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style,
  variant = 'default' 
}) => {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['rgba(20, 241, 149, 0.1)', 'rgba(153, 69, 255, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
      >
        <View style={styles.glassOverlay}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  if (variant === 'glow') {
    return (
      <View style={[styles.card, styles.glowCard, style]}>
        <View style={styles.glowEffect} />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.defaultCard, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: 'rgba(26, 26, 36, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradientCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  glassOverlay: {
    backgroundColor: 'rgba(26, 26, 36, 0.6)',
    backdropFilter: 'blur(10px)',
  },
  glowCard: {
    backgroundColor: 'rgba(26, 26, 36, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.3)',
    shadowColor: '#14F195',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: 'rgba(20, 241, 149, 0.05)',
    borderRadius: 100,
  },
});
