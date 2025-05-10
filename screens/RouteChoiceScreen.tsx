import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const RouteChoiceScreen = ({ route, navigation }) => {
    const { routes, searchText } = route.params;

    const handleSelect = (selectedRoute) => {
        let completeShape: any[] = [];
        let completeInstructions: any[] = []
        for(let leg of selectedRoute.legs) {
            completeShape = completeShape.concat(leg.shape);
            completeInstructions = completeInstructions.concat(leg.maneuvers);
        }
        selectedRoute.completeShape = completeShape;
        selectedRoute.completeInstructions = completeInstructions;
        navigation.navigate('Home', { selectedRoute: selectedRoute });
    };

    const handleCancel = () => {
        navigation.navigate('Home', { defaultSearchText: searchText });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choisissez votre itinéraire</Text>
            <FlatList
                data={routes}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
                        <Text style={styles.label}>Itinéraire {item.locations[item.locations.length - 1].name}</Text>
                        <Text>Temps : {Math.round(item.summary.time / 60)} min</Text>
                        <Text>Distance : {(item.summary.length).toFixed(2)} km</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <MaterialIcons name={'cancel'} color={'rgba(87,69,138, 1)'} size={30} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    card: {
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    cancelButton: {
        position: 'absolute',
        top: 20,
        right: 20
    }
});

export default RouteChoiceScreen;
