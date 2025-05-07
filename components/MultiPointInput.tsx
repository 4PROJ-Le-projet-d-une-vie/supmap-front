import React, { useState } from 'react';
import {View, TextInput, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Switch,} from 'react-native';
import ApiService from "@/services/ApiService";

export default function MultiPointInput({ onSubmit, avoidTolls, setAvoidTolls }: { onSubmit: (data: any) => void, avoidTolls: boolean, setAvoidTolls:(data: boolean) => void }) {
    const [stops, setStops] = useState<any[]>([]);
    const [destination, setDestination] = useState<any>({});
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [currentEditing, setCurrentEditing] = useState<number|null>(null);

    const handleSubmit = () => {
        if (!destination.lat || !destination.lon) return;
        onSubmit(stops.concat(destination));
    };

    const updateStop = (text: string, index: number) => {
        const newStops = [...stops];
        if (!newStops[index]) newStops[index] = {};
        newStops[index].name = text;
        setStops(newStops);
        search(text, index);
    };

    const addStop = () => setStops([...stops, { name: '' }]);

    const removeStop = (index: number) => {
        const updated = [...stops];
        updated.splice(index, 1);
        setStops(updated);
    };

    const search = (searchText: string, index: number) => {
        try {
            if (searchText === '') {
                setCurrentEditing(null)
                setShowResults(false);
                setSearchResults([])
            } else {
                ApiService.get('/geocode', {address: searchText}).then((response) => {
                    setSearchResults(response.data)
                    setShowResults(true);
                    setCurrentEditing(index);
                })
            }
        } catch (error) {
            console.log(error)
        }
    }

    const setStopLatLon = (item: any) => {
        if(currentEditing !== null) {
            let stop = {
                lat: parseFloat(item.lat),
                lon : parseFloat(item.lon),
                name: item.display_name,
                type: 'break',
            };
            let newStops = [...stops];
            if(currentEditing !== -1) {
                stop.type = 'via'
                newStops[currentEditing] = stop
                setStops(newStops);
            } else {
                setDestination(stop)
            }
            setShowResults(false);
            setSearchResults([]);
        }
    };

    return (
        <View style={styles.container}>
            {showResults && searchResults.length > 0 && (
                <View style={styles.resultContainer}>
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item, index) => item.place_id?.toString() ?? index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.resultItem} onPress={() => setStopLatLon(item)}>
                                <Text>{item.display_name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Étapes intermédiaires</Text>
                {stops.map((stop, idx) => (
                    <View key={idx} style={styles.stopRow}>
                        <TextInput
                            value={stop?.name || ''}
                            onChangeText={(text) => updateStop(text, idx)}
                            placeholder={`Étape ${idx + 1}`}
                            style={[styles.input, { flex: 1 }]}
                        />
                        <TouchableOpacity onPress={() => removeStop(idx)}>
                            <Text style={styles.remove}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity onPress={addStop}>
                    <Text style={styles.addStop}>+ Ajouter une étape</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Destination</Text>
                <TextInput
                    value={destination?.name || ''}
                    onChangeText={(text) => {
                        setDestination({ ...destination, name: text });
                        search(text, -1);
                    }}
                    placeholder="Ex : Marseille"
                    style={styles.input}
                />
                <View style={styles.tollToggleButton}>
                    <Text style={styles.tollText}>Éviter les péages</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={avoidTolls ? 'rgba(87,69,138, 1)' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => setAvoidTolls(!avoidTolls)}
                        value={avoidTolls}
                    />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>VALIDER L'ITINÉRAIRE</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 5,
        width: '100%',
    },
    form: {
        gap: 12,
    },
    label: {
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 14,
    },
    stopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    remove: {
        fontSize: 18,
        color: '#ff3b30',
        paddingHorizontal: 4,
    },
    addStop: {
        color: '#007aff',
        fontWeight: '600',
        marginBottom: 8,
    },
    submitButton: {
        marginTop: 60,
        backgroundColor: '#004baf',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    resultContainer: {
        marginTop: 8,
        maxHeight: 150,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    resultItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tollToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 5,
    },
    tollText: {
        fontSize: 14,
        color: '#333',
        marginRight: 4,
    }
});
