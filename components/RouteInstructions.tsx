import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import instructionsIcons from '@/constants/instructionsIcons.json'
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface Props {
    instruction: any | null;
}

const RouteInstructions: React.FC<Props> = ({ instruction }) => {
    if (!instruction) return null;

    return (
        <View style={styles.container}>
            <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.instruction}>{instruction.street_names.length ? instruction.street_names.join(', ') : instruction.instruction}</Text>
                <View>
                    <MaterialIcons style={{marginBottom: -50}} name={instructionsIcons[instruction.type]} size={70} color={'white'}/>
                    <Text style={styles.instructionDistance}> {instruction.distanceTo < 1000 ? instruction.distanceTo.toFixed(0) + 'm' : (instruction.distanceTo/1000).toFixed(2) + 'km'}</Text>
                </View>
            </View>
            <Text style={styles.informationText}>
                {instruction.arrivalTime}
                &nbsp; &#11044; &nbsp;
                {(instruction.remainingDistance / 1000).toFixed(0)} km
                &nbsp; &#11044; &nbsp;
                {(instruction.remainingDuration < 3600 ? instruction.remainingDuration / 60 : instruction.remainingDuration / 3600).toFixed(0)} min
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'rgba(87,69,138, 1)',
        padding: 15,
        minHeight: 130,
        width: '100%',
    },
    instruction: {
        color: 'white',
        fontSize: 20,
        marginVertical: 4,
        marginTop: 40,
        width: '80%'
    },
    instructionDistance: {
        color: 'white',
        fontSize: 20,
        marginVertical: 4,
        marginTop: 40,
    },
    informationText: {
        color: 'white',
        fontSize: 20,
        marginVertical: 4,
    }
});

export default RouteInstructions;
