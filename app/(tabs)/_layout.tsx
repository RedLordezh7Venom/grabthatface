import { Tabs } from 'expo-router';
import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { Scan, Database } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme].border,
          height: 90,
          paddingBottom: 30,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          letterSpacing: 1,
          marginTop: -5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'NEURAL SCAN',
          tabBarIcon: ({ color }) => <Scan size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'DATA UPLINK',
          tabBarIcon: ({ color }) => <Database size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
