import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

interface Props {
    instruction: string | null;
}

const RouteInstructions: React.FC<Props> = ({ instruction }) => {
    if (!instruction) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.instruction}>{instruction}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'rgba(87,69,138, 1)',
        padding: 15,
        // borderRadius: 10,
        maxHeight: 200,
        // top: 50
    },
    instruction: {
        color: 'white',
        fontSize: 16,
        marginVertical: 4,
        marginTop: 5,
        // top: 20
    },
});

export default RouteInstructions;
