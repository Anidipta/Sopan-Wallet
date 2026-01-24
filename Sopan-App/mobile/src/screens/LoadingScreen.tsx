import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import logoFull from '../../assets/images/logo-icon.png';

export const LoadingScreen: React.FC = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;
    const rippleOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Heartbeat pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 150,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 150,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1.25,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // White Ripple effect (faded out circle)
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(rippleAnim, {
                        toValue: 3,
                        duration: 1000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rippleAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    })
                ]),
                Animated.sequence([
                    Animated.timing(rippleOpacity, {
                        toValue: 0.5,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rippleOpacity, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            ])
        ).start();

        // Continuous logo rotation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 4000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const logoRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#0a0a0f', '#12121a']}
                style={styles.gradient}
            >
                {/* Expanding White Ripple */}
                <Animated.View
                    style={[
                        styles.ripple,
                        {
                            opacity: rippleOpacity,
                            transform: [{ scale: rippleAnim }],
                        },
                    ]}
                />

                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            transform: [
                                { scale: pulseAnim },
                                { rotate: logoRotate }
                            ],
                        },
                    ]}
                >
                    <Image source={logoFull} style={styles.logo} />
                </Animated.View>

                <Animated.Text style={styles.loadingText}>
                    INITIALIZING WALLET...
                </Animated.Text>
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
    ripple: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    logoContainer: {
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    loadingText: {
        position: 'absolute',
        bottom: 80,
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 4,
        opacity: 0.6,
    }
});
