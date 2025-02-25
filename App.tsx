import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, Text, View} from 'react-native';
import React from "react";
import MapView from 'react-native-maps';

export default function App() {
    const [count, setCount] = React.useState(0);

    return (
        <MapView initialRegion={{
            latitude: 49.12093718131425,
            longitude: -0.19911361796825383
        }}/>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});