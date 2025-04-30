import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAccessToken } from '@/services/AuthStorage';
import ApiService from '@/services/ApiService';

const ProfileScreen = () => {
    const [profile, setProfile] = useState({
        handle: '',
        email: '',
        password: '',
        avatar: '',
    });
    const [editing, setEditing] = useState(false);

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
        const token = await getAccessToken();
        const body = {
            email: profile.email,
            handle: profile.handle.substring(1),
        };
        const response = await ApiService.patch('/user/me', body);
        if (response) {
            Alert.alert('Succès', 'Profil mis à jour.');
            setEditing(false);
        }
    };

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

            <Button
                title={editing ? 'Enregistrer' : 'Modifier'}
                onPress={editing ? saveChanges : () => setEditing(true)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center' },
    changePhoto: { textAlign: 'center', color: 'blue', marginTop: 8 },
    label: { marginTop: 20, fontWeight: 'bold' },
    input: { borderBottomWidth: 1, borderBottomColor: '#ccc', padding: 5 },
    email: { paddingVertical: 10, color: '#555' },
});

export default ProfileScreen;
