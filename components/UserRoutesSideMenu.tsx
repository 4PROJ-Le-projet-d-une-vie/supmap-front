import React, {useEffect, useRef, useState} from 'react';
import {Alert, Animated, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import AddUserRoute from "@/components/AddUserRoute";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ApiService from "@/services/ApiService";

const SCREEN_WIDTH = Dimensions.get('window').width;

const UserRoutesSideMenu = ({userRoutes, onSelect, onClose, onCloseAll}: any) => {
    const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
    const [addUserRouteVisible, setAddUserRouteVisible] = useState(false);

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

    const handleCloseAll = () => {
        onCloseAll();
    }

    const addUserRoute = () => {
        setAddUserRouteVisible(true);
    }

    const handleSelectItem = (item: any) => {
        onSelect(item);
    }

    const deleteItem = async (item: any) => {
        Alert.alert(
            'Êtes vous sûr de vouloir supprimer cet itinéraire ?',
            item.name,
            [
                {
                    text: 'Valider',
                    onPress: async () => {
                        await ApiService.delete('users/me/routes/' + item.id)
                        handleCloseAll()
                    }
                },
                {
                    text: 'Annuler',
                    onPress: () => {}
                }
            ],
            {cancelable: false},
        );
    }

    return (
        <Animated.View style={[styles.menu, {left: slideAnim}]}>
            <Text style={styles.title}>Itinéraires enregistrés</Text>
            {
                userRoutes?.length > 0 && (
                    <View style={{ flex: 0.75 }}>
                        <FlatList
                            data={userRoutes}
                            keyExtractor={(item, index) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.item} onPress={() => handleSelectItem(item)}>
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.itemText} numberOfLines={0}>{item.name}</Text>
                                        <MaterialIcons
                                            name={'delete'}
                                            style={styles.icon}
                                            size={30}
                                            color={'white'}
                                            onPress={() => deleteItem(item)}
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    </View>
                )
            }

            {
                userRoutes?.length <= 0 && (
                    <Text>Aucune route créée</Text>
                )
            }

            <TouchableOpacity onPress={addUserRoute} style={styles.addButton}>
                <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onCloseAll}>
                <MaterialIcons color={'rgba(87,69,138, 1)'} size={30} name={'cancel'}/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={closeMenu}>
                <MaterialIcons color={'rgba(87,69,138, 1)'} size={30} name={'arrow-back'}/>
            </TouchableOpacity>
            <AddUserRoute
                visible={addUserRouteVisible}
                onClose={() => {
                    setAddUserRouteVisible(false);
                    onCloseAll()
                }}
                onSuccess={() => {}}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    menu: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '115%',
        height: '120%',
        backgroundColor: '#fff',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
        zIndex: 102,
    },
    title: {fontSize: 20, fontWeight: 'bold', marginTop: 40, marginBottom: 20},
    item: {
        paddingVertical: 12,
        backgroundColor: 'rgba(87,69,138, 1)',
        borderRadius: 10,
        paddingLeft: 10,
        marginTop: 10
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // ou 'center' selon ton besoin
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        marginRight: 10, // pour laisser de l'espace à l'icône
        flexWrap: 'wrap',
    },
    icon: {
        marginRight: 10,
    },
    closeButton: {position: 'absolute', top: 15, right: 15},
    backButton: {position: 'absolute', top: 15, left: 15},
    addButton: {
        position: 'absolute',
        bottom: 150,
        left: 20,
        backgroundColor: 'rgba(87,69,138, 1)',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 50,
        borderRadius: 10,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default UserRoutesSideMenu;
