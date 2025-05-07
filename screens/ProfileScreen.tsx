import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {clearTokens, saveTokens} from '@/services/AuthStorage';
import ApiService from '@/services/ApiService';
import EditPassword from "@/components/EditPassword";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/contexts/AuthContext";
import {useNavigation} from "@react-navigation/native";

const ProfileScreen = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState({
        handle: '',
        email: '',
        password: '',
        avatar: '',
    });
    const [editing, setEditing] = useState(false);
    const [editPassword, setEditPassword] = useState(false);
    const navigation = useNavigation();

    const fetchProfile = async () => {
        const response = await ApiService.get('/user/me');
        if (response) {
            setProfile(response);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const localUri = result.assets[0].uri;
            setProfile(prev => ({ ...prev, avatar: localUri }));
        }
    };

    const saveChanges = async () => {
        const body = {
            email: profile.email,
            handle: profile.handle.substring(1),
        };
        const response = await ApiService.patch('/user/me', body);
        if (response) {
            Alert.alert('Succès', 'Profil mis à jour.');
            saveTokens(response.tokens.access_token, response.tokens.refresh_token)
            setEditing(false);
        }
    };

    const handlePressEditPassword = async () => {
        setEditPassword(!editPassword);
    }

    const handleLogout = async () =>{
        logout()
        await clearTokens()
        navigation.navigate('Home');
    }

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={pickImage}>
                <Image
                    source={profile.avatar ? { uri: profile.avatar } : require('@/assets/images/default-avatar.jpg')}
                    style={styles.avatar}
                />
                <Text style={styles.changePhoto}>Changer la photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="exit" size={28} color="#6a3eb5" />
            </TouchableOpacity>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                editable={editing}
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
            />

            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput
                style={styles.input}
                editable={editing}
                value={profile.handle}
                onChangeText={(text) => setProfile({ ...profile, handle: text })}
            />

            <TouchableOpacity onPress={handlePressEditPassword}>
                <Text style={styles.changePassword}>Modifier le mot de passe</Text>
            </TouchableOpacity>

            <Button
                title={editing ? 'Enregistrer' : 'Modifier'}
                onPress={editing ? saveChanges : () => setEditing(true)}
            />

            <EditPassword
                visible={editPassword}
                onClose={() => setEditPassword(false)}
                onSuccess={() => {}}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center' },
    changePhoto: { textAlign: 'center', color: 'blue', marginTop: 8 },
    changePassword: { textAlign: 'center', color: 'blue', margin: 20 },
    label: { marginTop: 20, fontWeight: 'bold' },
    input: { borderBottomWidth: 1, borderBottomColor: '#ccc', padding: 5 },
    email: { paddingVertical: 10, color: '#555' },
    logoutButton: { position: "absolute", top: 20, right: 20 },
});

export default ProfileScreen;
