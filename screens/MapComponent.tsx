import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    Image, TextInput, Switch, Modal, Button,
} from 'react-native';
import MapView, {LatLng, Marker, Polyline} from 'react-native-maps';
import * as Location from 'expo-location';
import RouteInstructions from '../components/RouteInstructions';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from "@expo/vector-icons";
import { useRoute, useNavigation } from '@react-navigation/native';
import mapDesign from '../constants/mapDesign.json';
import SideMenu from "@/components/SideMenu";
import ApiService from "@/services/ApiService";
import MultiPointInput from "@/components/MultiPointInput";
import SearchResultsList from "@/components/SearchResultsList";
import testingData from '@/constants/route.json'
import incidentsDesign from '@/constants/incidentsTypeDesign.json'

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
    const [multiplePoints, setMultiplePoints] = useState(false);
    const [avoidTolls, setAvoidTolls] = useState(true);
    const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [incidents, setIncidents] = useState<any[]>([]);

    useEffect(() => {
        let subscription: any;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission refusée');
                return;
            }
            ApiService.get('/incident/types').then(response => {
                setIncidentTypes(response);
            })

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
                    ApiService.get('/incident', {lat: loc.coords.latitude, lon: loc.coords.longitude, radius: 500}).then(response => {
                        console.log(response)
                        setIncidents(response);
                    }).catch(error => console.log(error));
                }
            );
        })();

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (route.params && route.params.selectedRoute) {
            setRouteCoords(route.params.selectedRoute.completeShape);
            setInstructions(route.params.selectedRoute.completeInstructions);
            const travelTimeSeconds = route.params.selectedRoute.summary.time;
            const arrivalDate = new Date(Date.now() + travelTimeSeconds * 1000);
            const formattedArrivalTime = arrivalDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
            setArrivalTime(formattedArrivalTime);
        }
        if (!location || instructions.length === 0 || routeCoords.length === 0) return;
        const newIndex = getClosestInstructionIndex();
        if (newIndex !== currentInstructionIndex) {
            setCurrentInstructionIndex(newIndex);
        }
    }, [location]);

    const getClosestInstructionIndex = () => {
        let closestIndex = currentInstructionIndex;
        let minDistance = Infinity;
        for (let i = currentInstructionIndex; i < instructions.length; i++) {
            const instr = instructions[i];
            const begin = instr.begin_shape_index ?? instr.shape_index ?? 0;
            const end = instr.end_shape_index ?? begin;
            for (let j = begin; j <= end; j++) {
                const point = routeCoords[j];
                if (!point) continue;
                const distance = getDistance(location, point);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = i;
                }
            }
        }
        return minDistance < 30 ? closestIndex : currentInstructionIndex;
    }

    const fetchRoute = async (destination: any, displayName: string|null) => {
        if (!location) return;
        if (displayName) setSearchText(displayName)
        let points = [{lat: location.latitude, lon: location.longitude, name: 'Votre position', type: 'break'}]
        points = points.concat(destination);
        let request = {
            costing: "auto",
            costing_options: {
                use_tolls: avoidTolls ? 0 : 1
            },
            locations: points
        }
        setLoading(true);
        try {
            ApiService.post('/route', request).then((response) => {
                navigation.navigate('RouteChoice', {routes: response.data});
            })
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
        route.params.selectedRoute = null;
        setInstructions([]);
        setRouteCoords([]);
    }

    const fetchSearchResults = (text: string) => {
        if(text === '') {
            setSearchResults([])
            setShowResults(false);
        } else {
            ApiService.get('/geocode', {address: text}).then((response) => {
                setSearchResults(response.data)
                setShowResults(true);
            })
        }
    }

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

    const reportIncident = (incidentType: any) => {
        const request = {
            lat: location.latitude,
            lon: location.longitude,
            type_id: incidentType.id,
        }
        ApiService.post('/incident', request).then(response => {
            setShowIncidentModal(false);
        }).catch(err => {
            console.error(err.message);
        })
    }

    function getDistance(a: LatLng, b: LatLng): number {
        const R = 6371e3;
        const φ1 = a.latitude * Math.PI / 180;
        const φ2 = b.latitude * Math.PI / 180;
        const Δφ = (b.latitude - a.latitude) * Math.PI / 180;
        const Δλ = (b.longitude - a.longitude) * Math.PI / 180;

        const x = Δλ * Math.cos((φ1 + φ2) / 2);
        const y = Δφ;
        const d = Math.sqrt(x * x + y * y) * R;
        return d;
    }

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
                <>
                    <MapView
                        customMapStyle={mapDesign}
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={region}
                        showsUserLocation
                    >
                        {route.params && route.params.selectedRoute && route.params.selectedRoute.locations && route.params.selectedRoute.locations.map((location: any, index: number) => (
                            <Marker
                                key={index}
                                coordinate={{ latitude: location.lat, longitude: location.lon }}
                                title={location.name ? location.name : `Étape ${index + 1}`}
                                pinColor={index === 0 ? 'green' : index === route.params.selectedRoute.locations.length - 1 ? 'red' : 'blue'}
                            />
                        ))}

                        {incidents.map((incident: any, index: number) => (
                            <Marker
                                key={incident.id}
                                coordinate={{ latitude: incident.lat, longitude: incident.lon }}
                                title={incident.type.name}
                            >
                                <View style={{backgroundColor: incidentsDesign[incident.type.id].color, borderRadius: 10, paddingRight: 5, paddingVertical: 5, height: '100%'}}>
                                    <Text style={{marginLeft: 5}}>{incidentsDesign[incident.type.id].icon}</Text>
                                </View>
                            </Marker>
                        ))}

                        {routeCoords.length > 0 && (
                            <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
                        )}
                        {/*{routeCoords.length > 0 && currentInstructionIndex && (*/}
                        {/*    <Polyline coordinates={instructions[currentInstructionIndex].indexes} strokeWidth={5} strokeColor="blue" />*/}
                        {/*)}*/}
                    </MapView>

                    {instructions.length === 0 && (
                        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                            <Ionicons name="menu" size={28} color="#6a3eb5" />
                        </TouchableOpacity>
                    )}

                    {instructions.length === 0 && (
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

                    {instructions.length === 0 && !menuVisible && !showResults && (
                        <TouchableOpacity style={styles.toggleContainer} onPress={() => setMultiplePoints(!multiplePoints)}>
                            <Text style={styles.toggleContainerText}>{!multiplePoints ? 'Passer en mode multi-points' : 'Mode destination unique'}</Text>
                        </TouchableOpacity>
                    )}

                    {instructions.length === 0 && !menuVisible && !multiplePoints && (
                        <View style={styles.searchContainer} pointerEvents="box-none">
                            {showResults && searchResults.length > 0 && (
                                <SearchResultsList searchResults={searchResults} handleClick={fetchRoute} />
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
                                </View>
                            </View>
                        </View>
                    )}

                    {instructions.length === 0 && !menuVisible && multiplePoints && (
                        <View style={styles.searchContainer} pointerEvents="box-none">
                            <MultiPointInput onSubmit={fetchRoute} avoidTolls={avoidTolls} setAvoidTolls={setAvoidTolls} />
                        </View>
                    )}
                </>
            )}

            {loading && <ActivityIndicator size="large" color="blue" style={styles.loader} />}

            {instructions.length > 0 && (
                <>
                    <RouteInstructions
                        instruction={instructions[currentInstructionIndex]?.instruction || null}
                        arrivalTime={arrivalTime}
                        selectedRoute={route.params.selectedRoute}
                    />
                    <TouchableOpacity style={styles.cancelNavButton} onPress={handleExitNavigation}>
                        <Ionicons name="exit" size={28} color="#6a3eb5" />
                    </TouchableOpacity>
                </>
            )}

            {instructions.length > 0  && (
                <TouchableOpacity style={styles.incidentButton} onPress={() => setShowIncidentModal(true)}>
                    <Text style={styles.incidentButtonText}>🚧 Signaler un incident</Text>
                </TouchableOpacity>
            )}

            <Modal visible={showIncidentModal} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sélectionnez un incident</Text>
                        {incidentTypes.map((type) => (
                            <TouchableOpacity key={type.id} style={styles.incidentTypeButton} onPress={() => reportIncident(type)}>
                                <Text>{type.name}</Text>
                            </TouchableOpacity>
                        ))}
                        <Button title="Annuler" onPress={() => setShowIncidentModal(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'white',
    },
    toggleContainer: {
        position: 'absolute',
        bottom: 100,
        left: 35,
        right: 35,
        zIndex: 110,
        backgroundColor: '#004baf',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    searchContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        zIndex: 100,
    },
    searchBarContainer: {
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
    },
    searchInput: {
        marginLeft: 10,
        flex: 1,
        fontSize: 16,
    },
    resultContainer: {
        maxHeight: 200,
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
        zIndex: 20,
        marginBottom: 10,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
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
    toggleContainerText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    tollToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 12,
    },
    tollText: {
        fontSize: 14,
        color: '#333',
        marginRight: 4,
    },
    incidentButton: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: '#ffcc00',
        padding: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
    },

    incidentButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },

    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },

    modalTitle: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 10,
    },

    incidentTypeButton: {
        padding: 12,
        backgroundColor: '#f2f2f2',
        marginVertical: 5,
        borderRadius: 8,
    },

});

export default MapComponent;