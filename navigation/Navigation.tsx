import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MapComponent from '../components/MapComponent';
import LoginScreen from '../components/LoginScreen';
import RegisterScreen from '../components/RegisterScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={MapComponent} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
};

export default Navigation;
