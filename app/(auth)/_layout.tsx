import React from 'react';
import { Stack } from 'expo-router';
import { Theme } from '../../constants/Theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.colors.background },
      }}
    />
  );
}
