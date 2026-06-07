// App.js — root entry point
import 'react-native-gesture-handler'; // must be first import
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0f0f0f" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
