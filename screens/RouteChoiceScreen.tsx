import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const RouteChoiceScreen = ({ route, navigation }) => {
    const { routes } = route.params;

    const handleSelect = (selectedRoute) => {
        navigation.navigate('Home', { selectedRoute: selectedRoute, locations: routes[0].locations });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choisis ton itinéraire</Text>
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
});

export default RouteChoiceScreen;
