/**
 * EstimImmo AI - Application Mobile
 * Point d'entrée principal
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import EstimationScreen from './src/screens/EstimationScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Theme
const COLORS = {
  primary: '#1E3A5F',
  secondary: '#4A90A4',
  accent: '#E8B923',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack Navigator pour le flow principal
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ 
          title: 'Prendre une photo',
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="Estimation" 
        component={EstimationScreen}
        options={{ 
          title: 'Estimation',
          headerBackTitle: 'Retour'
        }}
      />
    </Stack.Navigator>
  );
}

// Tab Navigator principal
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Accueil') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Historique') {
                iconName = focused ? 'time' : 'time-outline';
              } else if (route.name === 'Paramètres') {
                iconName = focused ? 'settings' : 'settings-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: {
              backgroundColor: COLORS.white,
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              paddingBottom: 8,
              paddingTop: 8,
              height: 65,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen 
            name="Accueil" 
            component={MainStack}
            options={{ headerShown: false }}
          />
          <Tab.Screen 
            name="Historique" 
            component={HistoryScreen}
            options={{ title: 'Historique' }}
          />
          <Tab.Screen 
            name="Paramètres" 
            component={SettingsScreen}
            options={{ title: 'Paramètres' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
