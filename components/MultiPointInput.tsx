import React, { useState } from 'react';
import {
    View,
    TextInput,
    Button,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';

export default function MultiPointInput({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [origin, setOrigin] = useState<any>({});
    const [stops, setStops] = useState<any[]>([]);
    const [destination, setDestination] = useState<any>({});

    const handleSubmit = () => {
        if (!origin || !destination) return;
        onSubmit({ origin, stops: stops.filter(s => s.trim()), destination });
    };

    const updateStop = (text: string, index: number) => {
        const newStops = [...stops];
        newStops[index] = text;
        setStops(newStops);
    };

    const addStop = () => setStops([...stops, '']);

    const removeStop = (index: number) => {
        const updated = [...stops];
        updated.splice(index, 1);
        setStops(updated);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Point de départ</Text>
                <TextInput
                    value={origin.name}
                    onChangeText={setOrigin}
                    placeholder="Ex : Paris"
                    style={styles.input}
                />

                <Text style={styles.label}>Étapes intermédiaires</Text>
                {stops.map((stop, idx) => (
                    <View key={idx} style={styles.stopRow}>
                        <TextInput
                            value={stop.name}
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
                    value={destination.name}
                    onChangeText={setDestination}
                    placeholder="Ex : Marseille"
                    style={styles.input}
                />

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
});
