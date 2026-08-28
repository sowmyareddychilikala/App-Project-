import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export const SafetyNavbar = ({ currentTab, navigation, routeParams }) => {
  const tabs = [
    { id: 'map', label: 'Map', icon: 'map', screen: 'SafetyMap' },

    { id: 'medicines', label: 'Medicines', icon: 'healing', screen: 'RecentSuspiciousMedicines' },
    { id: 'recalls', label: 'Recalls', icon: 'warning', screen: 'MedicineRecallAlerts' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => {
              if (currentTab !== tab.id) {
                navigation.navigate(tab.screen, routeParams);
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={tab.icon}
              size={isActive ? 22 : 24}
              color={isActive ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingVertical: 10,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  navItemActive: {
    backgroundColor: colors.primaryFixed,
  },
  navLabel: {
    fontFamily: 'Atkinson Hyperlegible Next',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  navLabelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
});

export default SafetyNavbar;
