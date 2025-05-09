import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Button, Image, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import MapView, {LatLng, Marker, Polyline} from 'react-native-maps';
import * as Location from 'expo-location';
import RouteInstructions from '../components/RouteInstructions';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from "@expo/vector-icons";
import {useNavigation, useRoute} from '@react-navigation/native';
import mapDesign from '../constants/mapDesign.json';
import UserRoutesSideMenu from "@/components/UserRoutesSideMenu";
import ApiService from "@/services/ApiService";
import MultiPointInput from "@/components/MultiPointInput";
import SearchResultsList from "@/components/SearchResultsList";
import incidentsDesign from '@/constants/incidentsTypeDesign.json'
import SideMenu from "@/components/SideMenu";

interface Props {
    selectedRoute: any | null;
    defaultSearchText: string | null;
}

const MapComponent: React.FC<Props> = ({selectedRoute, defaultSearchText}) => {
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [location, setLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [polyline, setPolyline] = useState<LatLng[]>([]);
    const [instructions, setInstructions] = useState<any[]>([]);
    const [currentInstruction, setCurrentInstruction] = useState(0);
    const [currentInstructionPolyline, setCurrentInstructionPolyline] = useState<any[]>([]);
    const [passedPoints, setPassedPoints] = useState<any[]>([]);
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
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [incidents, setIncidents] = useState<any[]>([]);

    const ws = new WebSocket("ws://192.168.1.219:8082");

    setInterval(() => {
        if (location && location.latitude && location.longitude) {
            ApiService.get('/incidents', {lat: location.latitude, lon: location.longitude, radius: 500 }).then(response => {
                setIncidents(response);
            })
        }
    }, 300000)

    useEffect(() => {
        let subscription: any;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission refusée');
                return;
            }
            if (route.params && route.params.defaultSearchText) setSearchText(route.params.defaultSearchText)

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 100,
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
                    mapRef.current?.animateToRegion({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    });
                    if(!initialLoaded) {
                        ApiService.get('/incidents/types').then(response => {
                            setIncidentTypes(response);
                            ApiService.get('/incidents', {lat: loc.coords.latitude, lon: loc.coords.longitude, radius: 500}).then(response => {
                                setIncidents(response);
                                setInitialLoaded(true);
                            })
                        })
                    }
                }
            );
        })();

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (route.params && route.params.selectedRoute) {
            setPolyline(route.params.selectedRoute.completeShape);
            setInstructions(route.params.selectedRoute.completeInstructions);

            if (!location || !polyline || !instructions) return;
            ws.onopen = () => {
                ws.send(location)
            }

            ws.onmessage = (response) => {
                console.log(response);
            }
            const userPosition = {
                latitude: location.latitude,
                longitude: location.longitude,
            };
            let minDistance = Infinity;
            let closestPointIndex = 0;
            polyline.forEach((point: any, index: number) => {
                const distance = getDistance(userPosition, {
                    latitude: point.latitude,
                    longitude: point.longitude,
                });
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPointIndex = index;
                }
            });
            let remainingDistance = 0;
            for (let i = closestPointIndex; i < polyline.length - 1; i++) {
                remainingDistance += getDistance(polyline[i], polyline[i + 1]);
            }
            for (let i = 0; i < instructions.length; i++) {
                const previousEnd = i === 0 ? -1 : instructions[i - 1].end_shape_index;
                if (
                    closestPointIndex > previousEnd &&
                    closestPointIndex <= instructions[i].end_shape_index
                ) {
                    let newInstructionPolyline = [];
                    let newPassedPoints = []
                    for(let j = instructions[i+1].begin_shape_index; j < instructions[i+1].end_shape_index; j++) {
                        newInstructionPolyline.push(polyline[j]);
                    }
                    for(let j = 0; j < findClosestPolylineIndex(); j++) {
                        newPassedPoints.push(polyline[j]);
                    }
                    let remainingDuration = 0;
                    if (i !== -1) {
                        for (let j = i; j < instructions.length; j++) {
                            remainingDuration += instructions[j].time;
                        }
                    }

                    const arrivalDate = new Date(Date.now() + remainingDuration * 1000);
                    const formattedArrivalTime = arrivalDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    instructions[i+1]['distanceTo'] = getDistance(userPosition, polyline[instructions[i + 1].end_shape_index]);
                    instructions[i+1]['remainingDistance'] = remainingDistance;
                    instructions[i+1]['remainingDuration'] = remainingDuration;
                    instructions[i+1]['arrivalTime'] = formattedArrivalTime;
                    setCurrentInstructionPolyline(newInstructionPolyline);
                    setPassedPoints(newPassedPoints);
                    setCurrentInstruction(instructions[i+1]);
                    break;
                }
            }
        }
    }, [location]);

    const findClosestPolylineIndex = () => {
        let minDistance = Infinity;
        let closestIndex = 0;
        polyline.forEach((point: any, index: any) => {
            const distance = getDistance(
                { latitude: location.latitude, longitude: location.longitude },
                { latitude: point.latitude, longitude: point.longitude }
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
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
                navigation.navigate('RouteChoice', {routes: response.data, searchText: searchText});
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
        setPolyline([]);
        setPassedPoints([])
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
                if (isAuthenticated) data = await ApiService.get('/users/me/routes');
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
        ApiService.post('/incidents', request).then(response => {
            setShowIncidentModal(false);
            setIncidents([...incidents, response]);
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
                    avoidTolls={avoidTolls}
                    setAvoidTolls={setAvoidTolls}
                    multiplePoints={multiplePoints}
                    setMultiplePoints={setMultiplePoints}
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

                        {incidents.map((incident: any) => (
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

                        {passedPoints.length > 0 && (
                            <Polyline coordinates={passedPoints} strokeWidth={5} strokeColor="grey" zIndex={0}/>
                        )}
                        {currentInstructionPolyline.length > 0 && currentInstruction !== null && (
                            <Polyline coordinates={currentInstructionPolyline} strokeWidth={4} strokeColor="white" zIndex={1}/>
                        )}

                        {polyline.length > 0 && (
                            <Polyline coordinates={polyline} strokeWidth={5} strokeColor="blue" />
                        )}
                    </MapView>

                    {instructions.length === 0 && (
                        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                            <Ionicons name="menu" size={40} color="#6a3eb5" />
                        </TouchableOpacity>
                    )}

                    {instructions.length === 0 && (
                        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                            <Image
                                resizeMethod={'resize'}
                                source={
                                    isAuthenticated
                                        ? { uri: 'https://i.pravatar.cc/100' }
                                        : require('../assets/images/default-avatar.jpg')
                                }
                                style={styles.avatar}
                            />
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
                                </View>
                            </View>
                        </View>
                    )}

                    {instructions.length === 0 && !menuVisible && multiplePoints && (
                        <View style={styles.searchContainer} pointerEvents="box-none">
                            <MultiPointInput onSubmit={fetchRoute} onCancel={setMultiplePoints} avoidTolls={avoidTolls} setAvoidTolls={setAvoidTolls} />
                        </View>
                    )}
                </>
            )}

            {loading && <ActivityIndicator size="large" color="blue" style={styles.loader} />}

            {instructions.length > 0 && (
                <>
                    <RouteInstructions
                        instruction={currentInstruction || null}
                    />
                    <TouchableOpacity style={styles.cancelNavButton} onPress={handleExitNavigation}>
                        <Ionicons style={{top: 5, left: 10}} name="exit" size={50} color="#6a3eb5" />
                    </TouchableOpacity>
                </>
            )}

            {instructions.length > 0  && (
                <TouchableOpacity style={styles.incidentButton} onPress={() => setShowIncidentModal(true)}>
                    <Image style={{resizeMode: 'stretch', height: 40, width: 40, top: 7, left: 7}} source={require('../assets/images/incidentAddButton.png')}/>
                </TouchableOpacity>
            )}

            <Modal visible={showIncidentModal} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sélectionnez un incident</Text>
                        {incidentTypes.map((type) => (
                            <TouchableOpacity key={type.id} style={{padding: 12, backgroundColor: incidentsDesign[type.id].color, marginVertical: 5, borderRadius: 8}} onPress={() => reportIncident(type)}>
                                <Text>{type.name} {incidentsDesign[type.id].icon}</Text>
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
        top: 10,
        left: 10,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 10,
        zIndex: 2,
    },
    profileButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'white',
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
        height: 80,
        width: 80,
    },
    incidentButton: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        alignSelf: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 20,
        height: 80,
        width: 80,
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
});

export default MapComponent;