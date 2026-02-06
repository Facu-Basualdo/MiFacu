import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  Pressable,
  Animated,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { mifacuGold } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

// ─── Dimensions ───
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const SAFE_BOTTOM = Platform.OS === 'ios' ? 24 : 0;
const TOTAL_BAR_HEIGHT = TAB_BAR_HEIGHT + SAFE_BOTTOM;

// Notch geometry
const NOTCH_WIDTH = 90;          // Total width of the concave arc
const NOTCH_DEPTH = 52;          // How deep the curve dips below the bar top line
const HERO_SIZE = 56;            // The floating button diameter
const HERO_LIFT = 14;            // How far above the bar edge the button center sits

const INACTIVE_COLOR = 'rgba(255,255,255,0.45)';

// ─── SVG notched background ───
const SVG_HEIGHT = TAB_BAR_HEIGHT + NOTCH_DEPTH + SAFE_BOTTOM;

function buildNotchPath(w: number): string {
  const top = NOTCH_DEPTH;

  // Flat top bar — no convex bump behind the hero button
  return [
    `M 0 ${top}`,
    `L ${w} ${top}`,
    `L ${w} ${SVG_HEIGHT}`,
    `L 0 ${SVG_HEIGHT}`,
    `Z`,
  ].join(' ');
}

// ─── Notched Background Component ───
const NotchedBackground = React.memo(({ isDark }: { isDark: boolean }) => {
  const path = buildNotchPath(SCREEN_WIDTH);

  return (
    <View style={styles.bgContainer}>
      <Svg
        width={SCREEN_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SCREEN_WIDTH} ${SVG_HEIGHT}`}
        style={styles.bgSvg}
      >
        <Defs>
          <SvgLinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? '#0A1628' : '#1E3A8A'} />
            <Stop offset="1" stopColor={isDark ? '#050D1A' : '#0F1D45'} />
          </SvgLinearGradient>
        </Defs>
        <Path d={path} fill="url(#barGrad)" />
        {/* Subtle top edge highlight — follows the notch shape */}
        <Path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
});

// ─── Standard Tab Icon ───
const TabIcon = React.memo(({ focused, name, outlineName }: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
}) => (
  <Ionicons
    name={focused ? name : outlineName}
    size={22}
    color={focused ? '#FFFFFF' : INACTIVE_COLOR}
  />
));

// ─── Hero Center Button (floats in the notch) ───
const HeroCenterButton = ({ onPress, accessibilityState }: BottomTabBarButtonProps) => {
  const focused = accessibilityState?.selected ?? false;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  return (
    <View style={styles.heroWrapper}>
      <Pressable
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.heroPressable}
      >
        <Animated.View style={[
          styles.heroCircle,
          {
            backgroundColor: focused ? mifacuGold : '#2A4FAE',
            borderColor: focused ? mifacuGold : '#3B63C9',
            transform: [{ scale: scaleAnim }],
          },
        ]}>
          <Ionicons
            name={focused ? 'grid' : 'grid-outline'}
            size={24}
            color="#FFFFFF"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

// ─── Layout ───
export default function TabsLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarBackground: () => <NotchedBackground isDark={isDark} />,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: TOTAL_BAR_HEIGHT,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          // No shadow on the container itself — the SVG shape IS the visual
          shadowOpacity: 0,
          overflow: 'visible',
          paddingBottom: SAFE_BOTTOM,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: -2,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 6,
          paddingBottom: 2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" outlineName="home-outline" />
          ),
        }}
      />

      <Tabs.Screen
        name="materias"
        options={{
          title: 'Materias',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="school" outlineName="school-outline" />
          ),
        }}
      />

      <Tabs.Screen
        name="herramientas"
        options={{
          title: 'Herramientas',
          tabBarButton: (props) => <HeroCenterButton {...props} />,
          tabBarItemStyle: {
            height: TAB_BAR_HEIGHT,
            padding: 0,
            overflow: 'visible',
          },
        }}
      />

      <Tabs.Screen
        name="milo"
        options={{
          title: 'Milo',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="sparkles" outlineName="sparkles-outline" />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person" outlineName="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  // SVG background — positioned so the notch extends above the bar container
  bgContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SVG_HEIGHT,
    // Push the SVG up so the notch portion rises above the tab bar container
    top: -NOTCH_DEPTH,
  },
  bgSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },

  // Hero center button — centered with left:50% + negative margin for pixel-perfect alignment
  heroWrapper: {
    position: 'absolute',
    top: -(HERO_LIFT),
    left: '50%',
    marginLeft: -(HERO_SIZE / 2),
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPressable: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
