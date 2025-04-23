import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import testingData from '../constants/route.json';

interface Props {
    instruction: string | null;
    arrivalTime: string | null;
}

const RouteInstructions: React.FC<Props> = ({ instruction, arrivalTime }) => {
    if (!instruction || !arrivalTime) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.instruction}>{instruction}</Text>
            <Text style={styles.informationText}>
                {arrivalTime}
                &nbsp; &#11044; &nbsp;
                {testingData.trip.summary.length.toFixed(0)} km
                &nbsp; &#11044; &nbsp;
                {(testingData.trip.summary.time / 60).toFixed(0)} min
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'rgba(87,69,138, 1)',
        padding: 15,
        height: 130,
        width: '100%',
    },
    instruction: {
        color: 'white',
        fontSize: 20,
        marginVertical: 4,
        marginTop: 40
    },
    informationText: {
        color: 'white',
        fontSize: 20,
        marginVertical: 4,
    }
});

export default RouteInstructions;
