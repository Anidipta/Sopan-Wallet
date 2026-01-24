// This file now exports the logo-full.png image directly
import logoFull from './images/logo-full.png';

export default logoFull;
        <Path d="M 55 20 L 35 50 L 50 50 L 45 80 L 65 50 L 50 50 Z" fill="#14F195" />
        <Circle cx="50" cy="50" r="8" fill="#14F195" />
      </Svg>
    );
  }

  // Full logo with text
  return (
    <Svg width={size * 3} height={size} viewBox="0 0 300 100" fill="none">
      <Defs>
        <LinearGradient id="pulseGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#14F195" stopOpacity="1" />
          <Stop offset="50%" stopColor="#9945FF" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00D4FF" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* Icon part */}
      <G transform="translate(10, 10)">
        <Circle cx="40" cy="40" r="35" stroke="url(#pulseGradientFull)" strokeWidth="2.5" fill="none" opacity="0.3" />
        <Circle cx="40" cy="40" r="27" stroke="url(#pulseGradientFull)" strokeWidth="2.5" fill="none" opacity="0.6" />
        <Path d="M 44 20 L 28 40 L 40 40 L 36 60 L 52 40 L 40 40 Z" fill="url(#pulseGradientFull)" />
        <Circle cx="40" cy="40" r="6" fill="#14F195" />
      </G>
      {/* Text "SOPAN" */}
      <G transform="translate(110, 50)">
        <Text
          x="0"
          y="0"
          fill="#fff"
          fontSize="40"
          fontWeight="bold"
          fontFamily="sans-serif"
        >SOPAN</Text>
      </G>
    </Svg>
  );
};

export const SopanLogoAnimated: React.FC<{ size?: number }> = ({ size = 100 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#14F195" stopOpacity="1" />
        <Stop offset="50%" stopColor="#9945FF" stopOpacity="1" />
        <Stop offset="100%" stopColor="#00D4FF" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    {/* Animated pulse rings */}
    <Circle cx="50" cy="50" r="45" stroke="url(#animatedGradient)" strokeWidth="3" fill="none" opacity="0.3" />
    <Circle cx="50" cy="50" r="35" stroke="url(#animatedGradient)" strokeWidth="3" fill="none" opacity="0.6" />
    {/* Lightning bolt / S shape */}
    <Path d="M 55 20 L 35 50 L 50 50 L 45 80 L 65 50 L 50 50 Z" fill="url(#animatedGradient)" />
    {/* Pulsing center */}
    <Circle cx="50" cy="50" r="8" fill="#14F195" />
  </Svg>
);
