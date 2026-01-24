import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export const AnimatedBackground: React.FC = () => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createPulseAnimation(pulse1, 0),
      createPulseAnimation(pulse2, 1000),
      createPulseAnimation(pulse3, 2000),
    ]).start();
  }, []);

  const scale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity1 = pulse1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad1" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#14F195" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#14F195" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad2" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#9945FF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#9945FF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad3" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.2} cy={height * 0.3} r="150" fill="url(#grad1)" />
        <Circle cx={width * 0.8} cy={height * 0.6} r="180" fill="url(#grad2)" />
        <Circle cx={width * 0.5} cy={height * 0.8} r="160" fill="url(#grad3)" />
      </Svg>

      <Animated.View
        style={[
          styles.pulseCircle,
          {
            transform: [{ scale: scale1 }],
            opacity: opacity1,
            top: height * 0.2,
            left: width * 0.1,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0F',
  },
  pulseCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#14F195',
    opacity: 0.1,
  },
});
