import { StatusBar } from 'react-native';
import { useColorScheme } from 'nativewind';

export function DynamicStatusBar() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={isDark ? '#000000' : '#ffffff'}
        />
    );
}
