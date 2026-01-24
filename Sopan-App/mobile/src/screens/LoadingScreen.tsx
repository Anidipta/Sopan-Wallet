import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import SopanIcon from '../components/SopanIcon';

export const LoadingScreen: React.FC = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation for logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Rotation animation for gradient effect
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#1a0033', '#330033', '#4d1a4d', '#663366', '#331a00', '#4d2600', '#663300']}
                locations={[0, 0.2, 0.35, 0.5, 0.65, 0.75, 0.85, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Animated.View
                    style={[
                        styles.glowContainer,
                        {
                            transform: [{ rotate }],
                        },
                    ]}
                >
                    <View style={styles.glow1} />
                    <View style={styles.glow2} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                >
                    <Image source={SopanIcon} style={styles.logo} />
                </Animated.View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowContainer: {
        position: 'absolute',
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#9945FF',
        opacity: 0.3,
        shadowColor: '#9945FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
        elevation: 10,
    },
    glow2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#FF6B35',
        opacity: 0.2,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
        elevation: 8,
    },
    logoContainer: {
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 80,
        padding: 30,
        borderWidth: 2,
        borderColor: 'rgba(153, 69, 255, 0.3)',
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
});
