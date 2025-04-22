import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, {LatLng, Marker, Polyline} from 'react-native-maps';
import * as Location from 'expo-location';
import RouteInstructions from '../components/RouteInstructions';

const API_URL = "https://ton-api.com/get-route";
import testingData from '../constants/route.json';

const MapComponent = () => {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [instructions, setInstructions] = useState<any[]>([]);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        let subscription: any;

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission refusée');
                return;
            }

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000, // Toutes les 2 secondes
                    distanceInterval: 2, // Ou tous les 2 mètres
                },
                (loc) => {
                    setLocation(loc.coords);
                    setRegion({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                    if (instructions.length > 0 && routeCoords.length > 0) {
                        const currentInstruction = instructions[currentInstructionIndex];

                        const beginCoord = routeCoords[currentInstruction.begin_shape_index];
                        const endCoord = routeCoords[currentInstruction.end_shape_index];

                        const distToEnd = getDistance(location, endCoord); // Fonction à ajouter ci-dessous

                        if (distToEnd < 15 && currentInstructionIndex < instructions.length - 1) {
                            setCurrentInstructionIndex(currentInstructionIndex + 1);
                        }
                    }
                }
            );
        })();

        return () => {
            subscription && subscription.remove();
        };
    }, []);


    const fetchRoute = async (destination: any) => {
        if (!location) return;

        setLoading(true);
        try {
            setRouteCoords(testingData.decodedPolyline);
            setTimeout(() => {
                if (mapRef.current && testingData.decodedPolyline.length > 0) {
                    mapRef.current.fitToCoordinates(testingData.decodedPolyline, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                }
            }, 500);
            setInstructions(testingData.trip.legs[0].maneuvers); // Assumes API returns an array of steps
        } catch (error) {
            console.error("Erreur lors de la récupération de l'itinéraire:", error);
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            {region && (
                <MapView ref={mapRef} style={styles.map} initialRegion={region} onPress={(event) => fetchRoute(event.nativeEvent.coordinate)} showsUserLocation>
                    {location && <Marker coordinate={location} title="Départ" />}
                    {routeCoords.length > 0 && (
                        <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
                    )}
                </MapView>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="blue" style={styles.loader} />
            ) : instructions.length > 0 ? (
                <RouteInstructions instruction={instructions[currentInstructionIndex]?.instruction || null} />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    instructionsContainer: { position: 'absolute', top: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10, width: '90%', alignSelf: 'center' },
    instruction: { color: '#fff', fontSize: 16, marginVertical: 2 },
    loader: { position: 'absolute', top: '50%', alignSelf: 'center' }
});

function getDistance(coord1: any, coord2: any) {
    const toRad = (value: any) => (value * Math.PI) / 180;

    const R = 6371e3; // rayon de la Terre en mètres
    const φ1 = toRad(coord1.latitude);
    const φ2 = toRad(coord2.latitude);
    const Δφ = toRad(coord2.latitude - coord1.latitude);
    const Δλ = toRad(coord2.longitude - coord1.longitude);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance en mètres
}


export default MapComponent;
