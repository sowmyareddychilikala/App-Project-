import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Theme } from '../../constants/Theme';
import Svg, { Path, Circle } from 'react-native-svg';

// Custom icons to avoid external asset dependency issues
const TabIcon = ({ name, color, focused }: { name: string; color: string; focused: boolean }) => {
  return (
    <View style={[styles.iconWrapper, focused ? styles.activeGlow : null]}>
      {name === 'home' && (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M3 9.5 L12 3 L21 9.5 V20 A1 1 0 0 1 20 21 H4 A1 1 0 0 1 3 20 Z" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M9 21 V12 H15 V21" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        </Svg>
      )}
      {name === 'cabinet' && (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M4 4 H20 V20 H4 Z" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M4 9 H20 M4 14 H20" stroke={color} strokeWidth={2.5} />
          <Circle cx="12" cy="6.5" r="1" fill={color} />
          <Circle cx="12" cy="11.5" r="1" fill={color} />
          <Circle cx="12" cy="16.5" r="1" fill={color} />
        </Svg>
      )}
      {name === 'search' && (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle cx="11" cy="11" r="6" fill="none" stroke={color} strokeWidth={2.5} />
          <Path d="M16 16 L21 21" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      )}
      {name === 'safety' && (
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M12 2 L2 22 H22 Z" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Path d="M12 9 V13 M12 17 H12.01" stroke={color} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      )}
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Theme.colors.primaryLight,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Cabinet',
          tabBarIcon: ({ color, focused }) => <TabIcon name="cabinet" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Lookup',
          tabBarIcon: ({ color, focused }) => <TabIcon name="search" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: 'Recalls',
          tabBarIcon: ({ color, focused }) => <TabIcon name="safety" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activeGlow: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
});
