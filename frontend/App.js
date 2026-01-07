import { StatusBar } from 'expo-status-bar';
import React from 'react';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <LoginScreen />
    </>
  );
}