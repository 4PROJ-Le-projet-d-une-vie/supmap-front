import React, {useState} from 'react';
import {Modal, View, TextInput, Button, StyleSheet, Text, FlatList, TouchableOpacity} from 'react-native';
import ApiService from '@/services/ApiService';

const AddUserRoute = ({ visible, onClose, onSuccess }: any) => {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchDestinationText, setSearchDestinationText] = useState('');
    const [searchResults, setSearchResults] = useState<any>([]);
    const [showResults, setShowResults] = useState(false);

    const handleAddRoute = async () => {
        try {
            setLoading(true);
            await ApiService.post('/users/me/routes', {
                name: name,
                route: [{
                    lat: destination[0],
                    lon: destination[1],
                }],
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Erreur ajout route', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResultPress = (item: any) => {
        setShowResults(false);
        setSearchDestinationText(item.name)
        setDestination([item.lat, item.lon])
    }

    const fetchSearchResults = (text: string) => {
        if (text === '') {
            setSearchResults([]);
            setShowResults(false);
        } else {
            ApiService.get('/geocode', { address: text }).then((response) => {
                setSearchResults(response.data);
                setShowResults(true);
            });
        }
    };


    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.label}>Nom de l'itinéraire</Text>
                    <TextInput value={name} onChangeText={setName} style={styles.input} />

                    <Text style={styles.label}>Destination</Text>
                    <TextInput
                        value={searchDestinationText}
                        onChangeText={(text) => {
                            setSearchDestinationText(text);
                            fetchSearchResults(text);
                        }}
                        style={styles.input}
                    />
                    {showResults && searchResults.length > 0 && (
                        <View style={styles.resultContainer}>
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, index) => item.place_id?.toString() ?? index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => handleResultPress(item)}
                                        style={styles.resultItem}
                                    >
                                        <Text>{item.display_name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    <TouchableOpacity style={[styles.buttons, {marginBottom: 10, backgroundColor: 'rgba(87,69,138, 1)'}]} onPress={handleAddRoute} disabled={loading || destination === null}>
                        <Text style={styles.buttonsText} disabled={loading}> Ajouter </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.buttons, {marginBottom: 10, backgroundColor: 'grey'}]} onPress={onClose}>
                        <Text style={styles.buttonsText}> Annuler </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    content: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '85%' },
    label: { fontWeight: 'bold', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, paddingHorizontal: 10, height: 40 },
    resultContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        maxHeight: 200,
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
        zIndex: 20,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    buttons: {
        borderRadius: 10,
        color: 'white',
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    buttonsText: {
        color: 'white',
        fontWeight: 'bold'
    }
});

export default AddUserRoute;
