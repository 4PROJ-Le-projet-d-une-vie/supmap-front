import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, {LatLng, Marker, Polyline} from 'react-native-maps';
import * as Location from 'expo-location';

const API_URL = "https://ton-api.com/get-route"; // Remplace par l'URL de ton API
import testingData from '../constants/route.json';

const MapComponent = () => {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]); // Stocke la polyline
    const [instructions, setInstructions] = useState([]); // Stocke les instructions
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission refusée');
                return;
            }

            let userLocation = await Location.getCurrentPositionAsync({});
            setLocation(userLocation.coords);
            setRegion({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        })();
    }, []);

    const fetchRoute = async (destination: any) => {
        if (!location) return;

        setLoading(true);
        try {
            // const response = await fetch(API_URL, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         start: { latitude: location.latitude, longitude: location.longitude },
            //         end: destination,
            //     }),
            // });
            //
            // const data = await response.json();
            // setRouteCoords(data.polyline); // Assumes API returns [{latitude: ..., longitude: ...}, {...}]
            console.log(testingData.decodedPolyline)
            setRouteCoords(testingData.decodedPolyline); // Assumes API returns [{latitude: ..., longitude: ...}, {...}]
            console.log(routeCoords.length);
            console.log(routeCoords);
            // setInstructions(data.instructions); // Assumes API returns an array of steps
        } catch (error) {
            console.error("Erreur lors de la récupération de l'itinéraire:", error);
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            {region && (
                <MapView style={styles.map} initialRegion={region} onPress={(event) => fetchRoute(event.nativeEvent.coordinate)} showsUserLocation>
                    {location && <Marker coordinate={location} title="Départ" />}
                    {/* Exemple : Destination fixe (remplace par un choix utilisateur) */}
                    <Marker
                        coordinate={{ latitude: 48.8566, longitude: 2.3522 }} // Paris
                        title="Destination"
                        onPress={() => fetchRoute({ latitude: 48.8566, longitude: 2.3522 })}
                    />
                    {/* Affichage de la polyline */}
                    {routeCoords.length > 0 && (
                        <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
                    )}
                </MapView>
            )}

            {/* Affichage des instructions */}
            {loading ? (
                <ActivityIndicator size="large" color="blue" style={styles.loader} />
            ) : instructions.length > 0 ? (
                <View style={styles.instructionsContainer}>
                    {instructions.map((step, index) => (
                        <Text key={index} style={styles.instruction}>{step}</Text>
                    ))}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    instructionsContainer: { position: 'absolute', bottom: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10, width: '90%', alignSelf: 'center' },
    instruction: { color: '#fff', fontSize: 16, marginVertical: 2 },
    loader: { position: 'absolute', top: '50%', alignSelf: 'center' }
});

export default MapComponent;
