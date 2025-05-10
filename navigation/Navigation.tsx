import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MapComponent from '@/screens/MapComponent';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import RouteChoiceScreen from "@/screens/RouteChoiceScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import CameraScreen from "@/screens/QrCodeScanner";

const Stack = createNativeStackNavigator();

const Navigation = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={MapComponent} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RouteChoice" component={RouteChoiceScreen} />
            <Stack.Screen name="UserProfile" component={ProfileScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
        </Stack.Navigator>
    );
};

export default Navigation;
