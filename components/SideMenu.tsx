import React, {useEffect, useRef, useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated, Dimensions } from 'react-native';
import AddUserRoute from "@/components/AddUserRoute";

const SCREEN_WIDTH = Dimensions.get('window').width;

const SideMenu = ({ userRoutes, onSelect, onClose }: any) => {
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

    const addUserRoute = () => {
        setAddUserRouteVisible(true);
    }

    return (
        <Animated.View style={[styles.menu, { left: slideAnim }]}>
            <Text style={styles.title}>Itinéraires enregistrés</Text>
            {
                userRoutes?.length > 0 && (
                    <FlatList
                        data={userRoutes}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
                                <Text style={styles.routeName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )
            }
            {
                userRoutes?.length <= 0 && (
                    <Text>Aucune route créée</Text>
                )
            }

            <TouchableOpacity onPress={addUserRoute}>
                <View style={styles.item}>
                    <Text>Ajouter</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
                <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
            <AddUserRoute
                visible={addUserRouteVisible}
                onClose={() => setAddUserRouteVisible(false)}
                onSuccess={() => {
                    // recharge les routes si besoin
                }}
            />
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
    title: { fontSize: 20, fontWeight: 'bold',marginTop: 30, marginBottom: 20 },
    item: { paddingVertical: 12 },
    routeName: { fontSize: 16 },
    closeButton: { marginTop: 20 },
    closeText: { color: 'blue' },
});

export default SideMenu;
