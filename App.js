import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

// Ignore specific warnings that might come from libraries
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'AsyncStorage has been extracted from react-native',
  'Setting a timer for a long period of time',
]);

// Custom theme for react-native-paper
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',
    accent: '#FF9500',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#333333',
    placeholder: '#999999',
    error: '#FF3B30',
  },
  roundness: 8,
};

console.log("✅ App.js is running!");

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <AppNavigator />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}