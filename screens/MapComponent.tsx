import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    Button,
    Alert,
    TouchableOpacity,
    Image,
    TextInput, FlatList, Keyboard
} from 'react-native';
import MapView, {LatLng, Marker, Polyline} from 'react-native-maps';
import * as Location from 'expo-location';
import RouteInstructions from '../components/RouteInstructions';
import {useAuth} from "@/contexts/AuthContext";
import testingData from '../constants/route.json';
import {Ionicons} from "@expo/vector-icons";
import { useRoute, useNavigation } from '@react-navigation/native';
import mapDesign from '../constants/mapDesign.json';
import testingSearchResults from '../constants/geocodingThreeResults.json'
import SideMenu from "@/components/SideMenu";
import ApiService from "@/services/ApiService";

interface Props {
    selectedRoute: any | null;
}

const MapComponent: React.FC<Props> = ({selectedRoute}) => {
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [instructions, setInstructions] = useState<any[]>([]);
    const [arrivalTime, setArrivalTime] = useState<string | null>(null);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<any>([]);
    const [showResults, setShowResults] = useState(false);
    const mapRef = useRef(null);
    const auth = useAuth();
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const navigation = useNavigation();
    const route = useRoute();
    const [menuVisible, setMenuVisible] = useState(false);
    const [userRoutes, setUserRoutes] = useState([]);

    useEffect(() => {
        let subscription: any;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission refusée');
                return;
            }

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000,
                    distanceInterval: 2,
                },
                (loc) => {
                    setLocation(loc.coords);
                    setRegion({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                }
            );
        })();

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (route.params && route.params.selectedRoute) {
            setRouteCoords(route.params.selectedRoute.legs[0].shape);
            setInstructions(route.params.selectedRoute.legs[0].maneuvers);
            const travelTimeSeconds = route.params.selectedRoute.summary.time;
            const arrivalDate = new Date(Date.now() + travelTimeSeconds * 1000);
            const formattedArrivalTime = arrivalDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
            setArrivalTime(formattedArrivalTime);
        }
        if (!location || instructions.length === 0 || routeCoords.length === 0) return;

        const currentInstruction = instructions[currentInstructionIndex];
        const endCoord = routeCoords[currentInstruction.end_shape_index];

        if (!endCoord) return;

        const distToEnd = getDistance(location, endCoord);

        if (distToEnd < 15 && currentInstructionIndex < instructions.length - 1) {
            setCurrentInstructionIndex(prev => prev + 1);
        }
    }, [location]);



    const fetchRoute = async (destination: any) => {
        if (!location) return;
        setLoading(true);
        try {
            navigation.navigate('RouteChoice', { routes: testingData.data });
        } catch (error) {
            console.error("Erreur lors de la récupération de l'itinéraire:", error);
        }
        setLoading(false);
    };

    const handleProfilePress = () => {
        if (!isAuthenticated) {
            navigation.navigate('Login');
        } else {
            navigation.navigate('UserProfile');
        }
    };

    const handleExitNavigation = () => {
        setInstructions([]);
        setRouteCoords([]);
    }

    const fetchSearchResults = () => {
        setSearchResults(testingSearchResults.data)
        setShowResults(true);
    }

    const handleResultPress = (item) => {
        Keyboard.dismiss();
        setShowResults(false);
        setSearchText(item.display_name);
        const destination = {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        };
        navigation.navigate('RouteChoice', { routes: testingData.data });
    };

    const toggleMenu = async () => {
        if (!menuVisible) {
            try {
                let data = []
                if (isAuthenticated) data = await ApiService.get('/user/me/routes');
                setUserRoutes(data);
            } catch (e) {
                console.error('Erreur récupération itinéraires:', e);
            }
        }
        setMenuVisible(!menuVisible);
    };

    const handleSelectUserRoute = (route: any) => {
        setMenuVisible(false);
        fetchRoute(route.destination);
    };

    return (
        <View style={styles.container}>
            {menuVisible && (
                <SideMenu
                    userRoutes={userRoutes}
                    onSelect={handleSelectUserRoute}
                    onClose={() => setMenuVisible(false)}
                />
            )}
            {region && (
                <View>
                    <MapView customMapStyle={mapDesign} ref={mapRef} style={styles.map} initialRegion={region} showsUserLocation>
                        {location && <Marker coordinate={location} title="Départ" />}
                        {routeCoords.length > 0 && (
                            <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
                        )}
                    </MapView>
                    {instructions.length == 0 && (
                        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                            <Ionicons name="menu" size={28} color="#6a3eb5" />
                        </TouchableOpacity>
                    )}

                    {instructions.length == 0 && (
                        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                            <Image
                                source={
                                    isAuthenticated
                                        ? { uri: 'https://i.pravatar.cc/100' }
                                        : require('../assets/images/default-avatar.jpg')
                                }
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    )}

                    {instructions.length == 0 && !menuVisible && (
                        <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 100 }}>
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

                            <View style={styles.searchBarContainer}>
                                <View style={styles.searchBar}>
                                    <Ionicons name="search" size={20} color="black" />
                                    <TextInput
                                        placeholder="Où allons-nous ?"
                                        value={searchText}
                                        onChangeText={(text) => {
                                            setSearchText(text);
                                            fetchSearchResults(text);
                                        }}
                                        style={styles.searchInput}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                </View>
            )}

            {loading && (
                <ActivityIndicator size="large" color="blue" style={styles.loader} />
            )}

            {
                instructions.length > 0 && (
                    <RouteInstructions instruction={instructions[currentInstructionIndex]?.instruction || null} arrivalTime={arrivalTime} selectedRoute={route.params.selectedRoute} />
                )
            }

            {instructions.length > 0 && (
                <TouchableOpacity style={styles.cancelNavButton} onPress={handleExitNavigation}>
                    <Ionicons name="exit" size={28} color="#6a3eb5" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    instructionsContainer: { position: 'absolute', top: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10, width: '90%', alignSelf: 'center' },
    instruction: { color: '#fff', fontSize: 16, marginVertical: 2 },
    loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
    menuButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 10,
        zIndex: 2,
    },
    profileButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 2,
    },
    cancelNavButton: {
        backgroundColor: 'white',
        position: 'absolute',
        bottom: 40,
        right: 20,
        zIndex: 2,
        borderRadius: 20,
        padding: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'white',
    },
    searchBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
        zIndex: 10,
    },
    searchInput: {
        marginLeft: 10,
        flex: 1,
        fontSize: 16,
    },
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
});

function getDistance(coord1: any, coord2: any) {
    const toRad = (value: any) => (value * Math.PI) / 180;

    const R = 6371e3;
    const rad1 = toRad(coord1.latitude);
    const rad2 = toRad(coord2.latitude);
    const deltaRad = toRad(coord2.latitude - coord1.latitude);
    const deltaLambda = toRad(coord2.longitude - coord1.longitude);

    const a =
        Math.sin(deltaRad / 2) * Math.sin(deltaRad / 2) +
        Math.cos(rad1) * Math.cos(rad2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export default MapComponent;
