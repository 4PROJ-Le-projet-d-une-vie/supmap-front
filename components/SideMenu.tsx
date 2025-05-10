import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Switch, Image} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import UserRoutesSideMenu from "@/components/UserRoutesSideMenu";

const SCREEN_WIDTH = Dimensions.get('window').width;

const SideMenu = ({ userRoutes, onSelect, onClose, avoidTolls, setAvoidTolls, multiplePoints, setMultiplePoints }: any) => {
    const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
    const auth = useAuth();
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const [displayUsersRoutes, setDisplayUsersRoute] = useState(false);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, []);

    const closeMenu = () => {
        Animated.timing(slideAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            onClose();
        });
    };

    const toggleDisplayUsersRoute = () => {
        setDisplayUsersRoute(!displayUsersRoutes);
    }

    return (
        <Animated.View style={[styles.menu, { left: slideAnim }]}>
            <Image source={require('../assets/images/icon.png')} style={{width: 100, position: 'absolute', top: -310, left: 10}} resizeMode={'contain'} />
            {!displayUsersRoutes && (
                <View>
                    <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
                        <MaterialIcons color={'rgba(87,69,138, 1)'} size={30} name={'cancel'} />
                    </TouchableOpacity>
                    <View style={{top: 100}}>
                        {userRoutes?.length <= 0  && isAuthenticated &&(
                            <TouchableOpacity style={[styles.buttonContainer, {marginBottom: 20}]} onPress={toggleDisplayUsersRoute}>
                                <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={styles.buttonContainerText}>Mes itinéraires</Text>
                                    <View style={{width: 50}}/>
                                    <Image source={require('../assets/images/userRoutes.png')} style={{width: 35, height: 35}} resizeMode={'contain'}/>
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.buttonContainer} onPress={() => {setMultiplePoints(!multiplePoints); closeMenu()}}>
                            <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={styles.buttonContainerText}>{!multiplePoints ? 'Ajouter étapes' : 'Étape unique'}</Text>
                                <View style={{width: 50}}/>
                                <Image source={require('../assets/images/multipinIcon.png')} style={{width: 35, height: 35}} resizeMode={'contain'}/>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.tollToggleButton,  {marginTop: 15}]}>
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
            )}
            {displayUsersRoutes && (
                <UserRoutesSideMenu
                    userRoutes={userRoutes}
                    onSelect={onSelect}
                    onClose={() => setDisplayUsersRoute(false)}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    menu: {
        position: 'absolute',
        top: 0,
        width: '75%',
        height: '100%',
        backgroundColor: '#fff',
        zIndex: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
        zIndex: 100,
    },
    closeButton: { position: 'absolute', right: 0},
    buttonContainer: {
        zIndex: 110,
        backgroundColor: 'rgba(87,69,138, 1)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonContainerText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 17,
        textAlign: 'center'
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
});

export default SideMenu;
