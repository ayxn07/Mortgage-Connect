import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_RADIUS = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT);

type ThemeTransitionContextType = {
    triggerTransition: (x: number, y: number, callback: () => void) => void;
};

const ThemeTransitionContext = createContext<ThemeTransitionContextType | null>(null);

export function useThemeTransition() {
    const context = useContext(ThemeTransitionContext);
    if (!context) {
        throw new Error('useThemeTransition must be used within ThemeTransitionProvider');
    }
    return context;
}

export function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const radius = useSharedValue(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isAnimating, setIsAnimating] = useState(false);
    const [overlayColor, setOverlayColor] = useState('#000000');

    const triggerTransition = useCallback((x: number, y: number, callback: () => void) => {
        // Set the overlay color to the CURRENT theme color (opposite of target)
        const currentColor = isDark ? '#000000' : '#ffffff';
        setOverlayColor(currentColor);
        setPosition({ x, y });
        setIsAnimating(true);

        // Expand then contract animation
        radius.value = withSequence(
            // Expand to cover screen
            withTiming(MAX_RADIUS, {
                duration: 400,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
            }),
            // Switch theme at peak
            withTiming(MAX_RADIUS, {
                duration: 0,
            }, (finished) => {
                if (finished) {
                    runOnJS(callback)();
                }
            }),
            // Contract back
            withTiming(0, {
                duration: 400,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
            }, (finished) => {
                if (finished) {
                    runOnJS(setIsAnimating)(false);
                }
            })
        );
    }, [isDark, radius]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: radius.value * 2,
            height: radius.value * 2,
            borderRadius: radius.value,
            transform: [
                { translateX: -radius.value },
                { translateY: -radius.value },
            ],
        };
    });

    return (
        <ThemeTransitionContext.Provider value={{ triggerTransition }}>
            {children}
            {isAnimating && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Animated.View
                        style={[
                            styles.circle,
                            {
                                left: position.x,
                                top: position.y,
                                backgroundColor: overlayColor,
                            },
                            animatedStyle,
                        ]}
                    />
                </View>
            )}
        </ThemeTransitionContext.Provider>
    );
}

const styles = StyleSheet.create({
    circle: {
        position: 'absolute',
    },
});
