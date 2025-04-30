import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';
import { AuthProvider } from "@/contexts/AuthContext";
import React from 'react';
import Navigation from "@/navigation/Navigation";

export default function HomeScreen() {
  return (
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }}>
            <Navigation />
        </SafeAreaView>
      </AuthProvider>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
